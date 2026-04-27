import os
import time
import json
import random
import asyncio
import feedparser
from bs4 import BeautifulSoup
from curl_cffi import requests as cffi_requests
import aiohttp

class Scraper:
    """Base scraper class with standardized output format."""
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }

    def format_output(self, title, body, source_url, community="Unknown"):
        return {
            "title": str(title or ""),
            "bodyText": str(body or ""),
            "url": str(source_url or ""),
            "community": str(community)
        }


# =============================================================================
# ASYNC SCRAPERS (using aiohttp for concurrent HTTP)
# =============================================================================

class GitHubScraper(Scraper):
    """GitHub Issues via GraphQL — multiple query strategies for breadth."""
    def __init__(self, token):
        super().__init__()
        self.token = token
        self.endpoint = "https://api.github.com/graphql"

    async def scrape(self, session: aiohttp.ClientSession, limit=15):
        if not self.token or self.token == "your_github_pat":
            print("[GitHub] Skipping: No valid GH_GRAPHQL_TOKEN found.")
            return []

        print("[GitHub Issues] Extracting via multiple GraphQL query strategies...")
        headers = {**self.headers, "Authorization": f"Bearer {self.token}"}

        queries = [
            'is:issue is:open label:enhancement sort:reactions-+1-desc',
            'is:issue is:open label:bug sort:reactions-+1-desc',
            'is:issue is:open label:"help wanted" sort:comments-desc',
            'is:issue is:open "pain point" OR "wish there was" OR "frustrating" sort:created-desc',
        ]

        all_results = []
        per_query = max(3, limit // len(queries))

        for search_query in queries:
            gql = """
            {
              search(query: "%s", type: ISSUE, first: %d) {
                nodes {
                  ... on Issue {
                    title
                    bodyText
                    url
                    comments(first: 3) { nodes { bodyText } }
                  }
                }
              }
            }
            """ % (search_query, per_query)

            try:
                async with session.post(self.endpoint, json={'query': gql}, headers=headers) as resp:
                    if resp.status != 200:
                        continue
                    data = await resp.json()
                    nodes = data.get('data', {}).get('search', {}).get('nodes', [])
                    for node in nodes:
                        if not node: continue
                        body = node.get('bodyText') or ''
                        for c in (node.get('comments', {}).get('nodes') or []):
                            if c and c.get('bodyText'):
                                body += "\n\n[Comment]: " + c['bodyText']
                        all_results.append(self.format_output(node.get('title'), body, node.get('url'), "GitHub"))
                await asyncio.sleep(0.3)
            except Exception as e:
                print(f"[GitHub Issues] Query error: {e}")

        return all_results


class GitHubDiscussionsScraper(Scraper):
    """GitHub Discussions from high-signal repos — feature requests goldmine."""
    def __init__(self, token):
        super().__init__()
        self.token = token
        self.endpoint = "https://api.github.com/graphql"

    async def scrape(self, session: aiohttp.ClientSession, limit=10):
        if not self.token or self.token == "your_github_pat":
            return []

        print("[GitHub Discussions] Extracting from major repos...")
        headers = {**self.headers, "Authorization": f"Bearer {self.token}"}

        repos = [
            ("vercel", "next.js"), ("prisma", "prisma"),
            ("tailwindlabs", "tailwindcss"), ("supabase", "supabase"),
            ("denoland", "deno"), ("vitejs", "vite"),
        ]

        all_results = []
        per_repo = max(2, limit // len(repos))

        for owner, repo in repos:
            gql = """
            {
              repository(owner: "%s", name: "%s") {
                discussions(first: %d, orderBy: {field: CREATED_AT, direction: DESC}) {
                  nodes {
                    title
                    bodyText
                    url
                    category { name }
                    comments(first: 3) { nodes { bodyText } }
                  }
                }
              }
            }
            """ % (owner, repo, per_repo)

            try:
                async with session.post(self.endpoint, json={'query': gql}, headers=headers) as resp:
                    if resp.status != 200:
                        continue
                    data = await resp.json()
                    nodes = data.get('data', {}).get('repository', {}).get('discussions', {}).get('nodes', [])
                    for node in nodes:
                        if not node: continue
                        body = node.get('bodyText') or ''
                        for c in (node.get('comments', {}).get('nodes') or []):
                            if c and c.get('bodyText'):
                                body += "\n\n[Comment]: " + c['bodyText']
                        cat = node.get('category', {}).get('name', '')
                        all_results.append(self.format_output(
                            f"[{owner}/{repo}] {node.get('title', '')}",
                            f"Category: {cat}\n\n{body}",
                            node.get('url', ''),
                            f"GitHub Discussions ({owner}/{repo})"
                        ))
                await asyncio.sleep(0.2)
            except Exception as e:
                print(f"[GitHub Discussions] Error on {owner}/{repo}: {e}")

        return all_results


class StackExchangeScraper(Scraper):
    """StackOverflow via REST API — multi-tag, randomized pagination."""
    async def scrape(self, session: aiohttp.ClientSession, limit_per_tag=5):
        print("[StackExchange] Extracting via multi-tag requests...")
        tags = [
            "python", "reactjs", "docker", "postgres", "typescript",
            "kubernetes", "next.js", "rust", "golang", "aws",
            "mongodb", "redis", "graphql", "terraform", "ci-cd"
        ]

        sort_strategy = random.choice(["votes", "activity", "creation"])
        results = []

        for tag in tags:
            params = {
                "order": "desc", "sort": sort_strategy,
                "tagged": tag, "site": "stackoverflow",
                "filter": "withbody", "pagesize": limit_per_tag,
                "page": random.randint(1, 3)
            }
            try:
                async with session.get("https://api.stackexchange.com/2.3/questions", params=params) as resp:
                    data = await resp.json()
                    if "backoff" in data:
                        await asyncio.sleep(data["backoff"])
                    for item in data.get('items', []):
                        results.append(self.format_output(
                            item.get('title'),
                            item.get('body_markdown', item.get('body', '')),
                            item.get('link'),
                            "StackOverflow"
                        ))
            except Exception as e:
                print(f"[StackExchange] Error on tag {tag}: {e}")
            await asyncio.sleep(0.5)

        return results


class HackerNewsScraper(Scraper):
    """HackerNews via Firebase API — Ask HN, Show HN, and Top Stories with random offsets."""
    async def scrape(self, session: aiohttp.ClientSession, limit=10):
        print("[Hacker News] Extracting via Firebase API...")
        results = []
        base = "https://hacker-news.firebaseio.com/v0"

        endpoints = [("askstories", "Ask HN"), ("showstories", "Show HN"), ("topstories", "Top")]
        per_ep = max(3, limit // len(endpoints))

        for ep, label in endpoints:
            try:
                async with session.get(f"{base}/{ep}.json") as resp:
                    story_ids = await resp.json()
                    offset = random.randint(0, max(0, min(len(story_ids) - per_ep, 30)))
                    story_ids = story_ids[offset:offset + per_ep]

                for sid in story_ids:
                    try:
                        async with session.get(f"{base}/item/{sid}.json") as resp:
                            story = await resp.json()
                            if not story or story.get('deleted') or story.get('dead'):
                                continue
                            title = story.get('title', '')
                            body = story.get('text', '') or ''
                            for kid_id in (story.get('kids') or [])[:5]:
                                try:
                                    async with session.get(f"{base}/item/{kid_id}.json") as kr:
                                        kid = await kr.json()
                                        if kid and kid.get('text') and not kid.get('deleted'):
                                            body += "\n\n[Comment]: " + kid['text']
                                except:
                                    pass
                            results.append(self.format_output(title, body, f"https://news.ycombinator.com/item?id={sid}", "Hacker News"))
                    except Exception as e:
                        print(f"[HN] Story error: {e}")
            except Exception as e:
                print(f"[HN] {label} error: {e}")

        return results


class RedditScraper(Scraper):
    """Reddit via public JSON endpoints — wide subreddit coverage with randomized selection."""
    async def scrape(self, session: aiohttp.ClientSession, limit=5):
        print("[Reddit] Extracting developer pain points...")
        results = []
        headers = {**self.headers, "User-Agent": "DevelopersParadiseBot/2.0"}

        queries = [
            ("SaaS", "pain point"), ("webdev", "wish there was a tool"),
            ("developersIndia", "feature request"), ("programming", "frustrating"),
            ("devops", "annoying"), ("node", "bug OR broken"),
            ("reactjs", "workaround"), ("golang", "missing feature"),
            ("rust", "ergonomics"), ("selfhosted", "alternative to"),
            ("opensource", "looking for"), ("nextjs", "issue OR workaround"),
            ("typescript", "pain point"), ("django", "annoying"),
            ("flask", "limitation"),
        ]

        random.shuffle(queries)
        selected = queries[:8]

        for sub, query in selected:
            try:
                t_filter = random.choice(["month", "year", "week"])
                url = f"https://www.reddit.com/r/{sub}/search.json?q={query}&restrict_sr=on&sort=relevance&t={t_filter}"
                async with session.get(url, headers=headers) as resp:
                    if resp.status == 429:
                        await asyncio.sleep(5)
                        continue
                    if resp.status != 200:
                        continue
                    data = await resp.json()
                    for post in data.get('data', {}).get('children', [])[:limit]:
                        pd = post.get('data', {})
                        title, body = pd.get('title', ''), pd.get('selftext', '')
                        permalink = pd.get('permalink', '')
                        if title and body and len(body) > 50:
                            results.append(self.format_output(title, body, f"https://www.reddit.com{permalink}", f"Reddit r/{sub}"))
            except Exception as e:
                print(f"[Reddit] Error on r/{sub}: {e}")
            await asyncio.sleep(1.5)

        return results


class LobstersScraper(Scraper):
    """Lobste.rs via JSON API — hottest, newest, and active with comment fetching."""
    async def scrape(self, session: aiohttp.ClientSession, limit=8):
        print("[Lobste.rs] Extracting technical threads...")
        results = []
        endpoints = ["hottest", "newest", "active"]
        per_ep = max(2, limit // len(endpoints))

        for ep in endpoints:
            try:
                async with session.get(f"https://lobste.rs/{ep}.json", headers=self.headers) as resp:
                    stories = await resp.json()
                    offset = random.randint(0, max(0, len(stories) - per_ep))
                    for story in stories[offset:offset + per_ep]:
                        title = story.get('title', '')
                        body = story.get('description', '') or ''
                        if not body and story.get('short_id'):
                            try:
                                async with session.get(f"https://lobste.rs/s/{story['short_id']}.json", headers=self.headers) as dr:
                                    detail = await dr.json()
                                    for c in detail.get('comments', [])[:3]:
                                        if c.get('comment_plain'):
                                            body += "\n\n[Comment]: " + c['comment_plain']
                            except:
                                pass
                        if title:
                            results.append(self.format_output(title, body, story.get('comments_url', ''), "Lobste.rs"))
            except Exception as e:
                print(f"[Lobste.rs] Error: {e}")

        return results


class DevToScraper(Scraper):
    """Dev.to via REST API — tagged articles with full body fetching."""
    async def scrape(self, session: aiohttp.ClientSession, limit=10):
        print("[Dev.to] Extracting developer articles...")
        results = []
        tags = ["devtools", "opensource", "webdev", "discuss", "productivity", "beginners"]
        per_tag = max(2, limit // len(tags))

        for tag in tags:
            try:
                page = random.randint(1, 5)
                url = f"https://dev.to/api/articles?tag={tag}&per_page={per_tag}&page={page}&top=7"
                async with session.get(url, headers=self.headers) as resp:
                    if resp.status != 200:
                        continue
                    articles = await resp.json()
                    for article in articles:
                        title = article.get('title', '')
                        body = article.get('description', '')
                        art_url = article.get('url', '')
                        if article.get('id'):
                            try:
                                async with session.get(f"https://dev.to/api/articles/{article['id']}", headers=self.headers) as dr:
                                    if dr.status == 200:
                                        body = (await dr.json()).get('body_markdown', body)[:4000]
                            except:
                                pass
                        if title and body:
                            results.append(self.format_output(title, body, art_url, "Dev.to"))
            except Exception as e:
                print(f"[Dev.to] Error on tag {tag}: {e}")
            await asyncio.sleep(0.3)

        return results


class DiscourseScraper(Scraper):
    """Discourse forums via JSON API."""
    async def scrape(self, session: aiohttp.ClientSession, limit=8):
        print("[Discourse] Extracting from meta.discourse.org...")
        results = []
        categories = ["feature", "bug", "support"]
        per_cat = max(2, limit // len(categories))

        for cat in categories:
            try:
                async with session.get(f"https://meta.discourse.org/c/{cat}.json", headers=self.headers) as resp:
                    if resp.status != 200:
                        continue
                    topics = (await resp.json()).get('topic_list', {}).get('topics', [])
                    for topic in topics[:per_cat]:
                        tid = topic.get('id')
                        tslug = topic.get('slug')
                        if not tid or not tslug:
                            continue
                        try:
                            url = f"https://meta.discourse.org/t/{tslug}/{tid}.json?print=true"
                            async with session.get(url, headers=self.headers) as tr:
                                td = await tr.json()
                                title = td.get('title', '')
                                body = "\n".join(p.get('cooked', '') for p in td.get('post_stream', {}).get('posts', [])[:5])
                                src = f"https://meta.discourse.org/t/{tslug}/{tid}"
                                results.append(self.format_output(title, body, src, "Discourse"))
                            await asyncio.sleep(0.3)
                        except Exception as e:
                            print(f"[Discourse] Topic error: {e}")
            except Exception as e:
                print(f"[Discourse] Category error: {e}")

        return results


class RSSFeedScraper(Scraper):
    """RSS/Atom feed aggregator — frictionless ingestion from dev blogs and changelogs."""
    async def scrape(self, session: aiohttp.ClientSession, limit=15):
        print("[RSS Feeds] Aggregating developer blog and changelog feeds...")
        results = []

        feeds = [
            ("https://github.blog/feed/", "GitHub Blog"),
            ("https://vercel.com/atom", "Vercel Blog"),
            ("https://blog.rust-lang.org/feed.xml", "Rust Blog"),
            ("https://devblogs.microsoft.com/typescript/feed/", "TypeScript Blog"),
            ("https://blog.golang.org/feed.atom", "Go Blog"),
            ("https://nodejs.org/en/feed/blog.xml", "Node.js Blog"),
            ("https://www.docker.com/blog/feed/", "Docker Blog"),
            ("https://supabase.com/blog/rss.xml", "Supabase Blog"),
        ]

        for feed_url, name in feeds:
            try:
                async with session.get(feed_url, headers=self.headers) as resp:
                    if resp.status != 200:
                        continue
                    content = await resp.text()
                    feed = feedparser.parse(content)
                    per_feed = max(1, limit // len(feeds))
                    for entry in feed.entries[:per_feed]:
                        title = entry.get('title', '')
                        body = entry.get('summary', entry.get('description', ''))[:4000]
                        link = entry.get('link', '')
                        if title and body:
                            results.append(self.format_output(title, body, link, name))
            except Exception as e:
                print(f"[RSS] Error on {name}: {e}")

        return results


# =============================================================================
# SYNC SCRAPER (requires curl_cffi TLS spoofing — cannot use aiohttp)
# =============================================================================

class EnterpriseReviewScraper(Scraper):
    """Enterprise review scraper using TLS fingerprint spoofing (sync, runs in executor)."""
    def scrape_sync(self, limit=3):
        print("[Enterprise] Extracting via TLS-spoofed DOM parsing...")
        results = []
        targets = ["www.docker.com", "vercel.com", "netlify.com"]
        for target in targets:
            try:
                url = f"https://www.trustpilot.com/review/{target}?stars=1&stars=2"
                resp = cffi_requests.get(url, headers=self.headers, impersonate="chrome120")
                if resp.status_code != 200:
                    continue
                soup = BeautifulSoup(resp.text, 'html.parser')
                nd = soup.find('script', id='__NEXT_DATA__', type='application/json')
                if nd:
                    raw = json.dumps(json.loads(nd.string))[:4000]
                    results.append(self.format_output(f"Enterprise Complaints: {target}", raw, url, f"Trustpilot ({target})"))
                else:
                    text = " ".join(p.text for p in soup.find_all('p'))[:4000]
                    if text:
                        results.append(self.format_output(f"Enterprise Complaints: {target}", text, url, f"Trustpilot ({target})"))
            except Exception as e:
                print(f"[Enterprise] Error on {target}: {e}")
            time.sleep(2)
        return results


# =============================================================================
# ORCHESTRATOR — Runs all scrapers concurrently via asyncio.gather
# =============================================================================

async def get_all_scraped_data(github_token):
    print("=" * 60)
    print("PIPELINE V2 — Async Multi-Source Ingestion")
    print("=" * 60)

    connector = aiohttp.TCPConnector(limit=50, ssl=False)
    timeout = aiohttp.ClientTimeout(total=30)

    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        # Launch all async scrapers concurrently
        tasks = {
            "GitHub Issues":      GitHubScraper(github_token).scrape(session, limit=15),
            "GitHub Discussions":  GitHubDiscussionsScraper(github_token).scrape(session, limit=10),
            "StackExchange":      StackExchangeScraper().scrape(session, limit_per_tag=5),
            "Hacker News":        HackerNewsScraper().scrape(session, limit=10),
            "Reddit":             RedditScraper().scrape(session, limit=5),
            "Lobste.rs":          LobstersScraper().scrape(session, limit=8),
            "Dev.to":             DevToScraper().scrape(session, limit=10),
            "Discourse":          DiscourseScraper().scrape(session, limit=8),
            "RSS Feeds":          RSSFeedScraper().scrape(session, limit=15),
        }

        named_results = {}
        gathered = await asyncio.gather(*tasks.values(), return_exceptions=True)
        for name, result in zip(tasks.keys(), gathered):
            if isinstance(result, Exception):
                print(f"  X {name} FAILED: {result}")
                named_results[name] = []
            else:
                named_results[name] = result or []

    # Run TLS-spoofed enterprise scraper in a thread executor (sync → async bridge)
    loop = asyncio.get_event_loop()
    try:
        enterprise_results = await loop.run_in_executor(None, EnterpriseReviewScraper().scrape_sync)
        named_results["Enterprise Reviews"] = enterprise_results or []
    except Exception as e:
        print(f"  X Enterprise Reviews FAILED: {e}")
        named_results["Enterprise Reviews"] = []

    # Aggregate and report
    all_results = []
    for name, items in named_results.items():
        count = len(items)
        marker = "+" if count > 0 else "-"
        print(f"  {marker} {name}: {count} items")
        all_results.extend(items)

    print(f"\n{'=' * 60}")
    print(f"TOTAL RAW ITEMS SCRAPED: {len(all_results)}")
    print(f"{'=' * 60}")
    return all_results
