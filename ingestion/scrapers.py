import os
import time
import json
from bs4 import BeautifulSoup
from curl_cffi import requests

class Scraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }

    def format_output(self, title, body, source_url):
        # We enforce a standard return type for the orchestrator
        return {
            "title": str(title),
            "bodyText": str(body),
            "url": str(source_url)
        }


class GitHubScraper(Scraper):
    def __init__(self, token):
        super().__init__()
        self.token = token
        self.endpoint = "https://api.github.com/graphql"

    def scrape(self, limit=5):
        if not self.token or self.token == "your_github_pat":
            print("[GitHub] Skipping: No valid GH_GRAPHQL_TOKEN found.")
            return []

        print("[GitHub] Extracting issues via optimized GraphQL...")
        self.headers["Authorization"] = f"Bearer {self.token}"
        query = """
        {
          search(query: "is:issue is:open label:enhancement sort:reactions-+1-desc", type: ISSUE, first: %d) {
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
        """ % limit
        
        try:
            response = requests.post(self.endpoint, json={'query': query}, headers=self.headers, impersonate="chrome120")
            if response.status_code != 200:
                print(f"[GitHub] Error: HTTP {response.status_code} - {response.text}")
                return []

            results = []
            nodes = response.json().get('data', {}).get('search', {}).get('nodes', [])
            for node in nodes:
                if not node: continue
                body = node.get('bodyText') or ''
                comments = node.get('comments', {}).get('nodes') or []
                for comment in comments:
                    if comment and comment.get('bodyText'):
                        body += "\n\n[Comment]: " + comment.get('bodyText', '')
                results.append(self.format_output(node.get('title'), body, node.get('url')))
                
            return results
        except Exception as e:
            print(f"[GitHub] Fatal execution error: {e}")
            return []

class StackExchangeScraper(Scraper):
    def __init__(self):
        super().__init__()
        self.base_url = "https://api.stackexchange.com/2.3/questions"

    def scrape(self, limit_per_tag=2):
        print("[StackExchange] Extracting via OR-based tag requests...")
        tags = ["python", "reactjs", "docker", "postgres"] # Using highly popular dev tags
        results = []

        for tag in tags:
            params = {
                "order": "desc",
                "sort": "votes",
                "tagged": tag,
                "site": "stackoverflow",
                "filter": "withbody", # Explicitly request body_markdown
                "pagesize": limit_per_tag
            }
            try:
                response = requests.get(self.base_url, params=params, impersonate="chrome120")
                data = response.json()

                if "backoff" in data:
                    print(f"[StackExchange] Backoff requested. Sleeping {data['backoff']} seconds.")
                    time.sleep(data["backoff"])

                for item in data.get('items', []):
                    results.append(self.format_output(item.get('title'), item.get('body_markdown', item.get('body', '')), item.get('link')))
            except Exception as e:
                print(f"[StackExchange] Error fetching tag {tag}: {e}")

            time.sleep(1) # Friendly pacing
            
        return results


class DiscourseScraper(Scraper):
    def __init__(self, base_url="https://meta.discourse.org"):
        super().__init__()
        self.base_url = base_url

    def scrape(self, limit=3):
        # Targeting the 'feature' category in a standard Discourse forum
        print(f"[Discourse] Extracting JSON via print=true pagination bypass from {self.base_url}...")
        results = []
        try:
            # Fetch latest feature topics
            response = requests.get(f"{self.base_url}/c/feature.json", headers=self.headers, impersonate="chrome120")
            topics = response.json().get('topic_list', {}).get('topics', [])

            for topic in topics[:limit]:
                try:
                    topic_id = topic.get('id')
                    topic_slug = topic.get('slug')
                    if not topic_id or not topic_slug: continue
                    # Append print=true to bypass standard 20-post chunk limit
                    url = f"{self.base_url}/t/{topic_slug}/{topic_id}.json?print=true"
                    
                    topic_resp = requests.get(url, headers=self.headers, impersonate="chrome120")
                    post_data = topic_resp.json()
                    
                    title = post_data.get('title', '')
                    body = ""
                    for post in post_data.get('post_stream', {}).get('posts', [])[:5]: # grab first 5 posts for context
                        body += "\n" + post.get('cooked', '')
                    
                    source_url = f"{self.base_url}/t/{topic_slug}/{topic_id}"
                    results.append(self.format_output(title, body, source_url))
                    time.sleep(1)
                except Exception as e:
                    print(f"[Discourse] Topic fetch error: {e}")

        except Exception as e:
            print(f"[Discourse] Initial fetch error: {e}")

        return results


class HackerNewsScraper(Scraper):
    def __init__(self):
        super().__init__()
        self.base_url = "https://hacker-news.firebaseio.com/v0"

    def scrape(self, limit=2):
        print("[Hacker News] Extracting technical discourse via Firebase API...")
        results = []
        try:
            # Target "Ask HN" for direct questions and pain points
            resp = requests.get(f"{self.base_url}/askstories.json", impersonate="chrome120")
            story_ids = resp.json()[:limit]

            for sid in story_ids:
                try:
                    story_resp = requests.get(f"{self.base_url}/item/{sid}.json", impersonate="chrome120")
                    story = story_resp.json()
                    
                    if not story or story.get('deleted'): continue
                    
                    title = story.get('title', '')
                    body = story.get('text', '') or ''
                    
                    # Walk down children array (Tier 1 tree traversal as per PDF)
                    kids = story.get('kids') or []
                    for kid_id in kids[:3]:
                        try:
                            kid_resp = requests.get(f"{self.base_url}/item/{kid_id}.json", impersonate="chrome120")
                            kid = kid_resp.json()
                            if kid and kid.get('text') and not kid.get('deleted'):
                                 body += "\n\n[Comment]: " + kid.get('text', '')
                        except Exception as e:
                             print(f"[Hacker News] Kid fetch error: {e}")
                    
                    source_url = f"https://news.ycombinator.com/item?id={sid}"
                    results.append(self.format_output(title, body, source_url))
                except Exception as e:
                    print(f"[Hacker News] Story fetch error: {e}")
                
        except Exception as e:
            print(f"[Hacker News] Initial fetch error: {e}")

        return results


class NextJsHydrationScraper(Scraper):
    def __init__(self):
        super().__init__()
        # Target a generic Next.js SSR site known for dev tools as proof of concept
        self.target_url = "https://react.dev/blog" 

    def scrape(self):
        print("[Next.js SSR] Extracting structured DOM from __NEXT_DATA__ hydration blob...")
        results = []
        try:
            resp = requests.get(self.target_url, headers=self.headers, impersonate="chrome120")
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # Extract Next.js Hydration Blob
            next_data = soup.find('script', id='__NEXT_DATA__', type='application/json')
            if next_data:
                blob = json.loads(next_data.string)
                # Note: Schema parsing here is site-specific. We just extract generic props for LLM.
                raw_data_string = json.dumps(blob.get('props', {}))[:3000] # Pass first 3k chars to LLM
                results.append(self.format_output("Next.js Hydration Dump", raw_data_string, self.target_url))
            else:
                 print("[Next.js SSR] __NEXT_DATA__ not found. Site may have migrated to App Router Server Components.")
                 
        except Exception as e:
             print(f"[Next.js SSR] Error: {e}")
             
        return results

class RedditScraper(Scraper):
    def scrape(self, limit=2):
        print("[Reddit] Extracting workflow complaints via JSON endpoints...")
        results = []
        # Reddit requires a unique User-Agent to avoid immediate 429 Too Many Requests
        self.headers["User-Agent"] = "DevelopersParadiseBot/1.0 (Data Extraction for Developer Pain Points)"
        
        # High-value subreddits and query combinations
        queries = [
            ("SaaS", "pain point"),
            ("webdev", "wish there was a tool"),
            ("developersIndia", "feature request")
        ]
        
        for sub, query in queries:
            try:
                url = f"https://www.reddit.com/r/{sub}/search.json?q={query}&restrict_sr=on&sort=relevance&t=year"
                resp = requests.get(url, headers=self.headers, impersonate="chrome120")
                if resp.status_code == 429:
                    print(f"[Reddit] Rate limited on r/{sub}.")
                    continue
                
                data = resp.json()
                posts = data.get('data', {}).get('children', [])[:limit]
                
                for post in posts:
                    pdata = post.get('data', {})
                    title = pdata.get('title', '')
                    body = pdata.get('selftext', '')
                    permalink = pdata.get('permalink', '')
                    if title and body:
                        source_url = f"https://www.reddit.com{permalink}"
                        results.append(self.format_output(title, body, source_url))
            except Exception as e:
                print(f"[Reddit] Error on r/{sub}: {e}")
            time.sleep(1.5) # Friendly pacing to respect Reddit API guidelines
            
        return results

class LobstersScraper(Scraper):
    def scrape(self, limit=3):
        print("[Lobste.rs] Extracting technical threads from hottest...")
        results = []
        try:
            resp = requests.get("https://lobste.rs/hottest.json", headers=self.headers, impersonate="chrome120")
            stories = resp.json()[:limit]
            for story in stories:
                title = story.get('title', '')
                body = story.get('description', '')
                comments_url = story.get('comments_url', '')
                if title:
                    results.append(self.format_output(title, body, comments_url))
        except Exception as e:
            print(f"[Lobste.rs] Error: {e}")
        return results

class EnterpriseReviewScraper(Scraper):
    def scrape(self, limit=3):
        print("[Enterprise Tier 3] Extracting pain points via TLS-Spoofed DOM Parsing...")
        results = []
        targets = ["www.docker.com", "vercel.com"]
        for target in targets:
            try:
                # Target 1-star and 2-star reviews for pure pain points on Trustpilot (uses Cloudflare)
                url = f"https://www.trustpilot.com/review/{target}?stars=1&stars=2"
                resp = requests.get(url, headers=self.headers, impersonate="chrome120")
                
                if resp.status_code != 200:
                    print(f"[Enterprise] Access denied or error on {target}: HTTP {resp.status_code}")
                    continue
                    
                soup = BeautifulSoup(resp.text, 'html.parser')

                # Trustpilot utilizes a NEXT_DATA hydration state we can tap into securely
                next_data = soup.find('script', id='__NEXT_DATA__', type='application/json')
                if next_data:
                    blob = json.loads(next_data.string)
                    raw_string = json.dumps(blob)[:4000] # Give Gemini a chunk to decipher
                    results.append(self.format_output(f"Enterprise Complaints: {target}", raw_string, url))
                else:
                    # Fallback DOM parser
                    text_content = " ".join([p.text for p in soup.find_all('p')])[:4000]
                    if text_content:
                        results.append(self.format_output(f"Enterprise Complaints: {target}", text_content, url))

            except Exception as e:
                print(f"[Enterprise] Error on {target}: {e}")
            time.sleep(2)
        return results

def get_all_scraped_data(github_token):
    print("Starting multi-source ingestion pipeline...")
    all_results = []
    
    scrapers = [
        lambda: GitHubScraper(github_token).scrape(limit=2),
        lambda: StackExchangeScraper().scrape(limit_per_tag=1),
        lambda: DiscourseScraper().scrape(limit=1),
        lambda: HackerNewsScraper().scrape(limit=1),
        lambda: RedditScraper().scrape(limit=1),
        lambda: LobstersScraper().scrape(limit=2),
        lambda: NextJsHydrationScraper().scrape(),
        lambda: EnterpriseReviewScraper().scrape()
    ]
    
    for scrape_func in scrapers:
        try:
            results = scrape_func()
            if results:
                all_results.extend(results)
        except Exception as e:
            print(f"Scraper Failed: {e}")
            
    return all_results
