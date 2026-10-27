"""Busca notícias da Billie Eilish (Bing News RSS, PT-BR + EN) e grava news.json."""
import json, re, ssl, html, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "news.json"
MAX_ITEMS = 200
FALLBACK_IMAGE = ""  # ex: "fallback.jpg" (foto da Billie colocada na raiz do repo)
FEEDS = [
    "https://www.bing.com/news/search?q=%22Billie+Eilish%22&format=rss&setlang=pt-BR&mkt=pt-BR",
    "https://www.bing.com/news/search?q=%22Billie+Eilish%22&format=rss&setlang=en-US&mkt=en-US",
    "https://www.bing.com/news/search?q=Billie+Eilish+Finneas&format=rss&setlang=pt-BR&mkt=pt-BR",
]
MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]
UA = {"User-Agent": "Mozilla/5.0 (compatible; BillieGlobalBR/1.0)"}

def get(url, timeout=20):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as r:
        return r.read()

def clean(t):
    t = re.sub(r"<[^>]+>", " ", html.unescape(t or ""))
    return re.sub(r"\s+", " ", t).strip()

def real_url(link):
    q = urllib.parse.parse_qs(urllib.parse.urlparse(link).query)
    return q.get("url", [link])[0]

def og_image(url):
    try:
        page = get(url, 10)[:300000].decode("utf-8", "ignore")
        m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', page) or \
            re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', page)
        return html.unescape(m.group(1)) if m else ""
    except Exception:
        return ""

def parse(feed):
    ns = {"News": "http://schemas.microsoft.com/live/news"}
    root = ET.fromstring(get(feed))
    out = []
    for it in root.iter("item"):
        title = clean(it.findtext("title"))
        desc = clean(it.findtext("description"))
        if "billie eilish" not in (title + " " + desc).lower() and "billie" not in title.lower():
            continue
        link = real_url(it.findtext("link") or "")
        src = clean(it.findtext("News:Source", namespaces=ns)) or urllib.parse.urlparse(link).netloc.replace("www.", "")
        img = (it.findtext("News:Image", namespaces=ns) or "").strip()
        try:
            dt = parsedate_to_datetime(it.findtext("pubDate")).astimezone(timezone.utc)
        except Exception:
            dt = datetime.now(timezone.utc)
        out.append({"t": title, "d": desc, "s": src, "u": link, "img": img,
                    "ts": dt.isoformat(), "date": f"{dt.day} {MESES[dt.month-1]} {dt.year}", "g": "Notícia"})
    return out

def main():
    old = json.loads(OUT.read_text("utf-8")) if OUT.exists() else []
    new = []
    for f in FEEDS:
        try:
            new += parse(f)
        except Exception as e:
            print("Falhou:", f, e)
    seen, merged = set(), []
    for n in new + old:
        key = re.sub(r"\W+", "", n["t"].lower())[:80]
        if key in seen or not n.get("u"):
            continue
        seen.add(key); merged.append(n)
    merged.sort(key=lambda n: n.get("ts", ""), reverse=True)
    merged = merged[:MAX_ITEMS]
    for n in merged[:20]:  # completa imagens só das mais recentes
        if not n.get("img"):
            n["img"] = og_image(n["u"]) or FALLBACK_IMAGE
    if merged:
        OUT.write_text(json.dumps(merged, ensure_ascii=False, indent=1), "utf-8")
        print(f"{len(merged)} notícias salvas")

if __name__ == "__main__":
    main()
