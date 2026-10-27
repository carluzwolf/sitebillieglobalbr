"""Busca notícias da Billie Eilish (Bing News RSS), reescreve com IA (traduz + expande) e grava news.json."""
import json, os, re, ssl, html, time, urllib.request, urllib.parse, urllib.error
from urllib.parse import urljoin
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "news.json"
PHOTOS_OUT = Path(__file__).resolve().parent.parent / "photos.json"
MAX_ITEMS = 200
IMGV = 3                 # versão da regra de imagens (aumente para refazer todas)
MAX_REWRITE = 10         # notícias reescritas por rodada (controla custo/tempo)
VERSION = 2              # aumente para forçar reescrever tudo de novo
FALLBACK_IMAGE = ""
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_FALLBACKS = [m for m in os.environ.get("GEMINI_FALLBACKS", "gemini-2.5-flash-lite").split(",") if m]
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

def get(url, timeout=20, ua=None):
    req = urllib.request.Request(url, headers=ua or UA)
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

PAGES = {}
BAD = re.compile(r"logo|icon|avatar|sprite|pixel|tracking|author|profile|placeholder|\.svg|\.gif|1x1|blank|/ads?/|badge", re.I)

def get_page(url):
    if url not in PAGES:
        try:
            PAGES[url] = get(url, 15)[:900000].decode("utf-8", "ignore")
        except Exception:
            PAGES[url] = ""
    return PAGES[url]

def page_images(url):
    page = get_page(url)
    found = []
    for pat in (r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\']'):
        found += re.findall(pat, page)
    for tag in re.findall(r"(?is)<img\b[^>]*>", page):
        m = re.search(r'(?:data-src|src)=["\']([^"\']+)', tag)
        w = re.search(r'width=["\']?(\d+)', tag)
        if m and (not w or int(w.group(1)) >= 400):
            found.append(m.group(1))
    out = []
    for u in found:
        u = urljoin(url, html.unescape(u.strip()))
        if u.startswith("http") and re.search(r"\.(jpe?g|webp|png)(\?|$)", u, re.I) and not BAD.search(u) and u not in out:
            out.append(u)
    return out[:4]

def parse_commons(data, only_relevant=False):
    out = []
    for pg in (data.get("query", {}).get("pages", {}) or {}).values():
        ii = (pg.get("imageinfo") or [{}])[0]
        if only_relevant and not re.search(r"billie|eilish|finneas", pg.get("title", ""), re.I):
            continue
        url = ii.get("thumburl") or ii.get("url") or ""
        if not re.search(r"\.jpe?g$", url, re.I) or ii.get("width", 0) < 800:
            continue
        meta = ii.get("extmetadata", {})
        artist = clean(meta.get("Artist", {}).get("value", ""))[:40] or "Wikimedia Commons"
        lic = clean(meta.get("LicenseShortName", {}).get("value", ""))
        out.append({"u": url, "c": f"{artist} / Wikimedia Commons" + (f" ({lic})" if lic else ""),
                    "l": ii.get("descriptionurl", "https://commons.wikimedia.org")})
    return out

def commons_photos():
    ua = {"User-Agent": "BillieGlobalBR/1.0 (fan news portal; https://billieglobalbr.com.br)"}
    pool = []
    for q in ("Billie Eilish", "Billie Eilish concert", "Billie Eilish Grammy", "Billie Eilish Coachella", "Billie Eilish Lollapalooza", "Hit Me Hard and Soft tour", "Happier Than Ever tour", "Finneas O'Connell", "Finneas concert"):
        url = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=50"
               "&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1200&format=json&gsrsearch=" + urllib.parse.quote(q))
        try:
            pool += parse_commons(json.loads(get(url, 20, ua)), True)
        except Exception as e:
            print("Commons falhou:", q, e)
    seen, res = set(), []
    for x in pool:
        if x["u"] not in seen:
            seen.add(x["u"]); res.append(x)
    return res[:150]

def parse_openverse(data, key):
    out = []
    for r in data.get("results", []):
        u = r.get("url") or ""
        txt = ((r.get("title") or "") + " " + " ".join(t.get("name", "") for t in (r.get("tags") or []))).lower()
        if key not in txt or (r.get("width") or 0) < 1000 or not re.search(r"\.jpe?g", u, re.I):
            continue
        lic = ("CC " + (r.get("license") or "").upper() + " " + (r.get("license_version") or "")).strip()
        out.append({"u": u, "c": f"{r.get('creator') or 'Autor desconhecido'} / {r.get('source') or 'Openverse'} ({lic})",
                    "l": r.get("foreign_landing_url") or "https://openverse.org"})
    return out

def openverse_token():
    cid, sec = os.environ.get("OPENVERSE_CLIENT_ID", ""), os.environ.get("OPENVERSE_CLIENT_SECRET", "")
    if not (cid and sec):
        return ""
    data = urllib.parse.urlencode({"grant_type": "client_credentials", "client_id": cid, "client_secret": sec}).encode()
    req = urllib.request.Request("https://api.openverse.org/v1/auth_tokens/token/", data, {"User-Agent": UA["User-Agent"]})
    with urllib.request.urlopen(req, timeout=20, context=ssl.create_default_context()) as r:
        return json.loads(r.read())["access_token"]

def openverse_photos():
    tok = openverse_token()
    if not tok:
        print("Openverse pulado (agora exige chave gratuita); usando só o Wikimedia Commons")
        return []
    ua = {"User-Agent": "BillieGlobalBR/1.0 (fan news portal)", "Authorization": "Bearer " + tok}
    out = []
    for q, key in (("Billie Eilish", "billie"), ("Billie Eilish concert", "billie"), ("Finneas O'Connell", "finneas")):
        for page in (1, 2, 3):
            url = ("https://api.openverse.org/v1/images/?page_size=50&license_type=commercial,modification&extension=jpg&page=%d&q=" % page
                   + urllib.parse.quote(q))
            try:
                out += parse_openverse(json.loads(get(url, 20, ua)), key)
            except Exception as e:
                print("Openverse falhou:", q, page, e); break
    return out

def local_photos():
    d = Path(__file__).resolve().parent.parent / "fotos"
    if not d.exists():
        return []
    return [{"u": "fotos/" + f.name, "c": "Divulgação / Billie Global BR", "l": "#/"}
            for f in sorted(d.iterdir()) if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]

def commons_category(root, max_subcats=15):
    ua = {"User-Agent": "BillieGlobalBR/1.0 (fan news portal; https://billieglobalbr.com.br)"}
    base = "https://commons.wikimedia.org/w/api.php?format=json&action=query&"
    cats = [root]
    try:
        d = json.loads(get(base + "list=categorymembers&cmtype=subcat&cmlimit=50&cmtitle=" + urllib.parse.quote(root), 20, ua))
        cats += [m["title"] for m in d["query"]["categorymembers"]][:max_subcats]
    except Exception as e:
        print("Subcategorias falharam:", root, e)
    out = []
    for c in cats:
        cont = ""
        for _ in range(3):
            url = (base + "generator=categorymembers&gcmtype=file&gcmlimit=50&prop=imageinfo&iiprop=url|extmetadata|size"
                   "&iiurlwidth=1200&gcmtitle=" + urllib.parse.quote(c) + cont)
            try:
                d = json.loads(get(url, 25, ua))
            except Exception as e:
                print("Categoria falhou:", c, e); break
            out += parse_commons(d)
            if "continue" not in d:
                break
            cont = "".join("&%s=%s" % (k, urllib.parse.quote(str(v))) for k, v in d["continue"].items())
            time.sleep(0.3)
    return out

def commons_deep():
    out = []
    for root in ("Category:Billie Eilish", "Category:Finneas O'Connell"):
        got = commons_category(root)
        print("Commons categoria", root, "->", len(got), "fotos")
        out += got
    return out

def article_text(url):
    page = get_page(url)
    if not page:
        return ""
    page = re.sub(r"(?is)<(script|style|nav|header|footer|aside|form)[^>]*>.*?</\1>", " ", page)
    ps = [clean(x) for x in re.findall(r"(?is)<p[^>]*>(.*?)</p>", page)]
    return " ".join(x for x in ps if len(x) > 40)[:9000]

class Quota(Exception):
    pass

def post_json(url, payload, headers):
    req = urllib.request.Request(url, json.dumps(payload).encode(), {**headers, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120, context=ssl.create_default_context()) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read()[:400].decode("utf-8", "ignore")
        if e.code == 429:
            raise Quota(body)
        raise RuntimeError("HTTP %s: %s" % (e.code, body))

def gem_call(model, body):
    u = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}"
    try:  # com pesquisa no Google para trazer mais contexto
        r = post_json(u, {**body, "tools": [{"google_search": {}}]}, {})
    except Quota:
        r = post_json(u, body, {})   # a pesquisa tem cota própria; tenta sem ela
    parts = r["candidates"][0]["content"]["parts"]
    return "".join(p.get("text", "") for p in parts)

def call_ai(prompt):
    if GEMINI_KEY:
        body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8000}}
        last = None
        for model in [GEMINI_MODEL] + GEMINI_FALLBACKS:
            try:
                return gem_call(model, body)
            except Quota as e:
                last = e
                print("  cota esgotada no modelo", model)
        raise last
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

    # Só usamos imagem da matéria quando o título é sobre a Billie; imagens "soltas" da página foram removidas
    for n in merged:
        rel = bool(re.search(r"billie", (n.get("orig") or n["t"]) + " " + n.get("orig_d", ""), re.I))
        if n.get("imgv") != IMGV:
            n["imgs"], n["pics"], n["imgv"] = [], [], IMGV
        if not rel:
            n["img"] = ""
        n["imgs"] = []
        n["_rel"] = rel
    for n in merged[:20]:
        if n["_rel"] and not n.get("img"):
            n["img"] = og_image(n["u"]) or ""

    lists = []
    for fn in (commons_deep, commons_photos, openverse_photos, local_photos):
        try:
            got = fn()
            print("Fonte", fn.__name__, "->", len(got), "fotos")
            lists.append(got)
        except Exception as e:
            print("Fotos falharam:", fn.__name__, e)
    mixed, seenp = [], set()
    for i in range(max([len(x) for x in lists] or [0])):
        for lst in lists:
            if i < len(lst) and lst[i]["u"] not in seenp:
                seenp.add(lst[i]["u"]); mixed.append(lst[i])
    if mixed:
        PHOTOS_OUT.write_text(json.dumps(mixed, ensure_ascii=False), "utf-8")
    print(len(mixed), "fotos livres no banco")
    # cada notícia recebe fotos que NENHUMA outra usa; se o banco acabar, mostra menos fotos (nunca repete)
    used = set()
    for n in merged:
        used.add(n.get("img"))
        used.update(x["u"] for x in n.get("imgs", []))
        used.update(x["u"] for x in n.get("pics", []))
    for n in merged:
        own = len({u for u in [n.get("img")] + [x["u"] for x in n.get("imgs", [])] if u})
        goal = 3 if "imgs" in n else 1
        pics = n.setdefault("pics", [])
        for ph in mixed:
            if own + len(pics) >= goal:
                break
            if ph["u"] in used:
                continue
            used.add(ph["u"]); pics.append(ph)

    if not (GEMINI_KEY or OPENAI_KEY):
        print("ATENÇÃO: nenhuma chave de IA encontrada (GEMINI_API_KEY / OPENAI_API_KEY).")
    done = 0
    for n in merged:
        if done >= MAX_REWRITE or not (GEMINI_KEY or OPENAI_KEY):
            break
        if n.get("v", 0) >= 2 or n.get("tries3", 0) >= 6:
            continue
        n["tries3"] = n.get("tries3", 0) + 1
        orig = n.get("orig") or n["t"]
        print("Reescrevendo:", orig[:70])
        text = article_text(n["u"])
        if len(text) < 300:
            text = n.get("orig_d") or n["d"]
            print("  texto curto — usando resumo + pesquisa")
        n.setdefault("orig_d", n["d"])
        res = None
        try:
            res = parse_ai(call_ai(PROMPT % (orig, n.get("date", ""), text)))
        except Quota as e:
            print("  LIMITE DA IA ATINGIDO, parando por agora:", str(e)[:300].replace("\n", " "))
            n["tries3"] -= 1
            break
        except Exception as e:
            print("  IA falhou:", e)
        if not res:
            print("  sem texto da IA nesta tentativa"); continue
        n["t"], n["d"], n["body"], n["v"], n["orig"] = res["t"], res["d"], res["body"], VERSION, orig
        done += 1
        time.sleep(8)
    print(f"{done} notícias reescritas")
    for n in merged:
        n.pop("_rel", None)
    if merged:
        OUT.write_text(json.dumps(merged, ensure_ascii=False, indent=1), "utf-8")
        print(f"{len(merged)} notícias salvas")

if __name__ == "__main__":
    main()
