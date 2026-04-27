import os
import time
import json
import random
from bs4 import BeautifulSoup
from curl_cffi import requests

class Scraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }

    def format_output(self, title, body, source_url, community="Unknown"):
        # We enforce a standard return type for the orchestrator
        return {
            "title": str(title),
            "bodyText": str(body),
            "url": str(source_url),
            "community": str(community)
        }


class GitHubScraper(Scraper):
    def __init__(self, token):
        super().__init__()
        self.token = token
        self.endpoint = "https://api.github.com/graphql"

    def scrape(self, limit=15):
        if not self.token or self.token == "your_github_pat":
            print("[GitHub] Skipping: No valid GH_GRAPHQL_TOKEN found.")
            return []

        print("[GitHub] Extracting issues via optimized GraphQL...")
        self.headers["Authorization"] = f"Bearer {self.token}"
        
        # Multiple queries to capture different types of pain points
        queries = [
            'is:issue is:open label:enhancement sort:reactions-+1-desc',
            'is:issue is:open label:bug sort:reactions-+1-desc',
            'is:issue is:open label:"help wanted" sort:comments-desc',
            'is:issue is:open label:"good first issue" sort:reactions-+1-desc',
            'is:issue is:open "pain point" OR "wish there was" OR "frustrating" sort:created-desc',
        ]
        
        all_results = []
        per_query_limit = max(3, limit // len(queries))
        
        for search_query in queries:
            query = """
            {
              search(query: "%s", type: ISSUE, first: %d) {
                nodes {
                  ... on Issue {
                    title
                    bodyText
                    url
                    comments(first: 3) {
                      nodes {
                        bodyText
                      }
                    }
                  }
                }
              }
            }
            """ % (search_query, per_query_limit)
            
            try:
                response = requests.post(self.endpoint, json={'query': query}, headers=self.headers, impersonate="chrome120")
                if response.status_code != 200:
                    print(f"[GitHub] Error: HTTP {response.status_code} - {response.text[:200]}")
                    continue

                nodes = response.json().get('data', {}).get('search', {}).get('nodes', [])
                for node in nodes:
                    if not node: continue
                    body = node.get('bodyText') or ''
                    comments = node.get('comments', {}).get('nodes') or []
                    for comment in comments:
                        if comment and comment.get('bodyText'):
                            body += "\n\n[Comment]: " + comment.get('bodyText', '')
                    all_results.append(self.format_output(node.get('title'), body, node.get('url'), "GitHub"))
                    
                time.sleep(0.5)
            except Exception as e:
                print(f"[GitHub] Query error: {e}")
                
        return all_results

class StackExchangeScraper(Scraper):
    def __init__(self):
        super().__init__()
        self.base_url = "https://api.stackexchange.com/2.3/questions"

    def scrape(self, limit_per_tag=5):
        print("[StackExchange] Extracting via multi-tag requests...")
        # Expanded tag list covering more developer ecosystems
        tags = [
            "python", "reactjs", "docker", "postgres", "typescript",
            "kubernetes", "next.js", "rust", "golang", "aws",
            "mongodb", "redis", "graphql", "terraform", "ci-cd"
        ]
        
        # Rotate sort strategies to get different results each run
        sort_strategies = ["votes", "activity", "creation"]
        chosen_sort = random.choice(sort_strategies)
        
        results = []

        for tag in tags:
            params = {
                "order": "desc",
                "sort": chosen_sort,
                "tagged": tag,
                "site": "stackoverflow",
                "filter": "withbody",
                "pagesize": limit_per_tag,
                "page": random.randint(1, 3)  # Randomize page to avoid always getting the same top results
            }
            try:
                response = requests.get(self.base_url, params=params, impersonate="chrome120")
                data = response.json()

                if "backoff" in data:
                    print(f"[StackExchange] Backoff requested. Sleeping {data['backoff']} seconds.")
                    time.sleep(data["backoff"])

                for item in data.get('items', []):
                    results.append(self.format_output(
                        item.get('title'), 
                        item.get('body_markdown', item.get('body', '')), 
                        item.get('link'),
                        "StackOverflow"
                    ))
            except Exception as e:
                print(f"[StackExchange] Error fetching tag {tag}: {e}")

            time.sleep(0.8)
            
        return results


class DiscourseScraper(Scraper):
    def __init__(self, base_url="https://meta.discourse.org"):
        super().__init__()
        self.base_url = base_url

    def scrape(self, limit=8):
        print(f"[Discourse] Extracting from {self.base_url}...")
        results = []
        
        # Try multiple categories
        categories = ["feature", "bug", "support"]
        per_cat = max(2, limit // len(categories))
        
        for category in categories:
            try:
                response = requests.get(f"{self.base_url}/c/{category}.json", headers=self.headers, impersonate="chrome120")
                if response.status_code != 200:
                    continue
                    
                topics = response.json().get('topic_list', {}).get('topics', [])

                for topic in topics[:per_cat]:
                    try:
                        topic_id = topic.get('id')
                        topic_slug = topic.get('slug')
                        if not topic_id or not topic_slug: continue
                        url = f"{self.base_url}/t/{topic_slug}/{topic_id}.json?print=true"
                        
                        topic_resp = requests.get(url, headers=self.headers, impersonate="chrome120")
                        post_data = topic_resp.json()
                        
                        title = post_data.get('title', '')
                        body = ""
                        for post in post_data.get('post_stream', {}).get('posts', [])[:5]:
                            body += "\n" + post.get('cooked', '')
                        
                        source_url = f"{self.base_url}/t/{topic_slug}/{topic_id}"
                        results.append(self.format_output(title, body, source_url, "Discourse"))
                        time.sleep(0.5)
                    except Exception as e:
                        print(f"[Discourse] Topic fetch error: {e}")

            except Exception as e:
                print(f"[Discourse] Category '{category}' error: {e}")

        return results


class HackerNewsScraper(Scraper):
    def __init__(self):
        super().__init__()
        self.base_url = "https://hacker-news.firebaseio.com/v0"

    def scrape(self, limit=10):
        print("[Hacker News] Extracting technical discourse via Firebase API...")
        results = []
        
        # Scrape both Ask HN and Show HN for different types of content
        endpoints = [
            ("askstories", "Ask HN"),
            ("showstories", "Show HN"),
            ("topstories", "Top Stories"),
        ]
        
        per_endpoint = max(3, limit // len(endpoints))
        
        for endpoint, label in endpoints:
            try:
                resp = requests.get(f"{self.base_url}/{endpoint}.json", impersonate="chrome120")
                story_ids = resp.json()
                
                # Random offset to get different stories each run
                offset = random.randint(0, max(0, min(len(story_ids) - per_endpoint, 30)))
                story_ids = story_ids[offset:offset + per_endpoint]

                for sid in story_ids:
                    try:
                        story_resp = requests.get(f"{self.base_url}/item/{sid}.json", impersonate="chrome120")
                        story = story_resp.json()
                        
                        if not story or story.get('deleted') or story.get('dead'): continue
                        
                        title = story.get('title', '')
                        body = story.get('text', '') or ''
                        
                        # Walk down children array
                        kids = story.get('kids') or []
                        for kid_id in kids[:5]:
                            try:
                                kid_resp = requests.get(f"{self.base_url}/item/{kid_id}.json", impersonate="chrome120")
                                kid = kid_resp.json()
                                if kid and kid.get('text') and not kid.get('deleted'):
                                     body += "\n\n[Comment]: " + kid.get('text', '')
                            except Exception as e:
                                 print(f"[Hacker News] Kid fetch error: {e}")
                        
                        source_url = f"https://news.ycombinator.com/item?id={sid}"
                        results.append(self.format_output(title, body, source_url, "Hacker News"))
                    except Exception as e:
                        print(f"[Hacker News] Story fetch error: {e}")
                    
            except Exception as e:
                print(f"[Hacker News] {label} fetch error: {e}")

        return results


class RedditScraper(Scraper):
    def scrape(self, limit=5):
        print("[Reddit] Extracting workflow complaints via JSON endpoints...")
        results = []
        self.headers["User-Agent"] = "DevelopersParadiseBot/1.0 (Data Extraction for Developer Pain Points)"
        
        # Expanded subreddit + query combinations for broader coverage
        queries = [
            ("SaaS", "pain point"),
            ("webdev", "wish there was a tool"),
            ("developersIndia", "feature request"),
            ("programming", "frustrating"),
            ("devops", "annoying"),
            ("node", "bug OR broken OR issue"),
            ("reactjs", "workaround OR hack"),
            ("golang", "missing feature"),
            ("rust", "ergonomics"),
            ("selfhosted", "alternative to"),
            ("opensource", "looking for"),
            ("django", "annoying"),
            ("flask", "limitation"),
            ("nextjs", "issue OR bug OR workaround"),
            ("typescript", "pain point OR frustrating"),
        ]
        
        # Randomize to avoid always hitting the same subreddits first
        random.shuffle(queries)
        queries = queries[:8]  # Pick 8 random combos per run
        
        for sub, query in queries:
            try:
                # Rotate time windows to get different results
                time_filter = random.choice(["month", "year", "week"])
                url = f"https://www.reddit.com/r/{sub}/search.json?q={query}&restrict_sr=on&sort=relevance&t={time_filter}"
                resp = requests.get(url, headers=self.headers, impersonate="chrome120")
                if resp.status_code == 429:
                    print(f"[Reddit] Rate limited on r/{sub}. Sleeping...")
                    time.sleep(5)
                    continue
                if resp.status_code != 200:
                    continue
                
                data = resp.json()
                posts = data.get('data', {}).get('children', [])[:limit]
                
                for post in posts:
                    pdata = post.get('data', {})
                    title = pdata.get('title', '')
                    body = pdata.get('selftext', '')
                    permalink = pdata.get('permalink', '')
                    if title and body and len(body) > 50:  # Filter out low-effort posts
                        source_url = f"https://www.reddit.com{permalink}"
                        results.append(self.format_output(title, body, source_url, f"Reddit r/{sub}"))
            except Exception as e:
                print(f"[Reddit] Error on r/{sub}: {e}")
            time.sleep(1.5)
            
        return results

class LobstersScraper(Scraper):
    def scrape(self, limit=8):
        print("[Lobste.rs] Extracting technical threads...")
        results = []
        
        # Hit multiple endpoints for variety
        endpoints = ["hottest", "newest", "active"]
        per_endpoint = max(2, limit // len(endpoints))
        
        for endpoint in endpoints:
            try:
                resp = requests.get(f"https://lobste.rs/{endpoint}.json", headers=self.headers, impersonate="chrome120")
                stories = resp.json()
                
                # Random offset
                offset = random.randint(0, max(0, len(stories) - per_endpoint))
                stories = stories[offset:offset + per_endpoint]
                
                for story in stories:
                    title = story.get('title', '')
                    body = story.get('description', '') or story.get('comment_text', '')
                    comments_url = story.get('comments_url', '')
                    
                    # If no body, try to fetch from comments
                    if not body and story.get('short_id'):
                        try:
                            detail_resp = requests.get(f"https://lobste.rs/s/{story['short_id']}.json", headers=self.headers, impersonate="chrome120")
                            detail = detail_resp.json()
                            comments = detail.get('comments', [])
                            for c in comments[:3]:
                                if c.get('comment_plain'):
                                    body += "\n\n[Comment]: " + c['comment_plain']
                        except:
                            pass
                    
                    if title:
                        results.append(self.format_output(title, body, comments_url, "Lobste.rs"))
            except Exception as e:
                print(f"[Lobste.rs] Error on {endpoint}: {e}")
                
        return results


class GitHubDiscussionsScraper(Scraper):
    """Scrapes GitHub Discussions — a goldmine of developer feature requests and pain points."""
    def __init__(self, token):
        super().__init__()
        self.token = token
        self.endpoint = "https://api.github.com/graphql"

    def scrape(self, limit=10):
        if not self.token or self.token == "your_github_pat":
            print("[GitHub Discussions] Skipping: No valid token.")
            return []
        
        print("[GitHub Discussions] Extracting feature requests and pain points...")
        self.headers["Authorization"] = f"Bearer {self.token}"
        
        # Target popular repos with active discussions
        repos = [
            ("vercel", "next.js"),
            ("prisma", "prisma"),
            ("tailwindlabs", "tailwindcss"),
            ("supabase", "supabase"),
            ("denoland", "deno"),
        ]
        
        all_results = []
        per_repo = max(2, limit // len(repos))
        
        for owner, repo in repos:
            query = """
            {
              repository(owner: "%s", name: "%s") {
                discussions(first: %d, orderBy: {field: CREATED_AT, direction: DESC}, categoryFilter: {}) {
                  nodes {
                    title
                    bodyText
                    url
                    category { name }
                    comments(first: 3) {
                      nodes {
                        bodyText
                      }
                    }
                  }
                }
              }
            }
            """ % (owner, repo, per_repo)
            
            try:
                response = requests.post(self.endpoint, json={'query': query}, headers=self.headers, impersonate="chrome120")
                if response.status_code != 200:
                    continue
                    
                nodes = response.json().get('data', {}).get('repository', {}).get('discussions', {}).get('nodes', [])
                for node in nodes:
                    if not node: continue
                    body = node.get('bodyText') or ''
                    comments = node.get('comments', {}).get('nodes') or []
                    for comment in comments:
                        if comment and comment.get('bodyText'):
                            body += "\n\n[Comment]: " + comment.get('bodyText', '')
                    
                    category = node.get('category', {}).get('name', '')
                    all_results.append(self.format_output(
                        f"[{owner}/{repo}] {node.get('title', '')}",
                        f"Category: {category}\n\n{body}",
                        node.get('url', ''),
                        f"GitHub Discussions ({owner}/{repo})"
                    ))
                    
                time.sleep(0.3)
            except Exception as e:
                print(f"[GitHub Discussions] Error on {owner}/{repo}: {e}")
                
        return all_results


class DevToScraper(Scraper):
    """Scrapes Dev.to articles tagged with common developer pain point topics."""
    def scrape(self, limit=10):
        print("[Dev.to] Extracting developer articles and discussions...")
        results = []
        
        tags = ["devtools", "opensource", "webdev", "discuss", "productivity", "beginners"]
        per_tag = max(2, limit // len(tags))
        
        for tag in tags:
            try:
                page = random.randint(1, 5)
                url = f"https://dev.to/api/articles?tag={tag}&per_page={per_tag}&page={page}&top=7"
                resp = requests.get(url, headers=self.headers, impersonate="chrome120")
                
                if resp.status_code != 200:
                    continue
                    
                articles = resp.json()
                for article in articles:
                    title = article.get('title', '')
                    body = article.get('description', '')
                    article_url = article.get('url', '')
                    
                    # Fetch full article body if available
                    if article.get('id'):
                        try:
                            detail_resp = requests.get(f"https://dev.to/api/articles/{article['id']}", headers=self.headers, impersonate="chrome120")
                            if detail_resp.status_code == 200:
                                body = detail_resp.json().get('body_markdown', body)[:4000]
                        except:
                            pass
                    
                    if title and body:
                        results.append(self.format_output(title, body, article_url, "Dev.to"))
                        
            except Exception as e:
                print(f"[Dev.to] Error on tag {tag}: {e}")
            time.sleep(0.5)
            
        return results


class EnterpriseReviewScraper(Scraper):
    def scrape(self, limit=3):
        print("[Enterprise Tier 3] Extracting pain points via TLS-Spoofed DOM Parsing...")
        results = []
        targets = ["www.docker.com", "vercel.com", "netlify.com"]
        for target in targets:
            try:
                url = f"https://www.trustpilot.com/review/{target}?stars=1&stars=2"
                resp = requests.get(url, headers=self.headers, impersonate="chrome120")
                
                if resp.status_code != 200:
                    print(f"[Enterprise] Access denied or error on {target}: HTTP {resp.status_code}")
                    continue
                    
                soup = BeautifulSoup(resp.text, 'html.parser')

                next_data = soup.find('script', id='__NEXT_DATA__', type='application/json')
                if next_data:
                    blob = json.loads(next_data.string)
                    raw_string = json.dumps(blob)[:4000]
                    results.append(self.format_output(f"Enterprise Complaints: {target}", raw_string, url, f"Trustpilot ({target})"))
                else:
                    text_content = " ".join([p.text for p in soup.find_all('p')])[:4000]
                    if text_content:
                        results.append(self.format_output(f"Enterprise Complaints: {target}", text_content, url, f"Trustpilot ({target})"))

            except Exception as e:
                print(f"[Enterprise] Error on {target}: {e}")
            time.sleep(2)
        return results

def get_all_scraped_data(github_token):
    print("=" * 60)
    print("Starting multi-source ingestion pipeline (HIGH VOLUME)...")
    print("=" * 60)
    all_results = []
    
    scrapers = [
        ("GitHub Issues",      lambda: GitHubScraper(github_token).scrape(limit=15)),
        ("GitHub Discussions",  lambda: GitHubDiscussionsScraper(github_token).scrape(limit=10)),
        ("StackExchange",      lambda: StackExchangeScraper().scrape(limit_per_tag=5)),
        ("Discourse",          lambda: DiscourseScraper().scrape(limit=8)),
        ("Hacker News",        lambda: HackerNewsScraper().scrape(limit=10)),
        ("Reddit",             lambda: RedditScraper().scrape(limit=5)),
        ("Lobste.rs",          lambda: LobstersScraper().scrape(limit=8)),
        ("Dev.to",             lambda: DevToScraper().scrape(limit=10)),
        ("Enterprise Reviews", lambda: EnterpriseReviewScraper().scrape()),
    ]
    
    for name, scrape_func in scrapers:
        try:
            results = scrape_func()
            count = len(results) if results else 0
            print(f"  ✓ {name}: {count} items scraped")
            if results:
                all_results.extend(results)
        except Exception as e:
            print(f"  ✗ {name} FAILED: {e}")
    
    print(f"\n{'=' * 60}")
    print(f"TOTAL RAW ITEMS SCRAPED: {len(all_results)}")
    print(f"{'=' * 60}")
    return all_results
