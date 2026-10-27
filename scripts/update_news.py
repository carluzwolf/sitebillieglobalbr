"""Busca notícias da Billie Eilish (Bing News RSS), reescreve com IA (traduz + expande) e grava news.json."""
import json, os, re, ssl, html, time, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "news.json"
MAX_ITEMS = 200
MAX_REWRITE = 20          # notícias reescritas por rodada (controla custo/tempo)
VERSION = 2              # aumente para forçar reescrever tudo de novo
FALLBACK_IMAGE = ""
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
FEEDS = [
    "https://www.bing.com/news/search?q=%22Billie+Eilish%22&format=rss&setlang=pt-BR&mkt=pt-BR",
    "https://www.bing.com/news/search?q=%22Billie+Eilish%22&format=rss&setlang=en-US&mkt=en-US",
    "https://www.bing.com/news/search?q=Billie+Eilish+Finneas&format=rss&setlang=pt-BR&mkt=pt-BR",
]
MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}

PROMPT = """Você é redator sênior do portal de fãs Billie Global BR, dedicado à Billie Eilish.
Abaixo estão o título e o texto (que pode estar em inglês e/ou incompleto) de uma matéria de outro veículo.
Tarefa: escreva uma notícia COMPLETA, NOVA e ORIGINAL em português do Brasil.
- Traduza e use as informações do texto como base e, se tiver acesso à pesquisa, consulte outras fontes confiáveis para acrescentar contexto, detalhes e histórico relevante (turnês, álbuns, declarações, datas).
- Tamanho: 6 a 9 parágrafos, entre 350 e 600 palavras. Pode usar um parágrafo de contexto sobre o tema.
- Use palavras e estrutura próprias; não copie frases nem a ordem do original. Citações: no máximo 8 palavras entre aspas e só se essencial.
- Nunca invente fatos, datas, números ou falas. Se algo não for confirmado, diga que não há confirmação oficial.
- Tom jornalístico, claro e envolvente para fãs brasileiros.
Formato EXATO da resposta (sem markdown, sem comentários):
TITULO: <título novo>
RESUMO: <1 ou 2 frases>
TEXTO:
<parágrafo 1>

<parágrafo 2>

...

TÍTULO ORIGINAL: %s
DATA: %s

TEXTO ORIGINAL (pode estar vazio ou curto):
%s"""

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

def article_text(url):
    try:
        page = get(url, 15)[:800000].decode("utf-8", "ignore")
    except Exception as e:
        print("  não abriu a matéria:", e)
        return ""
    page = re.sub(r"(?is)<(script|style|nav|header|footer|aside|form)[^>]*>.*?</\1>", " ", page)
    ps = [clean(x) for x in re.findall(r"(?is)<p[^>]*>(.*?)</p>", page)]
    return " ".join(x for x in ps if len(x) > 40)[:9000]

def post_json(url, payload, headers):
    req = urllib.request.Request(url, json.dumps(payload).encode(), {**headers, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120, context=ssl.create_default_context()) as r:
        return json.loads(r.read())

def call_ai(prompt):
    if GEMINI_KEY:
        u = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}"
        body = {"contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8000}}
        try:  # com pesquisa no Google para trazer mais contexto
            r = post_json(u, {**body, "tools": [{"google_search": {}}]}, {})
        except Exception as e:
            print("  sem pesquisa (", e, ") — tentando sem")
            r = post_json(u, body, {})
        parts = r["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts)
    if OPENAI_KEY:
        r = post_json("https://api.openai.com/v1/chat/completions",
                      {"model": OPENAI_MODEL, "messages": [{"role": "user", "content": prompt}]},
                      {"Authorization": "Bearer " + OPENAI_KEY})
        return r["choices"][0]["message"]["content"]
    return ""

def parse_ai(raw):
    t = re.search(r"TITULO:\s*(.+)", raw)
    r = re.search(r"RESUMO:\s*(.+)", raw)
    b = re.search(r"TEXTO:\s*(.+)", raw, re.S)
    if not (t and b):
        return None
    paras = [re.sub(r"\s+", " ", x).strip().strip("*#") for x in re.split(r"\n\s*\n", b.group(1))]
    paras = [x for x in paras if len(x) > 30]
    if len(paras) < 3:
        return None
    return {"t": t.group(1).strip().strip("*#"), "d": (r.group(1).strip() if r else paras[0][:200]), "body": paras}

def parse(feed):
    ns = {"News": "http://schemas.microsoft.com/live/news"}
    root = ET.fromstring(get(feed))
    out = []
    for it in root.iter("item"):
        title = clean(it.findtext("title"))
        desc = clean(it.findtext("description"))
        if "billie" not in (title + " " + desc).lower():
            continue
        link = real_url(it.findtext("link") or "")
        src = clean(it.findtext("News:Source", namespaces=ns)) or urllib.parse.urlparse(link).netloc.replace("www.", "")
        img = (it.findtext("News:Image", namespaces=ns) or "").strip()
        try:
            dt = parsedate_to_datetime(it.findtext("pubDate")).astimezone(timezone.utc)
        except Exception:
            dt = datetime.now(timezone.utc)
        out.append({"k": re.sub(r"\W+", "", title.lower())[:80], "t": title, "d": desc, "s": src, "u": link,
                    "img": img, "ts": dt.isoformat(), "date": f"{dt.day} {MESES[dt.month-1]} {dt.year}",
                    "g": "Notícia", "orig": title})
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
    for n in merged[:20]:
        if not n.get("img"):
            n["img"] = og_image(n["u"]) or FALLBACK_IMAGE

    if not (GEMINI_KEY or OPENAI_KEY):
        print("ATENÇÃO: nenhuma chave de IA encontrada (GEMINI_API_KEY / OPENAI_API_KEY).")
    done = 0
    for n in merged:
        if done >= MAX_REWRITE or not (GEMINI_KEY or OPENAI_KEY):
            break
        if n.get("v") == VERSION or n.get("tries_v%d" % VERSION, 0) >= 3:
            continue
        n["tries_v%d" % VERSION] = n.get("tries_v%d" % VERSION, 0) + 1
        orig = n.get("orig") or n["t"]
        print("Reescrevendo:", orig[:70])
        text = article_text(n["u"])
        if len(text) < 300:
            text = n.get("orig_d") or n["d"]
            print("  texto curto — usando resumo + pesquisa")
        n.setdefault("orig_d", n["d"])
        try:
            res = parse_ai(call_ai(PROMPT % (orig, n.get("date", ""), text)))
        except Exception as e:
            print("  IA falhou:", e); continue
        if not res:
            print("  resposta da IA fora do formato"); continue
        n["t"], n["d"], n["body"], n["v"], n["orig"] = res["t"], res["d"], res["body"], VERSION, orig
        done += 1
        time.sleep(2)
    print(f"{done} notícias reescritas")
    if merged:
        OUT.write_text(json.dumps(merged, ensure_ascii=False, indent=1), "utf-8")
        print(f"{len(merged)} notícias salvas")

if __name__ == "__main__":
    main()
    
