"""Gera as páginas internacionais /en/index.html e /es/index.html (e atualiza o <head> do index.html raiz)
a partir do index.html. Rode depois de qualquer mudança no index.html:  python scripts/build_i18n.py
O site detecta o idioma sozinho; estas páginas existem para o Google indexar o site em inglês e espanhol."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://www.billieglobalbr.com.br"

KW_PT_EXTRA = ("Billie Eilish news, Billie Eilish fan site, Billie Eilish fan portal, Billie Eilish latest news, Billie Eilish new album, Billie Eilish new song, "
               "Billie Eilish tour dates, Billie Eilish tickets, Billie Eilish noticias, Billie Eilish en español, portal de fans de Billie Eilish, "
               "nuevo álbum Billie Eilish, gira Billie Eilish, Billie Eilish Hit Me Hard and Soft Tour")
L = {
 "en": {
  "locale": "en_US", "lang": "en", "path": "/en/",
  "title": "Billie Global BR — Billie Eilish News and Fan Site in English",
  "desc": "Billie Global BR: the biggest Brazilian Billie Eilish fan portal and news site, now in English. New music, tour dates, shows, Grammys, Finneas and everything about the singer, updated every 30 minutes.",
  "alt": "Billie Global BR — Billie Eilish news and fan site",
  "kw": "Billie Eilish, Billie Eilish news, Billie Eilish latest news, Billie Eilish fan site, Billie Eilish fan portal, Billie Eilish fan community, Billie Eilish fansite, Billie Eilish today, Billie Eilish breaking news, Billie Eilish new album, Billie Eilish new song, Billie Eilish new music, Billie Eilish release date, Billie Eilish music video, Billie Eilish tour, Billie Eilish tour dates, Billie Eilish tickets, Billie Eilish concert, Billie Eilish live, Billie Eilish festival, Billie Eilish Coachella, Billie Eilish Glastonbury, Billie Eilish Lollapalooza, Billie Eilish Rock in Rio, Billie Eilish Grammys, Billie Eilish Oscars, Billie Eilish interview, Billie Eilish fans, Billie Eilish lyrics, Billie Eilish discography, Billie Eilish Spotify, Billie Eilish hair, Billie Eilish movie, Billie Eilish The Bell Jar, Hit Me Hard and Soft, Hit Me Hard and Soft Tour, Happier Than Ever, When We All Fall Asleep Where Do We Go, Don't Smile at Me, Birds of a Feather, What Was I Made For, Bad Guy, Ocean Eyes, Lunch, Chihiro, Wildflower, Finneas, Finneas O'Connell, Finneas and Billie, Grammy Awards, VMAs, Billboard, pop music, alt pop, music news, pop news, celebrity news, entertainment news, Billie Eilish Brazil, Billie Eilish fan club, Billie Global, Billie Global BR, BillieGlobalBR, Billie Eilish news site",
  "ld_desc": "Brazilian news portal and fan community about singer Billie Eilish, now in English, Portuguese and Spanish.",
  "ld_alt": ["Billie Global", "BillieGlobalBR", "Billie Eilish Fan Portal", "Billie Eilish News"],
 },
 "es": {
  "locale": "es_ES", "lang": "es", "path": "/es/",
  "title": "Billie Global BR — Noticias y portal de fans de Billie Eilish en español",
  "desc": "Billie Global BR: el mayor portal de fans y noticias de Billie Eilish de Brasil, ahora en español. Nueva música, gira, conciertos, Grammy, Finneas y todo sobre la cantante, actualizado cada 30 minutos.",
  "alt": "Billie Global BR — portal de noticias y fans de Billie Eilish",
  "kw": "Billie Eilish, noticias de Billie Eilish, Billie Eilish noticias, Billie Eilish en español, Billie Eilish hoy, Billie Eilish última hora, portal de fans de Billie Eilish, club de fans de Billie Eilish, comunidad de fans de Billie Eilish, fans de Billie Eilish, Billie Eilish nuevo álbum, Billie Eilish nueva canción, Billie Eilish nueva música, Billie Eilish fecha de lanzamiento, Billie Eilish videoclip, Billie Eilish gira, Billie Eilish gira 2027, Billie Eilish conciertos, Billie Eilish entradas, Billie Eilish boletos, Billie Eilish en vivo, Billie Eilish festival, Billie Eilish Coachella, Billie Eilish Glastonbury, Billie Eilish Lollapalooza, Billie Eilish Grammy, Billie Eilish Óscar, Billie Eilish entrevista, Billie Eilish letras, Billie Eilish discografía, Billie Eilish Spotify, Billie Eilish cabello, Billie Eilish película, Billie Eilish La campana de cristal, Billie Eilish España, Billie Eilish México, Billie Eilish Argentina, Billie Eilish Colombia, Billie Eilish Chile, Billie Eilish Perú, Billie Eilish Latinoamérica, Hit Me Hard and Soft, Hit Me Hard and Soft Tour, Happier Than Ever, When We All Fall Asleep Where Do We Go, Don't Smile at Me, Birds of a Feather, What Was I Made For, Bad Guy, Ocean Eyes, Lunch, Chihiro, Wildflower, Finneas, Finneas O'Connell, Finneas y Billie, Premios Grammy, Premios Óscar, VMAs, Billboard, música pop, pop alternativo, noticias de música, noticias pop, noticias de famosos, entretenimiento, Billie Global, Billie Global BR, BillieGlobalBR, sitio de noticias de Billie Eilish",
  "ld_desc": "Portal de noticias y comunidad de fans brasileña sobre la cantante Billie Eilish, ahora en español, portugués e inglés.",
  "ld_alt": ["Billie Global", "BillieGlobalBR", "Billie Global en español", "Noticias de Billie Eilish"],
 },
}

HREFLANG = ('<link rel="alternate" hreflang="pt-BR" href="%s/">\n<link rel="alternate" hreflang="en" href="%s/en/">\n'
            '<link rel="alternate" hreflang="es" href="%s/es/">\n<link rel="alternate" hreflang="x-default" href="%s/">\n') % ((BASE,) * 4)

def sub1(pat, repl, s, flags=0):
    new, n = re.subn(pat, lambda m: repl, s, count=1, flags=flags)
    if not n:
        raise SystemExit("padrão não encontrado: " + pat)
    return new

def prep_root(s):
    # hreflang + palavras-chave em inglês/espanhol no index raiz (idempotente)
    s = re.sub(r"<!--i18n-->.*?<!--/i18n-->\n?", "", s, flags=re.S)
    s = s.replace('<link rel="canonical" href="https://www.billieglobalbr.com.br/">\n',
                  '<link rel="canonical" href="https://www.billieglobalbr.com.br/">\n<!--i18n-->\n' + HREFLANG + '<!--/i18n-->\n', 1)
    m = re.search(r'<meta name="keywords" content="([^"]*)">', s)
    kw = m.group(1)
    if "Billie Eilish news" not in kw:
        kw = kw + ", " + KW_PT_EXTRA
        s = s.replace(m.group(0), '<meta name="keywords" content="%s">' % kw, 1)
    s = s.replace('<meta property="og:locale" content="pt_BR">', '<meta property="og:locale" content="pt_BR">\n<meta property="og:locale:alternate" content="en_US">\n<meta property="og:locale:alternate" content="es_ES">') if 'og:locale:alternate' not in s else s
    # JSON-LD: idiomas
    s = s.replace('"inLanguage": "pt-BR"', '"inLanguage": ["pt-BR", "en", "es"]', 1)
    s = s.replace('"alternateName": ["Billie Global", "BillieGlobalBR"]', '"alternateName": ["Billie Global", "BillieGlobalBR", "Billie Eilish Fan Portal", "Billie Eilish News", "Noticias de Billie Eilish"]', 1)
    return s

def make(root, code):
    c = L[code]
    s = root
    s = s.replace('<html lang="pt-BR">', '<html lang="%s">' % c["lang"], 1)
    s = sub1(r"<title>.*?</title>", "<title>%s</title>" % c["title"], s)
    for name in ("description",):
        s = sub1(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % c["desc"], s)
    s = sub1(r'<meta name="keywords" content="[^"]*">', '<meta name="keywords" content="%s">' % c["kw"], s)
    s = sub1(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s%s">' % (BASE, c["path"]), s)
    s = s.replace('<meta property="og:locale" content="pt_BR">', '<meta property="og:locale" content="%s">' % c["locale"], 1)
    s = re.sub(r'<meta property="og:locale:alternate" content="[^"]*">\n?', "", s)
    others = [("pt_BR")] + [L[k]["locale"] for k in L if k != code]
    s = s.replace('<meta property="og:locale" content="%s">' % c["locale"], '<meta property="og:locale" content="%s">\n' % c["locale"] + "\n".join('<meta property="og:locale:alternate" content="%s">' % o for o in others), 1)
    s = sub1(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % c["title"], s)
    s = sub1(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="%s">' % c["desc"], s)
    s = sub1(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s%s">' % (BASE, c["path"]), s)
    s = sub1(r'<meta property="og:image:alt" content="[^"]*">', '<meta property="og:image:alt" content="%s">' % c["alt"], s)
    s = sub1(r'<meta name="twitter:title" content="[^"]*">', '<meta name="twitter:title" content="%s">' % c["title"], s)
    s = sub1(r'<meta name="twitter:description" content="[^"]*">', '<meta name="twitter:description" content="%s">' % c["desc"], s)
    # JSON-LD
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
    ld = json.loads(m.group(1))
    for node in ld["@graph"]:
        if node["@type"] == "WebSite":
            node["url"] = BASE + c["path"]
            node["inLanguage"] = c["lang"]
            node["description"] = c["desc"]
            node["alternateName"] = c["ld_alt"]
        if node["@type"] == "NewsMediaOrganization":
            node["description"] = c["ld_desc"]
            node["keywords"] = c["kw"]
            node["knowsAbout"] = ["Billie Eilish", "Finneas O'Connell", "Pop music", "Grammy Awards", "Tours and concerts"]
    s = s.replace(m.group(0), '<script type="application/ld+json">%s</script>' % json.dumps(ld, ensure_ascii=False), 1)
    return s

def main():
    p = ROOT / "index.html"
    root = prep_root(p.read_text("utf-8"))
    p.write_text(root, "utf-8")
    for code in L:
        d = ROOT / code
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(make(root, code), "utf-8")
        print("gerado", code + "/index.html")
    # sitemap com alternativas de idioma
    urls = [("/", "1.0"), ("/en/", "0.9"), ("/es/", "0.9")]
    alt = "".join('<xhtml:link rel="alternate" hreflang="%s" href="%s%s"/>' % (h, BASE, u) for h, u in (("pt-BR", "/"), ("en", "/en/"), ("es", "/es/"), ("x-default", "/")))
    body = "".join("  <url><loc>%s%s</loc>%s<changefreq>hourly</changefreq><priority>%s</priority></url>\n" % (BASE, u, alt, pr) for u, pr in urls)
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + body + "</urlset>\n", "utf-8")
    print("sitemap.xml atualizado")

if __name__ == "__main__":
    main()
