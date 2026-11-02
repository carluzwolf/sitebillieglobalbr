"""Billie Charts: lê as paradas públicas (Spotify via Kworb, Apple Music, Deezer e Billboard) e grava charts.json.

Só entram músicas da Billie Eilish. NÃO usa IA: número de parada precisa ser exato, então tudo é lido direto
das páginas/APIs públicas. Se uma fonte falhar, os dados antigos dela são mantidos (o site nunca fica vazio).
Uso:  python scripts/update_charts.py
"""
import html, json, re, ssl, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "charts.json"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"}
ARTIST = "billie eilish"
SPOTIFY_ARTIST_ID = "6qqNVTkY8uBg9cP3Jd7DAH"
MARK_STEP = 500_000_000          # a cada 500 milhões de streams vira um "marco"
HIST_DAYS = 60

# chave, plataforma, região, link do chart completo (vazio = sem link)
SOURCES = [
    ("spotify_global", "spotify", "global", "https://charts.spotify.com/charts/view/regional-global-daily/latest"),
    ("spotify_br", "spotify", "br", "https://charts.spotify.com/charts/view/regional-br-daily/latest"),
    ("apple_global", "apple", "global", "https://music.apple.com/us/playlist/top-100-global/pl.d25f5d1181894928af76c85c4bf0e7ee"),
    ("apple_br", "apple", "br", ""),
    ("apple_us", "apple", "us", ""),
    ("deezer_world", "deezer", "world", "https://www.deezer.com/playlist/3155776842"),
    ("billboard_global200", "billboard", "global200", "https://www.billboard.com/charts/billboard-global-200/"),
    ("billboard_globalexus", "billboard", "globalexus", "https://www.billboard.com/charts/billboard-global-excl-us/"),
]


# ---------- utilidades ----------
def get(url, timeout=30, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:
            last = e
            time.sleep(2 + i * 3)
    raise last


def strip(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


def num(s):
    d = re.sub(r"[^\d]", "", s or "")
    return int(d) if d else None


def norm(t):
    t = html.unescape(t or "").lower().replace("’", "'").replace("‘", "'")
    t = re.sub(r"\(.*?\)|\[.*?\]", " ", t)
    t = re.sub(r"\s-\s.*$", " ", t)
    t = re.sub(r"[^a-z0-9à-ú ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def is_billie(artist):
    return ARTIST in (artist or "").lower()


def art600(u):
    return re.sub(r"/\d+x\d+(bb)?\.(jpg|png|webp)$", r"/600x600bb.\2", u or "") if u else ""


def load(p, default):
    try:
        return json.loads(p.read_text("utf-8"))
    except Exception:
        return default


def kworb_table(page):
    """Devolve (cabeçalhos em minúsculas, linhas) da maior tabela da página do Kworb."""
    best = None
    for t in re.findall(r"<table[^>]*>(.*?)</table>", page, re.S | re.I):
        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", t, re.S | re.I)
        if best is None or len(rows) > len(best[1]):
            best = (t, rows)
    if not best:
        raise ValueError("tabela não encontrada")
    heads = [strip(h).lower() for h in re.findall(r"<th[^>]*>(.*?)</th>", best[0], re.S | re.I)]
    rows = [r for r in best[1] if re.search(r"<td", r, re.I)]
    return heads, rows


def cells(row):
    return re.findall(r"<td[^>]*>(.*?)</td>", row, re.S | re.I)


# ---------- Spotify (Kworb) ----------
def spotify(key):
    page = get({"spotify_global": "https://kworb.net/spotify/country/global_daily.html",
                "spotify_br": "https://kworb.net/spotify/country/br_daily.html"}[key])
    heads, rows = kworb_table(page)
    if len(rows) < 50:
        raise ValueError("tabela pequena demais (%d linhas)" % len(rows))

    def col(name, default):
        return heads.index(name) if name in heads else default

    i_pos, i_mv, i_tt = col("pos", 0), col("p+", 1), col("artist and title", 2)
    i_days, i_pk = col("days", 3), col("pk", 4)
    i_st, i_stp, i_tot = col("streams", 6), col("streams+", 7), col("total", 10)
    m = re.search(r"(\d{4})[/-](\d{2})[/-](\d{2})", page)
    date = "%s-%s-%s" % m.groups() if m else None
    out = []
    for r in rows:
        c = cells(r)
        if len(c) <= i_st:
            continue
        links = re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', c[i_tt], re.S)
        artists = [strip(t) for h, t in links if "/artist/" in h]
        track = [(h, strip(t)) for h, t in links if "/track/" in h]
        if track:
            title = track[0][1]
            tid = re.search(r"/track/(\w+)", track[0][0])
            tid = tid.group(1) if tid else ""
        else:
            parts = strip(c[i_tt]).split(" - ", 1)
            artists, title, tid = [parts[0]], parts[-1], ""
        artist = ", ".join(artists) if artists else strip(c[i_tt]).split(" - ")[0]
        if not is_billie(artist):
            continue
        mv = strip(c[i_mv]) if len(c) > i_mv else ""
        if re.fullmatch(r"[+-]\d+", mv):
            move = int(mv)
        elif mv == "=":
            move = 0
        elif mv.upper() == "NEW":
            move = "new"
        elif mv.upper() == "RE":
            move = "re"
        else:
            move = None
        sp = strip(c[i_stp]) if len(c) > i_stp else ""
        out.append({"pos": num(strip(c[i_pos])), "move": move, "title": title, "artist": artist, "id": tid,
                    "days": num(strip(c[i_days])) if len(c) > i_days else None,
                    "peak": num(strip(c[i_pk])) if len(c) > i_pk else None,
                    "streams": num(strip(c[i_st])),
                    "streams_delta": int(re.sub(r"[^\d-]", "", sp.replace("+", ""))) if re.search(r"\d", sp) else None,
                    "total": num(strip(c[i_tot])) if len(c) > i_tot else None,
                    "url": ("https://open.spotify.com/track/" + tid) if tid else ""})
    return {"date": date, "size": len(rows), "unit": "streams", "entries": out}


def spotify_totals():
    """Streams totais de cada música da Billie no Spotify (Kworb)."""
    page = get("https://kworb.net/spotify/artist/%s_songs.html" % SPOTIFY_ARTIST_ID)
    heads, rows = kworb_table(page)
    i_st = heads.index("streams") if "streams" in heads else 1
    i_dy = heads.index("daily") if "daily" in heads else 2
    songs = []
    for r in rows:
        c = cells(r)
        if len(c) <= max(i_st, i_dy):
            continue
        m = re.search(r'<a[^>]+href="[^"]*?/track/(\w+)\.html"[^>]*>(.*?)</a>', c[0], re.S)
        title = strip(m.group(2)) if m else strip(c[0])
        tot = num(strip(c[i_st]))
        if not title or not tot:
            continue
        songs.append({"id": m.group(1) if m else "", "title": title, "total": tot, "daily": num(strip(c[i_dy]))})
    songs.sort(key=lambda s: -s["total"])
    if len(songs) < 5:
        raise ValueError("poucas músicas na página de totais")
    return songs[:40]


# ---------- Apple Music ----------
def apple_rss(cc):
    url = "https://rss.applemarketingtools.com/api/v2/%s/music/most-played/100/songs.json" % cc
    feed = json.loads(get(url))["feed"]
    res = feed["results"]
    if len(res) < 50:
        raise ValueError("feed da Apple pequeno demais")
    out = []
    for i, it in enumerate(res):
        if is_billie(it.get("artistName")):
            out.append({"pos": i + 1, "title": it.get("name", ""), "artist": it.get("artistName", ""),
                        "cover": art600(it.get("artworkUrl100")), "url": it.get("url", "")})
    d = re.search(r"(\d{4}-\d{2}-\d{2})", feed.get("updated") or "")
    return {"date": d.group(1) if d else None, "size": len(res), "unit": None, "entries": out}


def walk(o, found):
    if isinstance(o, dict):
        if "artistName" in o and isinstance(o.get("title"), str):
            found.append(o)
        for v in o.values():
            walk(v, found)
    elif isinstance(o, list):
        for v in o:
            walk(v, found)


def apple_playlist(url):
    """Melhor esforço: lê os dados embutidos na página da playlist 'Top 100' da Apple Music."""
    page = get(url)
    m = re.search(r'<script[^>]*id="serialized-server-data"[^>]*>(.*?)</script>', page, re.S)
    if not m:
        raise ValueError("dados da playlist não encontrados")
    found = []
    walk(json.loads(m.group(1)), found)
    seen, tracks = set(), []
    for it in found:
        k = (it.get("title"), it.get("artistName"))
        if k not in seen:
            seen.add(k)
            tracks.append(it)
    if len(tracks) < 90:
        raise ValueError("playlist incompleta (%d faixas)" % len(tracks))
    tracks = tracks[:100]
    out = []
    for i, it in enumerate(tracks):
        if is_billie(it.get("artistName")):
            dur = it.get("duration")
            out.append({"pos": i + 1, "title": it["title"], "artist": it["artistName"],
                        "dur": int(dur / 1000) if isinstance(dur, (int, float)) and dur > 1000 else None, "url": url})
    return {"date": None, "size": len(tracks), "unit": None, "entries": out}


def apple(key, url):
    if key == "apple_global":
        return apple_playlist(url)
    return apple_rss({"apple_br": "br", "apple_us": "us"}[key])


# ---------- Deezer ----------
def deezer(key, url):
    tracks = []
    for src in ("https://api.deezer.com/playlist/3155776842/tracks?limit=100", "https://api.deezer.com/chart/0/tracks?limit=100"):
        try:
            tracks = json.loads(get(src)).get("data", [])
            if len(tracks) >= 50:
                break
        except Exception as e:
            print("   deezer falhou:", src, e)
    if len(tracks) < 50:
        raise ValueError("deezer indisponível")
    out = []
    for i, t in enumerate(tracks):
        names = [(t.get("artist") or {}).get("name", "")] + [c.get("name", "") for c in t.get("contributors", [])]
        if any(is_billie(n) for n in names):
            alb = t.get("album") or {}
            out.append({"pos": i + 1, "title": t.get("title_short") or t.get("title", ""), "artist": (t.get("artist") or {}).get("name", ""),
                        "dur": t.get("duration"), "cover": alb.get("cover_big") or alb.get("cover_medium") or "",
                        "url": t.get("link", ""), "album": alb.get("title", "")})
    return {"date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "size": len(tracks), "unit": None, "entries": out}


# ---------- Billboard ----------
def billboard(key, url):
    page = get(url)
    blocks = page.split("o-chart-results-list-row-container")[1:]
    if len(blocks) < 100:
        raise ValueError("billboard: poucas linhas (%d) — o site pode ter bloqueado ou mudado" % len(blocks))
    m = re.search(r"billboard-global[\w-]*/(\d{4}-\d{2}-\d{2})", page) or re.search(r'data-date="(\d{4}-\d{2}-\d{2})"', page)
    date = m.group(1) if m else None
    out = []
    for b in blocks:
        t = re.search(r'<h3[^>]*id="title-of-a-story"[^>]*>(.*?)</h3>', b, re.S)
        a = re.search(r'<span[^>]*class="c-label a-no-trucate[^"]*"[^>]*>(.*?)</span>', b, re.S)
        if not t or not a or not is_billie(strip(a.group(1))):
            continue
        vals = [strip(x) for x in re.findall(r'<span[^>]*class="c-label[^"]*"[^>]*>(.*?)</span>', b, re.S)]
        vals = [v for v in vals if re.fullmatch(r"\d+|-|–", v)]
        if not vals or not vals[0].isdigit():
            continue
        pos = int(vals[0])
        lw = vals[1] if len(vals) > 1 else "-"
        move = "new" if not lw.isdigit() else int(lw) - pos
        out.append({"pos": pos, "move": move, "title": strip(t.group(1)), "artist": strip(a.group(1)),
                    "peak": int(vals[2]) if len(vals) > 2 and vals[2].isdigit() else None,
                    "weeks": int(vals[3]) if len(vals) > 3 and vals[3].isdigit() else None, "url": url})
    return {"date": date, "size": len(blocks), "unit": None, "entries": out}


# ---------- capas e duração (iTunes Search, API pública da Apple) ----------
def itunes_fill(data, catalog):
    need = set()
    for s in data["sources"].values():
        for e in s["entries"]:
            if not e.get("cover") or not e.get("dur"):
                need.add(norm(e["title"]))
    for s in data.get("streams", []):
        need.add(norm(s["title"]))
    need = {n for n in need if n and n not in catalog}

    def add(results):
        for r in results:
            if not is_billie(r.get("artistName")) or r.get("kind") != "song":
                continue
            k = norm(r.get("trackName"))
            if k and k not in catalog:
                catalog[k] = {"cover": art600(r.get("artworkUrl100")), "dur": int((r.get("trackTimeMillis") or 0) / 1000) or None}

    if need:
        try:
            q = urllib.parse.urlencode({"term": "billie eilish", "entity": "song", "attribute": "artistTerm", "limit": 200, "country": "US"})
            add(json.loads(get("https://itunes.apple.com/search?" + q)).get("results", []))
        except Exception as e:
            print("   itunes (lista geral) falhou:", e)
    for n in sorted(need - set(catalog))[:25]:      # o que sobrou: busca música por música
        try:
            q = urllib.parse.urlencode({"term": "billie eilish " + n, "entity": "song", "limit": 8, "country": "US"})
            add(json.loads(get("https://itunes.apple.com/search?" + q, tries=2)).get("results", []))
        except Exception as e:
            print("   itunes falhou para", n, e)
        catalog.setdefault(n, {"cover": "", "dur": None})   # evita tentar de novo a cada rodada
    for s in data["sources"].values():
        for e in s["entries"]:
            c = catalog.get(norm(e["title"])) or {}
            if not e.get("cover") and c.get("cover"):
                e["cover"] = c["cover"]
            if not e.get("dur") and c.get("dur"):
                e["dur"] = c["dur"]
    for s in data.get("streams", []):
        c = catalog.get(norm(s["title"])) or {}
        s["cover"] = c.get("cover", "")
        s["dur"] = c.get("dur")


# ---------- principal ----------
CORE = ("sources", "streams", "milestones", "history")


def core_dump(d):
    s = json.dumps({k: d.get(k) for k in CORE}, sort_keys=True, ensure_ascii=False)
    return re.sub(r'"fetched": "[^"]*"', '"fetched": ""', s)     # "fetched" muda toda rodada: ignora na comparação


def main():
    old = load(OUT, {})
    data = {"sources": dict(old.get("sources") or {}), "streams": old.get("streams") or [],
            "milestones": old.get("milestones") or [], "history": old.get("history") or {},
            "catalog": old.get("catalog") or {}}
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    errors = []

    for key, plat, region, home in SOURCES:
        try:
            fn = {"spotify": lambda: spotify(key), "apple": lambda: apple(key, home),
                  "deezer": lambda: deezer(key, home), "billboard": lambda: billboard(key, home)}[plat]
            r = fn()
            r.update({"platform": plat, "region": region, "home": home, "fetched": now.strftime("%Y-%m-%dT%H:%MZ")})
            r["entries"].sort(key=lambda e: e["pos"] or 999)
            data["sources"][key] = r
            print("OK   %-22s %3d na lista, %d da Billie" % (key, r["size"], len(r["entries"])))
        except Exception as e:
            errors.append("%s: %s" % (key, e))
            print("ERRO %-22s %s (mantendo dados antigos)" % (key, e))

    try:
        new_songs = spotify_totals()
        prev = {(s.get("id") or norm(s["title"])): s["total"] for s in data["streams"]}
        for s in new_songs:
            before = prev.get(s["id"] or norm(s["title"]))
            if before and s["total"] // MARK_STEP > before // MARK_STEP:
                data["milestones"].insert(0, {"title": s["title"], "mark": (s["total"] // MARK_STEP) * MARK_STEP, "date": today})
        data["milestones"] = data["milestones"][:40]
        data["streams"] = new_songs
        data["streams_date"] = today
        print("OK   streams totais: %d músicas (1ª: %s, %s)" % (len(new_songs), new_songs[0]["title"], new_songs[0]["total"]))
    except Exception as e:
        errors.append("streams: %s" % e)
        print("ERRO streams totais:", e)

    itunes_fill(data, data["catalog"])

    for key, s in data["sources"].items():     # histórico (alimenta o gráfico de evolução)
        d = s.get("date") or today
        h = [x for x in data["history"].get(key, []) if x["d"] != d]
        ent = s["entries"]
        h.append({"d": d, "n": len(ent), "best": min([e["pos"] for e in ent], default=None)})
        h.sort(key=lambda x: x["d"])
        data["history"][key] = h[-HIST_DAYS:]

    if old and core_dump(old) == core_dump(data) and old.get("catalog") == data["catalog"]:
        print("Nada mudou desde a última rodada.")
        return 0
    data["updated"] = now.strftime("%Y-%m-%dT%H:%MZ")
    data["errors"] = errors
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), "utf-8")
    print("charts.json gravado (%d fontes, %d erros)" % (len(data["sources"]), len(errors)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
