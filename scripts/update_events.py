"""Calendário da Billie: lê as notícias (e algumas buscas extras), pede à IA as datas CONFIRMADAS
e grava events.json. Roda logo depois do update_news.py. Só usa fatos oficiais com data exata."""
import json, os, re, sys, time, urllib.parse
from datetime import date, datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import update_news as un   # reaproveita get(), call_ai(), parse(), article_text(), og_image()

EV_FILE = ROOT / "events.json"
SEEN_FILE = ROOT / "events_seen.json"
MAX_AI = int(un.CFG.get("max_events_ai") or 6)        # chamadas de IA por rodada
CATS = ("musica", "premios", "shows", "cinema", "marcos")
MIN_Y, MAX_Y = 2015, 2030
HINT = re.compile(r"turnê|tour|show|festival|line-?up|ingresso|lançamento|lança|lançou|álbum|album|single|clipe|"
                  r"estreia|estreou|premia|prêmio|grammy|oscar|vmas?|indica|vence|venceu|anuncia|confirma|"
                  r"adia|cancela|filme|série|documentário|concert|release|premiere|announce|date", re.I)
EXTRA_QUERIES = [
    ("Billie Eilish turnê 2027 datas shows confirmados", "pt-BR"),
    ("Billie Eilish announces tour dates 2027", "en-US"),
    ("Billie Eilish festival lineup headliner 2027", "en-US"),
    ("Billie Eilish lançamento data confirmada álbum filme", "pt-BR"),
]

PROMPT = """Você extrai EVENTOS DE CALENDÁRIO sobre a cantora Billie Eilish para um site de fãs.
Leia o texto abaixo e liste apenas eventos que tenham DATA EXATA (dia, mês e ano) e que sejam FATOS CONFIRMADOS:
anunciados oficialmente pela Billie, sua equipe, gravadora, organizadores, premiações ou veículos de imprensa confiáveis,
ou que já aconteceram. NÃO inclua rumores, especulações, "segundo fontes", "pode", "deve", "planeja" nem datas aproximadas
("em 2027", "no verão"). Se o texto não trouxer nenhuma data exata confirmada, responda exatamente [].
Hoje é {hoje}. A data pode ser passada ou futura.

Responda SOMENTE com um array JSON (sem markdown), cada item neste formato:
{{"date":"AAAA-MM-DD","end":"AAAA-MM-DD ou vazio","title":"título curto em português do Brasil",
"desc":"1 a 3 frases em português, só com fatos do texto, sem inventar","cat":"musica|premios|shows|cinema|marcos",
"place":"cidade/local ou vazio","status":"confirmado|adiado|cancelado","old_date":"data antiga se status=adiado, senão vazio"}}

Categorias: musica (lançamentos), premios (indicações e prêmios), shows (turnês, festivais, apresentações),
cinema (filmes, séries, TV), marcos (outros fatos importantes).

TÍTULO DA MATÉRIA: {titulo}
FONTE: {fonte}
TEXTO:
{texto}
"""

def load(p, default):
    try:
        return json.loads(p.read_text("utf-8"))
    except Exception:
        return default

def norm(t):
    return set(w for w in re.findall(r"[a-zà-ú0-9]{4,}", (t or "").lower()) if w not in un.STOPW)

def same(a, b):
    if a.get("date") != b.get("date"):
        return False
    x, y = norm(a.get("t")), norm(b.get("t"))
    return bool(x and y and len(x & y) / min(len(x), len(y)) >= 0.5)

def parse_json(raw):
    m = re.search(r"\[.*\]", raw or "", re.S)
    if not m:
        return []
    try:
        out = json.loads(m.group(0))
        return out if isinstance(out, list) else []
    except Exception:
        return []

def valid_date(s):
    try:
        d = datetime.strptime(s or "", "%Y-%m-%d").date()
        return d if MIN_Y <= d.year <= MAX_Y else None
    except Exception:
        return None

def candidates(news):
    cand = []
    for n in news:   # notícias que o site já tem (texto já reescrito/limpo)
        txt = " ".join((n.get("body") or [])[:6]) or n.get("d", "")
        if n.get("hide") or not HINT.search(n.get("t", "") + " " + n.get("d", "")):
            continue
        cand.append({"k": n.get("k") or n["u"], "t": n["t"], "s": n.get("s", ""), "u": n["u"], "img": n.get("img", ""),
                     "text": txt[:4000], "ts": n.get("ts", "")})
    for q, lang in EXTRA_QUERIES:   # buscas extras focadas em anúncios futuros
        feed = "https://www.bing.com/news/search?q=%s&format=rss&setlang=%s&mkt=%s" % (urllib.parse.quote_plus(q), lang, lang)
        try:
            for n in un.parse(feed)[:6]:
                cand.append({"k": n["k"], "t": n["t"], "s": n["s"], "u": n["u"], "img": n.get("img", ""),
                             "text": n["d"], "ts": n["ts"], "fetch": True})
        except Exception as e:
            print("busca extra falhou:", q, e)
    cand.sort(key=lambda c: c["ts"], reverse=True)
    return cand

def main():
    events = load(EV_FILE, [])
    seen = set(load(SEEN_FILE, []))
    news = load(ROOT / "news.json", [])
    hoje = date.today().isoformat()
    done = added = 0
    got = set()
    for c in candidates(news):
        if c["k"] in seen or c["u"] in seen or c["k"] in got:
            continue
        got.add(c["k"])
        if done >= MAX_AI:
            break
        text = c["text"]
        if c.get("fetch"):
            try:
                text = (un.article_text(c["u"]) or text)[:4000]
            except Exception:
                pass
        done += 1
        try:
            raw = un.call_ai(PROMPT.format(hoje=hoje, titulo=c["t"], fonte=c["s"], texto=text))
        except Exception as e:
            print("IA falhou:", e)
            break           # sem cota/IA agora: tenta de novo na próxima rodada (não marca como visto)
        seen.add(c["k"]); seen.add(c["u"])
        for it in parse_json(raw):
            if not isinstance(it, dict):
                continue
            d = valid_date(it.get("date"))
            cat = it.get("cat") if it.get("cat") in CATS else "marcos"
            title = re.sub(r"\s+", " ", str(it.get("title") or "")).strip()
            if not d or len(title) < 8:
                continue
            e = {"date": d.isoformat(), "t": title, "d": str(it.get("desc") or "").strip()[:600], "cat": cat,
                 "conf": True, "s": c["s"], "u": c["u"]}
            end = valid_date(it.get("end"))
            if end and end > d:
                e["end"] = end.isoformat()
            if it.get("place"):
                e["place"] = str(it["place"]).strip()[:80]
            status = it.get("status")
            old = valid_date(it.get("old_date"))
            if status in ("cancelado", "adiado"):   # marca o evento antigo como cancelado
                ref = {"date": (old or d).isoformat(), "t": title}
                for x in events:
                    if not x.get("locked") and same(x, ref):
                        x["cancelled"] = True
                        print("  cancelado/adiado:", x["t"])
                if status == "cancelado":
                    continue
            if any(same(x, e) for x in events):
                continue
            e["id"] = e["date"] + "-" + re.sub(r"\W+", "", title.lower())[:24]
            if c.get("img"):
                e["img"] = c["img"]
            elif c["u"].startswith("http"):
                e["img"] = un.og_image(c["u"])
            events.append(e)
            added += 1
            print("  + ", e["date"], e["t"])
    events = [x for x in events if x.get("date")]
    events.sort(key=lambda x: x["date"])
    EV_FILE.write_text(json.dumps(events, ensure_ascii=False, indent=1), "utf-8")
    SEEN_FILE.write_text(json.dumps(sorted(seen)[-3000:], ensure_ascii=False), "utf-8")
    print(f"{done} matérias analisadas, {added} eventos novos, {len(events)} no total")

if __name__ == "__main__":
    main()
