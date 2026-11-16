#!/usr/bin/env python3
"""Preenche automaticamente os itens SEM vídeo do billietv.json:
procura o vídeo oficial no YouTube (Gemini + Google Search), confere o link,
e copia título, descrição, duração, ano e as capas (miniatura do YouTube).
Nunca sobrescreve o que você já preencheu."""
import json, os, re, sys, urllib.error, urllib.request, urllib.parse
from pathlib import Path

FILE = Path("billietv.json")
KEY = os.environ.get("GEMINI_API_KEY", "")
try:
    CFG = json.loads(Path("config.json").read_text(encoding="utf-8"))
except Exception:
    CFG = {}
_fb = os.environ.get("GEMINI_FALLBACKS") or CFG.get("gemini_fallbacks") or "gemini-3.5-flash,gemini-2.5-flash"
if isinstance(_fb, str):
    _fb = _fb.split(",")
MODELS = [m.strip() for m in [os.environ.get("GEMINI_MODEL") or CFG.get("gemini_model") or "gemini-3.5-flash-lite"] + list(_fb) if m and m.strip()]
GENERIC = ("título aqui", "substitua", "preencher")

def http(url, data=None, method=None, timeout=60):
    req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=timeout)

def ask(prompt):
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "tools": [{"google_search": {}}]}).encode()
    for m in MODELS:
        try:
            r = json.load(http(f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={KEY}", body))
            txt = "".join(p.get("text", "") for p in r["candidates"][0]["content"]["parts"])
            j = re.search(r"\{.*\}", txt, re.S)
            if j:
                return json.loads(j.group(0))
        except urllib.error.HTTPError as e:
            print("  falha", m, e, e.read()[:200])
        except Exception as e:
            print("  falha", m, e)
    return None

def yt_id(u):
    m = re.search(r"(?:youtu\.be/|youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/))([\w-]{11})", u or "")
    return m.group(1) if m else None

def oembed(vid):
    try:
        return json.load(http("https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(f"https://www.youtube.com/watch?v={vid}")))
    except Exception:
        return None

def thumb(vid):
    for n in ("maxresdefault", "sddefault", "hqdefault"):
        u = f"https://i.ytimg.com/vi/{vid}/{n}.jpg"
        try:
            r = http(u, method="HEAD")
            if r.status == 200 and int(r.headers.get("Content-Length", "9999")) > 4000:
                return u
        except Exception:
            pass
    return f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"

def empty(v):
    v = (v or "").strip()
    return (not v) or any(g in v.lower() for g in GENERIC) or v.lower() in ("videoclipe oficial.",)

def main():
    if not KEY:
        sys.exit("Falta o secret GEMINI_API_KEY")
    db = json.loads(FILE.read_text(encoding="utf-8"))
    titles = [x["t"] for x in db["items"] if not empty(x["t"])]
    n = 0
    for x in db["items"]:
        if (x.get("src") or "").strip():
            continue
        generic = empty(x["t"])
        print("→", x["t"])
        if generic:
            q = (f"Escolha UM vídeo oficial e relevante no YouTube da Billie Eilish da categoria '{x.get('type')}' "
                 f"que NÃO esteja nesta lista: {titles}.")
        else:
            q = f"Encontre no YouTube o vídeo oficial (canal oficial da Billie Eilish ou do veículo oficial) de: '{x['t']}' ({x.get('type')}, {x.get('year') or 'ano desconhecido'}), da Billie Eilish."
        r = ask(q + ' Responda SOMENTE com JSON: {"youtube_url":"","title":"","year":"","duration":"","description_pt":"2 a 3 frases em português do Brasil, sem inventar fatos"}. Se não achar com certeza, deixe youtube_url vazio.')
        vid = yt_id((r or {}).get("youtube_url"))
        info = oembed(vid) if vid else None
        if not info:
            print("  não encontrei com segurança")
            continue
        x["src"] = f"https://www.youtube.com/watch?v={vid}"
        if generic:
            x["t"] = (r.get("title") or info.get("title") or x["t"]).strip()
            titles.append(x["t"])
        if not x.get("backdrop"):
            x["backdrop"] = thumb(vid)
        if not x.get("poster"):
            x["poster"] = x["backdrop"]
        if empty(x.get("d")) and r.get("description_pt"):
            x["d"] = r["description_pt"].strip()
        if not x.get("year") and r.get("year"):
            x["year"] = str(r["year"])
        if not x.get("dur") and r.get("duration"):
            x["dur"] = str(r["duration"])
        n += 1
        print("  ok", x["src"])
    FILE.write_text(json.dumps(db, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{n} item(ns) preenchido(s)")

if __name__ == "__main__":
    main()
    
