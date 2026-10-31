"""Gera uma página HTML estática (com link próprio) para cada notícia do news.json,
mais o Google News Sitemap e o sitemap de notícias.

  PT: /noticia/<slug>/        EN: /en/news/<slug>/        ES: /es/noticias/<slug>/

Roda sozinho no GitHub Actions (depois de update_news.py e translate_news.py).
Também pode rodar na mão:  python scripts/build_articles.py
- Não apaga páginas antigas (os links continuam existindo mesmo quando a notícia sai do news.json).
- O slug de cada notícia é gravado em slugs.json e em news.json (campo "slug") e nunca muda.
"""
import json, re, unicodedata, html, datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://www.billieglobalbr.com.br"
SITE_NAME = "Billie Global BR"
LANGS = ["pt", "en", "es"]
DIR = {"pt": "noticia", "en": "en/news", "es": "es/noticias"}
HOME = {"pt": "/", "en": "/en/", "es": "/es/"}
HL = {"pt": "pt-BR", "en": "en", "es": "es"}
OGL = {"pt": "pt_BR", "en": "en_US", "es": "es_ES"}
T = {
 "back": ["← Voltar às notícias", "← Back to the news", "← Volver a las noticias"],
 "by": ["Por", "By", "Por"],
 "minread": ["min de leitura", "min read", "min de lectura"],
 "share": ["Compartilhar no WhatsApp", "Share on WhatsApp", "Compartir en WhatsApp"],
 "also": ["Leia também", "Related stories", "Lee también"],
 "src": ["Texto produzido pela equipe do Billie Global BR com base em informações publicadas por",
         "Written by the Billie Global BR team based on information published by",
         "Texto elaborado por el equipo de Billie Global BR a partir de información publicada por"],
 "srclink": ["Fonte: ver matéria original ↗", "Source: read the original article ↗", "Fuente: ver la nota original ↗"],
 "pub": ["Publicado pela equipe do Billie Global BR.", "Published by the Billie Global BR team.", "Publicado por el equipo de Billie Global BR."],
 "home": ["Início", "Home", "Inicio"],
 "team": ["Redação Billie Global BR", "Billie Global BR Newsroom", "Redacción Billie Global BR"],
 "footer": [
  "© Billie Global BR · Portal de fãs não oficial, sem ligação com Billie Eilish ou sua equipe. Textos produzidos com apoio de inteligência artificial a partir de informações publicadas pelas fontes citadas.",
  "© Billie Global BR · Unofficial fan portal, not affiliated with Billie Eilish or her team. Texts are produced with the help of artificial intelligence from information published by the cited sources.",
  "© Billie Global BR · Portal de fans no oficial, sin vínculo con Billie Eilish ni con su equipo. Los textos se elaboran con apoyo de inteligencia artificial a partir de información publicada por las fuentes citadas."],
}
MES = {"jan":1,"fev":2,"mar":3,"abr":4,"mai":5,"jun":6,"jul":7,"ago":8,"set":9,"out":10,"nov":11,"dez":12}
MON_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
MON_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]

def t(k, li): return T[k][li]
def esc(x): return html.escape(str(x if x is not None else ""), quote=True)

def slugify(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    if len(s) > 80:
        s = s[:80].rsplit("-", 1)[0] if "-" in s[:80] else s[:80]
    return s.strip("-") or "noticia"

def parse_ts(n):
    try:
        d = dt.datetime.fromisoformat(str(n.get("ts", "")).replace("Z", "+00:00"))
        if d.tzinfo is None: d = d.replace(tzinfo=dt.timezone.utc)
        return d
    except Exception:
        m = re.match(r"(\d{1,2}) (\w{3}) (\d{4})", str(n.get("date", "")))
        if m and m.group(2).lower() in MES:
            return dt.datetime(int(m.group(3)), MES[m.group(2).lower()], int(m.group(1)), 12, tzinfo=dt.timezone.utc)
        return dt.datetime.now(dt.timezone.utc)

def fdate(d, li):
    if li == 0: return "%d/%02d/%d" % (d.day, d.month, d.year)
    if li == 1: return "%s %d, %d" % (MON_EN[d.month-1], d.day, d.year)
    return "%d de %s de %d" % (d.day, MON_ES[d.month-1], d.year)

def url_of(lang, slug): return "%s/%s/%s/" % (BASE, DIR[lang], slug)

def https(u):
    u = str(u or "")
    if u.startswith("http://"): u = "https://" + u[7:]
    if u.startswith("uploads/"): u = BASE + "/" + u
    return u if u.startswith("https://") else ""

def clean_text(s):
    return re.sub(r"\s+", " ", re.sub(r"\[[a-z]+:[^\]]*\]", "", str(s or ""))).strip()

def block(x):
    x = str(x or "")
    m = re.match(r"^\[img:([^|\]]+)(?:\|([^\]]*))?\]$", x)
    if m:
        cap = '<figcaption>%s</figcaption>' % esc(m.group(2)) if m.group(2) else ""
        return '<figure class="fig"><img loading="lazy" referrerpolicy="no-referrer" alt="%s" src="%s">%s</figure>' % (esc(m.group(2) or ""), esc(https(m.group(1)) or m.group(1)), cap)
    m = re.match(r"^\[(tweet|insta|tiktok|video):([^\]]+)\]$", x)
    if m:
        k, u = m.group(1), m.group(2).strip()
        if k == "video":
            return '<div class="emb"><div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/%s" loading="lazy" allowfullscreen title="Video"></iframe></div></div>' % esc(u)
        return '<p class="p"><a href="%s" target="_blank" rel="noopener nofollow">%s ↗</a></p>' % (esc(u), esc(u))
    if x.startswith("## "): return '<h2 class="sh">%s</h2>' % esc(x[3:])
    return '<p class="p">%s</p>' % esc(x)

def view(n, lang):
    """Título/descrição/corpo no idioma pedido (None se não houver tradução)."""
    if lang == "pt":
        return n.get("t"), n.get("d"), n.get("body") or []
    x = (n.get("tr") or {}).get(lang)
    if x and x.get("t"):
        return x["t"], x.get("d") or n.get("d"), x.get("body") or []
    return None

def render(n, lang, slug, v, others, slugs):
    li = LANGS.index(lang)
    title, desc, body = v
    d = parse_ts(n)
    iso = d.isoformat()
    modified = parse_ts({"ts": n.get("mod") or n.get("ts")}).isoformat()
    img = https(n.get("img")) or BASE + "/og-image.jpg"
    own = bool(n.get("manual"))
    words = len(" ".join(clean_text(p) for p in body).split())
    mins = max(1, round(words / 190))
    canon = url_of(lang, slug)
    plain_desc = clean_text(desc)[:300] or clean_text(" ".join(body))[:300]
    # alternativas de idioma (só as que existem)
    alts = ""
    avail = [l for l in LANGS if view(n, l)]
    for l in avail:
        alts += '<link rel="alternate" hreflang="%s" href="%s">\n' % (HL[l], url_of(l, slug))
    alts += '<link rel="alternate" hreflang="x-default" href="%s">\n' % url_of("pt", slug)
    langmenu = "".join('<a href="%s"%s>%s</a>' % (url_of(l, slug), ' class="on"' if l == lang else "", l.upper()) for l in avail)
    ld = {
        "@context": "https://schema.org", "@type": "NewsArticle",
        "mainEntityOfPage": {"@type": "WebPage", "@id": canon},
        "headline": title[:110], "description": plain_desc, "image": [img],
        "datePublished": iso, "dateModified": modified, "inLanguage": HL[lang],
        "articleBody": clean_text(" ".join(body))[:5000],
        "author": {"@type": "Organization", "name": SITE_NAME, "url": BASE + "/"},
        "publisher": {"@type": "NewsMediaOrganization", "name": SITE_NAME, "url": BASE + "/",
                      "logo": {"@type": "ImageObject", "url": BASE + "/icon-512.png", "width": 512, "height": 512}},
        "about": {"@type": "Person", "name": "Billie Eilish"},
    }
    if not own and n.get("u"):
        ld["isBasedOn"] = n["u"]
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": SITE_NAME, "item": BASE + HOME[lang]},
        {"@type": "ListItem", "position": 2, "name": title, "item": canon}]}
    fig = ""
    if img and not any(str(p).startswith("[img:") for p in body):
        fig = '<figure class="fig"><img referrerpolicy="no-referrer" alt="%s" src="%s"%s></figure>' % (
            esc(title), esc(img), ' fetchpriority="high"')
    wa = "https://wa.me/?text=" + __import__("urllib.parse").parse.quote(title + " " + canon)
    if own:
        srcbox = '<div class="srcbox">%s</div>' % esc(t("pub", li))
    else:
        srcbox = '<div class="srcbox">%s <b>%s</b><br><a href="%s" target="_blank" rel="noopener nofollow">%s</a></div>' % (
            esc(t("src", li)), esc(n.get("s")), esc(n.get("u")), esc(t("srclink", li)))
    rel = ""
    if others:
        rows = ""
        for o in others:
            ov = view(o["n"], lang)
            if not ov: continue
            oi = https(o["n"].get("img"))
            im = '<span class="im"><img loading="lazy" referrerpolicy="no-referrer" alt="" src="%s"></span>' % esc(oi) if oi else ""
            rows += '<a class="row" href="%s">%s<div class="tx"><h3>%s</h3><p>%s</p></div></a>' % (
                "/%s/%s/" % (DIR[lang], o["slug"]), im, esc(ov[0]), esc(clean_text(ov[1])))
        if rows:
            rel = '<div class="rel"><div class="stitle"><h2>%s</h2></div>%s</div>' % (esc(t("also", li)), rows)
    return """<!DOCTYPE html>
<html lang="%(hl)s"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#d4101f">
<title>%(title)s — %(site)s</title>
<meta name="description" content="%(desc)s">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="%(canon)s">
%(alts)s<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="%(site)s">
<meta property="og:locale" content="%(ogl)s">
<meta property="og:title" content="%(title)s">
<meta property="og:description" content="%(desc)s">
<meta property="og:url" content="%(canon)s">
<meta property="og:image" content="%(img)s">
<meta property="article:published_time" content="%(iso)s">
<meta property="article:modified_time" content="%(mod)s">
<meta property="article:author" content="%(site)s">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="%(title)s">
<meta name="twitter:description" content="%(desc)s">
<meta name="twitter:image" content="%(img)s">
<script type="application/ld+json">%(ld)s</script>
<script type="application/ld+json">%(crumbs)s</script>
<link rel="stylesheet" href="/article.css">
<style>.lg{display:flex;gap:2px}.lg a{color:#fff;font:800 12px var(--sans);padding:8px 8px;border-radius:4px;opacity:.75}.lg a.on,.lg a:hover{opacity:1;background:rgba(255,255,255,.18)}.logo{justify-content:flex-start;padding-left:10px}</style>
</head><body>
<div id="top"><div class="hb"><a class="logo" href="%(home)s"><span class="ln">Billie Global</span><b>BR</b></a><nav class="lg" aria-label="Language">%(langmenu)s</nav></div></div>
<main id="v"><article class="art"><div class="crumb"><a href="%(home)s">%(back)s</a></div>
<h1>%(title)s</h1>%(sub)s
<div class="by">%(by)s <b>%(author)s</b> · <time datetime="%(iso)s">%(date)s</time> · %(mins)d %(minread)s</div>
%(fig)s%(body)s
%(srcbox)s
<div class="acts"><a class="btn" href="%(wa)s" target="_blank" rel="noopener">%(share)s</a><a class="btn o" href="%(home)s">%(back)s</a></div></article>%(rel)s</main>
<footer><div class="fw"><div><div class="fb"><span class="ln2">Billie Global</span><b>BR</b></div><p style="margin:12px 0 0;max-width:420px">%(footer)s</p></div></div></footer>
</body></html>
""" % dict(
        hl=HL[lang], title=esc(title), site=SITE_NAME, desc=esc(plain_desc), canon=canon, alts=alts, ogl=OGL[lang],
        img=esc(img), iso=iso, mod=modified, ld=json.dumps(ld, ensure_ascii=False).replace("</", "<\\/"),
        crumbs=json.dumps(crumbs, ensure_ascii=False).replace("</", "<\\/"), home=HOME[lang], langmenu=langmenu,
        back=esc(t("back", li)), sub=('<p class="sub">%s</p>' % esc(clean_text(desc))) if desc else "",
        by=esc(t("by", li)), author=esc(SITE_NAME if own else t("team", li)), date=esc(fdate(d, li)), mins=mins,
        minread=esc(t("minread", li)), fig=fig, body="".join(block(p) for p in (body or [desc or ""])),
        srcbox=srcbox, wa=esc(wa), share=esc(t("share", li)), rel=rel, footer=esc(t("footer", li)))

def main():
    news = json.loads((ROOT / "news.json").read_text("utf-8"))
    sp = ROOT / "slugs.json"
    slugs = json.loads(sp.read_text("utf-8")) if sp.exists() else {}
    used = set(slugs.values())
    items = [n for n in news if n.get("t") and not n.get("hide")]
    # slugs estáveis
    for n in items:
        k = n.get("k") or n.get("id") or n["t"]
        if k not in slugs:
            s = n.get("slug") or slugify(n["t"])
            base, i = s, 2
            while s in used:
                s = "%s-%d" % (base, i); i += 1
            slugs[k] = s; used.add(s)
        n["slug"] = slugs[k]
    sp.write_text(json.dumps(slugs, ensure_ascii=False, indent=1), "utf-8")
    (ROOT / "news.json").write_text(json.dumps(news, ensure_ascii=False, indent=1), "utf-8")

    items.sort(key=lambda n: (not n.get("pin"), -parse_ts(n).timestamp()))
    # css compartilhado, extraído do index.html (sempre em sincronia com o visual do site)
    src = (ROOT / "index.html").read_text("utf-8")
    css = re.search(r"<style>(.*?)</style>", src, re.S).group(1)
    (ROOT / "article.css").write_text(css, "utf-8")

    count = {l: 0 for l in LANGS}
    sm = []
    for n in items:
        slug = n["slug"]
        for lang in LANGS:
            v = view(n, lang)
            if not v or not v[0]: continue
            if lang == "pt" and not (n.get("body") or n.get("d")): continue
            others = [{"n": o, "slug": o["slug"]} for o in items if o is not n and view(o, lang)][:4]
            out = ROOT / DIR[lang] / slug / "index.html"
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(render(n, lang, slug, v, others, slugs), "utf-8")
            count[lang] += 1
            sm.append((n, lang, slug))

    # sitemap de todas as notícias
    def alt(n, slug):
        s = "".join('<xhtml:link rel="alternate" hreflang="%s" href="%s"/>' % (HL[l], url_of(l, slug)) for l in LANGS if view(n, l))
        return s + '<xhtml:link rel="alternate" hreflang="x-default" href="%s"/>' % url_of("pt", slug)
    body = "".join("  <url><loc>%s</loc>%s<lastmod>%s</lastmod></url>\n" % (url_of(l, s), alt(n, s), parse_ts(n).strftime("%Y-%m-%d")) for n, l, s in sm)
    (ROOT / "sitemap-noticias.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + body + "</urlset>\n", "utf-8")

    # Google News Sitemap: só notícias das últimas 48 h (regra do Google)
    now = dt.datetime.now(dt.timezone.utc)
    gn = ""
    for n, l, s in sm:
        d = parse_ts(n)
        if (now - d).total_seconds() > 48 * 3600: continue
        gn += ("  <url><loc>%s</loc><news:news><news:publication><news:name>%s</news:name><news:language>%s</news:language></news:publication>"
               "<news:publication_date>%s</news:publication_date><news:title>%s</news:title></news:news></url>\n") % (
               url_of(l, s), SITE_NAME, {"pt": "pt", "en": "en", "es": "es"}[l], d.isoformat(), esc(view(n, l)[0]))
    (ROOT / "news-sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' + gn + "</urlset>\n", "utf-8")
    print("páginas geradas:", count, "| news-sitemap:", gn.count("<url>"), "URLs")

if __name__ == "__main__":
    main()
  
