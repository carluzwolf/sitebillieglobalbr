"""Busca notícias da Billie Eilish (Bing News RSS, PT-BR + EN) e grava news.json."""
import json, os, re, ssl, html, time, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "news.json"
MAX_ITEMS = 200
MAX_REWRITE = 6   # quantas notícias reescrever por rodada (controla custo)
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
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

PROMPT = """Você é redator do portal de fãs Billie Global BR. Abaixo está o texto de uma matéria de outro veículo sobre Billie Eilish.
Escreva uma notícia NOVA e ORIGINAL em português do Brasil, só com os fatos, em suas próprias palavras e com estrutura própria.
Regras: não copie frases nem a ordem do texto original; não use citações longas (no máximo 8 palavras entre aspas, só se essencial); não invente nada que não esteja no texto; tom jornalístico e neutro; 3 a 5 parágrafos curtos (cerca de 150 a 250 palavras no total).
Responda SOMENTE com JSON: {"titulo": "...", "resumo": "1 ou 2 frases", "paragrafos": ["...", "..."]}

TÍTULO ORIGINAL: %s

TEXTO ORIGINAL:
%s"""

def article_text(url):
    try:
        page = get(url, 15)[:600000].decode("utf-8", "ignore")
    except Exception:
        return ""
    page = re.sub(r"(?is)<(script|style|nav|header|footer|aside|form)[^>]*>.*?</\1>", " ", page)
    ps = [clean(x) for x in re.findall(r"(?is)<p[^>]*>(.*?)</p>", page)]
    return " ".join(x for x in ps if len(x) > 40)[:6000]

def post_json(url, payload, headers):
    req = urllib.request.Request(url, json.dumps(payload).encode(), {**headers, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60, context=ssl.create_default_context()) as r:
        return json.loads(r.read())

def ai_rewrite(title, text):
    prompt = PROMPT % (title, text)
    if GEMINI_KEY:
        u = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}"
        r = post_json(u, {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0.7}}, {})
        raw = r["candidates"][0]["content"]["parts"][0]["text"]
    elif OPENAI_KEY:
        r = post_json("https://api.openai.com/v1/chat/completions", {"model": OPENAI_MODEL, "response_format": {"type": "json_object"}, "messages": [{"role": "user", "content": prompt}]}, {"Authorization": "Bearer " + OPENAI_KEY})
        raw = r["choices"][0]["message"]["content"]
    else:
        return None
    j = json.loads(raw)
    if j.get("titulo") and j.get("paragrafos"):
        return j
    return None

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
        out.append({"k": re.sub(r"\W+", "", title.lower())[:80], "t": title, "d": desc, "s": src, "u": link, "img": img,
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
        key = n.get("k") or re.sub(r"\W+", "", n["t"].lower())[:80]
        n["k"] = key
        if key in seen or n.get("u") in seen or not n.get("u"):
            continue
        seen.add(key); seen.add(n["u"]); merged.append(n)
    merged.sort(key=lambda n: n.get("ts", ""), reverse=True)
    merged = merged[:MAX_ITEMS]
    for n in merged[:20]:  # completa imagens só das mais recentes
        if not n.get("img"):
            n["img"] = og_image(n["u"]) or FALLBACK_IMAGE
    done = 0
    for n in merged:
        if done >= MAX_REWRITE or not (GEMINI_KEY or OPENAI_KEY):
            break
        if n.get("body") or n.get("tries", 0) >= 3:
            continue
        n["tries"] = n.get("tries", 0) + 1
        text = article_text(n["u"])
        if len(text) < 400:
            continue
        try:
            j = ai_rewrite(n["t"], text)
        except Exception as e:
            print("IA falhou:", e); continue
        if j:
            n["t"], n["d"], n["body"] = j["titulo"].strip(), (j.get("resumo") or n["d"]).strip(), [x.strip() for x in j["paragrafos"] if x.strip()]
            done += 1; time.sleep(1)
    print(f"{done} notícias reescritas")
    if merged:
        OUT.write_text(json.dumps(merged, ensure_ascii=False, indent=1), "utf-8")
        print(f"{len(merged)} notícias salvas")

if __name__ == "__main__":
    main()
    
