"""Busca notícias da Billie Eilish (Bing News RSS), reescreve com IA (traduz + expande) e grava news.json."""
import json, os, re, ssl, html, time, urllib.request, urllib.parse, urllib.error
from urllib.parse import urljoin
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "news.json"
PHOTOS_OUT = Path(__file__).resolve().parent.parent / "photos.json"
try:  # config.json é editado pelo painel de administração (todos os campos são opcionais)
    CFG = json.loads((Path(__file__).resolve().parent.parent / "config.json").read_text("utf-8"))
except Exception:
    CFG = {}
MAX_ITEMS = int(CFG.get("max_items") or 200)
AI_ON = CFG.get("ai_enabled", True)
KEYWORDS = [k.strip().lower() for k in str(CFG.get("keyword") or "billie").split(",") if k.strip()]
IMGV = 4                 # versão da regra de imagens (aumente para refazer todas)
MAX_REWRITE = int(CFG.get("max_rewrite") or 10)         # notícias reescritas por rodada (controla custo/tempo)
VERSION = 2              # aumente para forçar reescrever tudo de novo
FALLBACK_IMAGE = ""
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL") or CFG.get("gemini_model") or "gemini-3.5-flash-lite"
GEMINI_FALLBACKS = [m for m in os.environ.get("GEMINI_FALLBACKS") or CFG.get("gemini_fallbacks") or "gemini-3.5-flash,gemini-2.5-flash".split(",") if m]
OPENAI_MODEL = os.environ.get("OPENAI_MODEL") or CFG.get("openai_model") or "gpt-4o-mini"
FEEDS = [
    "https://www.bing.com/news/search?q=%s&format=rss&setlang=%s&mkt=%s" % (urllib.parse.quote_plus(q["q"]), q.get("lang", "pt-BR"), q.get("lang", "pt-BR"))
    for q in (CFG.get("queries") or [{"q": '"Billie Eilish"', "lang": "pt-BR"}, {"q": '"Billie Eilish"', "lang": "en-US"}, {"q": "Billie Eilish Finneas", "lang": "pt-BR"}])
    if q.get("q")
]
MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}

PROMPT_RULES = """Você é redator sênior do portal de fãs Billie Global BR, dedicado à Billie Eilish.
Abaixo estão o título e o texto (que pode estar em inglês e/ou incompleto) de uma matéria de outro veículo.
Tarefa: escreva uma notícia COMPLETA, NOVA e ORIGINAL em português do Brasil.
- Traduza e use as informações do texto como base e, se tiver acesso à pesquisa, consulte outras fontes confiáveis para acrescentar contexto, detalhes e histórico relevante (turnês, álbuns, declarações, datas).
- Tamanho: 6 a 9 parágrafos, entre 350 e 600 palavras. Pode usar um parágrafo de contexto sobre o tema.
- Use palavras e estrutura próprias; não copie frases nem a ordem do original. Citações: no máximo 8 palavras entre aspas e só se essencial.
- Nunca invente fatos, datas, números ou falas. Se algo não for confirmado, diga que não há confirmação oficial.
- Tom jornalístico, claro e envolvente para fãs brasileiros."""
PROMPT_RULES = CFG.get("prompt") or PROMPT_RULES
PROMPT_FORMAT = """
Se o texto original trouxer marcadores [[MIDIA n]] (fotos, vídeos ou publicações de redes sociais), mantenha cada marcador relevante SOZINHO em uma linha, entre dois parágrafos, no ponto equivalente da sua matéria. Não invente marcadores e não repita.
Se o texto original estiver incompleto (cortado, "leia mais" ou exclusivo para assinantes), pesquise a mesma notícia em outros veículos confiáveis e use apenas fatos confirmados. Não tente reproduzir conteúdo restrito e não invente nada.

Formato EXATO da resposta (sem markdown, sem comentários):
TITULO: <título novo>
RESUMO: <1 ou 2 frases>
TEXTO:
<parágrafo 1>

<parágrafo 2>

...

TÍTULO ORIGINAL: {titulo}
DATA: {data}

TEXTO ORIGINAL (pode estar vazio ou curto):
{texto}"""

def build_prompt(titulo, data, texto):
    return (PROMPT_RULES.rstrip() + "\n" + PROMPT_FORMAT).replace("{titulo}", titulo).replace("{data}", data).replace("{texto}", texto)


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

def og_only(url):
    page = get_page(url)
    for pat in (r'<meta[^>]+(?:property|name)=["\'](?:og:image(?::secure_url)?|twitter:image)["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\']'):
        m = re.search(pat, page)
        if m:
            u = urljoin(url, html.unescape(m.group(1).strip()))
            if u.startswith("http") and not re.search(r"logo|favicon|icon|placeholder|default", u, re.I):
                return u
    return ""

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

NOISE = re.compile(r"relacionad|related|leia também|leia mais|veja também|mais lidas|recomendad|recommended|you may also|read more|newsletter|publicidade|advertis|patrocinad", re.I)
PAYWALL = re.compile(r"assine para|exclusivo para assinantes|conteúdo exclusivo|para continuar lendo|subscribe to (continue|read)|already a subscriber|sign in to read|become a member", re.I)
TW = re.compile(r"https?://(?:www\.)?(?:twitter|x)\.com/\w+/status/\d+", re.I)
IG = re.compile(r"https?://(?:www\.)?instagram\.com/(?:p|reel|tv)/[\w-]+", re.I)
TK = re.compile(r"https?://(?:www\.)?tiktok\.com/@[\w.]+/video/\d+", re.I)
YT = re.compile(r"(?:youtube(?:-nocookie)?\.com/(?:embed/|watch\?v=)|youtu\.be/)([\w-]{11})", re.I)
BLOCKS = re.compile(r"(?is)(?P<bq><blockquote\b[^>]*>.*?</blockquote>)|(?P<fig><figure\b.*?</figure>)|(?P<ifr><iframe\b[^>]*>)|(?P<img><img\b[^>]*>)|(?P<h><h[23]\b[^>]*>.*?</h[23]>)|(?P<p><p\b[^>]*>.*?</p>)")


def norm(u):
    return re.sub(r"^https?://(www\.)?|\?.*$", "", str(u or "")).lower()


def img_url(tag, base):
    cands = []
    for attr in ("data-srcset", "srcset"):
        m = re.search(r'(?<![\w-])' + attr + r'=["\']([^"\']+)', tag)
        if m:
            best, bw = "", -1
            for part in m.group(1).split(","):
                bits = part.strip().split()
                if not bits:
                    continue
                w = int(re.sub(r"\D", "", bits[1]) or 0) if len(bits) > 1 else 0
                if w >= bw:
                    best, bw = bits[0], w
            if best:
                cands.append(best)
    for attr in ("data-src", "data-lazy-src", "data-original", "src"):
        m = re.search(r'(?<![\w-])' + attr + r'=["\']([^"\']+)', tag)
        if m:
            cands.append(m.group(1))
    w = re.search(r'(?<![\w-])width=["\']?(\d+)', tag)
    if w and int(w.group(1)) < 300:
        return ""
    for c in cands:
        u = urljoin(base, html.unescape(c.strip()))
        if u.startswith("http") and re.search(r"\.(jpe?g|png|webp)(\?|$)|/image|/img|/photo|/media|cdn|upload", u, re.I) and not BAD.search(u) and not re.search(r"[|\[\]]", u):
            return u
    return ""


def _extract(page, base):
    paywall = bool(PAYWALL.search(page))
    page = re.sub(r"(?is)<(script|style|nav|header|footer|aside|form|noscript|template|svg)\b[^>]*>.*?</\1>", " ", page)
    arts = re.findall(r"(?is)<article\b.*?</article>", page)
    box = max(arts, key=len) if arts and len(max(arts, key=len)) > 800 else page
    paras, media, seen, skip = [], [], set(), False

    def add(kind, u, cap=""):
        if len(media) >= MEDIA_MAX or not u or norm(u) in seen:
            return
        seen.add(norm(u))
        media.append({"k": kind, "u": u, "cap": clean(cap)[:140], "pos": len(paras)})

    for m in BLOCKS.finditer(box):
        kind, sx = m.lastgroup, m.group(0)
        if kind == "p":
            txt = clean(sx)
            link = TW.search(sx) or IG.search(sx) or TK.search(sx)
            if link and len(txt) < 90 and not skip:
                add("tweet" if TW.match(link.group(0)) else "insta" if IG.match(link.group(0)) else "tiktok", link.group(0))
                continue
            if len(txt) > 40:
                if NOISE.search(txt) and len(txt) < 120:
                    skip = True; continue
                if len(txt) > 120:
                    skip = False
                if not skip:
                    paras.append(txt)
        elif kind == "h":
            txt = clean(sx)
            skip = bool(NOISE.search(txt))
            if txt and not skip and len(txt) < 120:
                paras.append("## " + txt)
        elif skip:
            continue
        elif kind == "bq":
            tws, igs, tks = TW.findall(sx), IG.findall(sx), TK.findall(sx)
            if re.search(r"twitter-tweet", sx, re.I) and tws:
                add("tweet", tws[-1])
            elif re.search(r"instagram-media", sx, re.I) and igs:
                add("insta", igs[0])
            elif re.search(r"tiktok-embed", sx, re.I) and tks:
                add("tiktok", tks[0])
            elif tws:
                add("tweet", tws[-1])
            else:
                txt = clean(sx)
                if len(txt) > 40:
                    paras.append(txt)
        elif kind in ("ifr", "fig", "img"):
            y = YT.search(sx)
            if y and kind != "img":
                add("video", y.group(1))
                if kind == "ifr":
                    continue
            im = re.search(r"(?is)<img\b[^>]*>", sx)
            if im:
                cap = re.search(r"(?is)<figcaption[^>]*>(.*?)</figcaption>", sx)
                alt = re.search(r'alt=["\']([^"\']{9,})', im.group(0))
                add("img", img_url(im.group(0), base), clean(cap.group(1)) if cap else (alt.group(1) if alt else ""))
    return {"text": " ".join(paras), "paras": paras, "media": media, "tot": len(paras), "paywall": paywall}


def extract_article(url):
    page = get_page(url)
    if not page:
        return {"text": "", "paras": [], "media": [], "tot": 0, "paywall": False}
    res = _extract(page, url)
    amp = re.search(r'<link[^>]+rel=["\']amphtml["\'][^>]+href=["\']([^"\']+)', page)
    if amp and (len(res["text"]) < 600 or res["paywall"]):   # versão AMP é pública
        au = urljoin(url, html.unescape(amp.group(1)))
        ap = get_page(au)
        if ap:
            r2 = _extract(ap, au)
            if len(r2["text"]) > len(res["text"]):
                res = r2
    return res


def source_with_media(ex):
    lines, i = [], 0
    media = ex["media"]
    for k in range(len(ex["paras"]) + 1):
        for j, m in enumerate(media):
            if m["pos"] == k:
                lines.append("[[MIDIA %d]]" % (j + 1))
        if k < len(ex["paras"]):
            lines.append(ex["paras"][k])
    legend = ["MIDIA %d: %s%s" % (j + 1, {"img": "foto", "tweet": "publicação do X/Twitter", "insta": "publicação do Instagram", "tiktok": "vídeo do TikTok", "video": "vídeo do YouTube"}[m["k"]], (" — legenda: " + m["cap"]) if m["cap"] else "") for j, m in enumerate(media)]
    txt = "\n\n".join(lines)[:9000]
    return txt + ("\n\nLEGENDA DAS MÍDIAS:\n" + "\n".join(legend) if legend else "")


def media_marker(m, src):
    if m["k"] == "img":
        c = m["cap"]
        c = c if re.search(r"foto|crédito|credit|getty|reuters|afp|divulga|reprodu|imagem:|image:", c, re.I) else ((c + " · ") if c else "") + "Foto: via " + src
        cap = re.sub(r"[|\[\]]", " ", c)[:200]
        return "[img:%s|%s]" % (m["u"], cap)
    return "[%s:%s]" % (m["k"], m["u"])


def place_media(paras, media, src, tot):
    used, body = set(), []
    for x in paras:
        mk = MARK.match(x)
        if mk:
            i = int(mk.group(1)) - 1
            if 0 <= i < len(media) and i not in used:
                used.add(i); body.append(media_marker(media[i], src))
            continue
        body.append(x)
    rest = [i for i in range(len(media)) if i not in used]
    texts = [x for x in body if not x.startswith("[")]
    for i in sorted(rest, key=lambda i: -media[i]["pos"]):
        target = max(1, round(media[i]["pos"] / max(1, tot) * len(texts)))
        # posição entre blocos de texto (ignora marcadores já colocados)
        idx, seen_t = 0, 0
        while idx < len(body) and seen_t < target:
            if not body[idx].startswith("["):
                seen_t += 1
            idx += 1
        body.insert(idx, media_marker(media[i], src))
    return body


def article_text(url):
    page = get_page(url)
    if not page:
        return ""
    page = re.sub(r"(?is)<(script|style|nav|header|footer|aside|form)[^>]*>.*?</\1>", " ", page)
    ps = [clean(x) for x in re.findall(r"(?is)<p[^>]*>(.*?)</p>", page)]
    return " ".join(x for x in ps if len(x) > 40)[:9000]

class Quota(Exception):
    pass

class Missing(Exception):
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
        if e.code == 404:
            raise Missing(body)
        raise RuntimeError("HTTP %s: %s" % (e.code, body))

def gem_call(model, body):
    u = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}"
    try:  # com pesquisa no Google para trazer mais contexto
        r = post_json(u, {**body, "tools": [{"google_search": {}}]}, {})
    except Quota:
        r = post_json(u, body, {})   # a pesquisa tem cota própria; tenta sem ela
    LAST_SRC[:] = []
    try:
        for c in r["candidates"][0].get("groundingMetadata", {}).get("groundingChunks", []):
            w = c.get("web") or {}
            if w.get("uri") and w.get("title") and all(w["title"] != x["t"] for x in LAST_SRC):
                LAST_SRC.append({"t": w["title"], "u": w["uri"]})
    except Exception:
        pass
    parts = r["candidates"][0]["content"]["parts"]
    return "".join(p.get("text", "") for p in parts)

LAST_AI = [0.0]
LAST_SRC = []
MEDIA_MAX = 8

def call_ai(prompt):
    wait = 7 - (time.time() - LAST_AI[0])
    if wait > 0:
        time.sleep(wait)
    LAST_AI[0] = time.time()
    if GEMINI_KEY:
        body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8000}}
        last = None
        for model in [GEMINI_MODEL] + GEMINI_FALLBACKS:
            try:
                return gem_call(model, body)
            except (Quota, Missing) as e:
                last = e
                print("  modelo indisponível ou sem cota:", model)
        raise last
    if OPENAI_KEY:
        r = post_json("https://api.openai.com/v1/chat/completions",
                      {"model": OPENAI_MODEL, "messages": [{"role": "user", "content": prompt}]},
                      {"Authorization": "Bearer " + OPENAI_KEY})
        return r["choices"][0]["message"]["content"]
    return ""

MARK = re.compile(r"^\[\[MIDIA (\d+)\]\]$")

def parse_ai(raw):
    t = re.search(r"TITULO:\s*(.+)", raw)
    r = re.search(r"RESUMO:\s*(.+)", raw)
    b = re.search(r"TEXTO:\s*(.+)", raw, re.S)
    if not (t and b):
        return None
    txt = re.sub(r"\s*(\[\[MIDIA \d+\]\])\s*", r"\n\n\1\n\n", b.group(1))
    paras = [re.sub(r"\s+", " ", x).strip().strip("*#") for x in re.split(r"\n\s*\n", txt)]
    paras = [x for x in paras if len(x) > 30 or MARK.match(x)]
    if len([x for x in paras if not MARK.match(x)]) < 3:
        return None
    first = next(x for x in paras if not MARK.match(x))
    return {"t": t.group(1).strip().strip("*#"), "d": (r.group(1).strip() if r else first[:200]), "body": paras}

def parse(feed):
    ns = {"News": "http://schemas.microsoft.com/live/news"}
    root = ET.fromstring(get(feed))
    out = []
    for it in root.iter("item"):
        title = clean(it.findtext("title"))
        desc = clean(it.findtext("description"))
        if not any(k in (title + " " + desc).lower() for k in KEYWORDS):
            continue
        link = real_url(it.findtext("link") or "")
        tags = {c.tag.split("}")[-1]: (c.text or "").strip() for c in it}
        src = clean(tags.get("Source", "")) or urllib.parse.urlparse(link).netloc.replace("www.", "")
        img = tags.get("Image", "")
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
    for n in old + new:
        if not isinstance(n, dict) or not n.get("t"):
            continue
        key = n.get("k") or re.sub(r"\W+", "", n["t"].lower())[:80]
        n["k"] = key
        if key in seen or n.get("u") in seen or not n.get("u"):
            continue
        seen.add(key); seen.add(n["u"]); merged.append(n)
    merged.sort(key=lambda n: n.get("ts", ""), reverse=True)
    keep = [n for n in merged[MAX_ITEMS:] if n.get("manual") or n.get("pin") or n.get("locked")]
    merged = merged[:MAX_ITEMS] + keep
    FROZEN = lambda n: bool(n.get("manual") or n.get("locked") or n.get("hide"))

    # Imagem de capa = a imagem ORIGINAL da própria notícia (Bing ou og:image da matéria)
    for n in merged:
        if not FROZEN(n) and n.get("imgv") != IMGV:
            n["imgs"], n["pics"], n["imgv"], n["ogt"] = [], [], IMGV, 0
        if not FROZEN(n):
            n["imgs"] = []
    fetched = 0
    for n in merged:
        if FROZEN(n) or n.get("img") or n.get("ogt", 0) >= 3 or fetched >= 60:
            continue
        fetched += 1
        n["ogt"] = n.get("ogt", 0) + 1
        n["img"] = og_only(n["u"])
    print("capas originais:", sum(1 for n in merged if n.get("img")), "de", len(merged))

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
        if FROZEN(n):
            continue
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
        if done >= MAX_REWRITE or not AI_ON or not (GEMINI_KEY or OPENAI_KEY):
            break
        if FROZEN(n) or n.get("v", 0) >= 2 or n.get("tries3", 0) >= 6:
            continue
        n["tries3"] = n.get("tries3", 0) + 1
        orig = n.get("orig") or n["t"]
        print("Reescrevendo:", orig[:70])
        ex = extract_article(n["u"])
        trunc = len(ex["text"]) < 500 or ex["paywall"]
        n.setdefault("orig_d", n["d"])
        if trunc:
            print("  texto incompleto: pesquisando a mesma notícia em outras fontes")
            text = (source_with_media(ex) + "\n\n" if ex["text"] else "") + "(texto original incompleto; resumo: " + n["orig_d"] + ")"
        else:
            text = source_with_media(ex)
        res = None
        LAST_SRC[:] = []
        try:
            res = parse_ai(call_ai(build_prompt(orig, n.get("date", ""), text)))
        except (Quota, Missing) as e:
            print("  IA INDISPONÍVEL (limite ou modelo), parando por agora:", str(e)[:300].replace("\n", " "))
            n["tries3"] -= 1
            break
        except Exception as e:
            print("  IA falhou:", e)
        if not res:
            print("  sem texto da IA nesta tentativa"); continue
        res["body"] = place_media(res["body"], [m for m in ex["media"] if norm(m["u"]) != norm(n.get("img"))], n["s"], ex["tot"])
        n["alts"] = list(LAST_SRC)[:4] if trunc else []
        n["mv"] = 1
        n["t"], n["d"], n["body"], n["v"], n["orig"] = res["t"], res["d"], res["body"], VERSION, orig
        done += 1
        time.sleep(8)
    enr = 0
    for n in merged:
        if enr >= 20:
            break
        if FROZEN(n) or not n.get("body") or n.get("mv") == 1 or n.get("mtries", 0) >= 2:
            continue
        n["mtries"] = n.get("mtries", 0) + 1
        try:
            ex = extract_article(n["u"])
            cover = {norm(n.get("img")), norm(og_only(n["u"]))}
            md = [m for m in ex["media"] if norm(m["u"]) not in cover]
            if md:
                n["body"] = place_media(n["body"], md, n["s"], ex["tot"])
            n["mv"] = 1; enr += 1
        except Exception as e:
            print("  mídia falhou:", e)
    print(f"{enr} matérias enriquecidas com imagens e publicações")
    print(f"{done} notícias reescritas")
    if merged:
        OUT.write_text(json.dumps(merged, ensure_ascii=False, indent=1), "utf-8")
        print(f"{len(merged)} notícias salvas")

if __name__ == "__main__":
    main()
