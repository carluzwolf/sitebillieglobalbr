"""Traduz as notícias (pt-BR -> inglês e espanhol) e grava em n["tr"] = {"en": {...}, "es": {...}}.
Roda depois do update_news.py. Faz até MAX_TRANSLATE notícias por rodada (as mais novas primeiro),
então o acervo antigo vai sendo traduzido sozinho ao longo das rodadas."""
import json, os, re, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import update_news as un

OUT = un.OUT
MAX_TR = int(os.environ.get("MAX_TRANSLATE") or un.CFG.get("max_translate") or 25)
RAW = re.compile(r"^\[(img|tweet|insta|tiktok|video):|^\[\[MIDIA")

PROMPT = """You are a professional news translator for a Billie Eilish fan news site.
Translate the Brazilian Portuguese news article below into ENGLISH and into SPANISH (neutral, understandable in Spain and Latin America).
Rules:
- Faithful translation: do not add, remove or invent facts. Keep names, song/album/tour titles and quotes as they are.
- Keep the SAME number of paragraphs in the same order. If a paragraph starts with "## ", keep that prefix.
- Natural, journalistic tone.
Reply ONLY with JSON in this exact shape (no markdown):
{{"en":{{"t":"title","d":"summary","body":["paragraph 1","paragraph 2"]}},"es":{{"t":"título","d":"resumen","body":["párrafo 1","párrafo 2"]}}}}

INPUT:
{inp}"""

def ai_json(prompt):
    wait = 7 - (time.time() - un.LAST_AI[0])
    if wait > 0:
        time.sleep(wait)
    un.LAST_AI[0] = time.time()
    if un.GEMINI_KEY:
        body = {"contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 12000, "responseMimeType": "application/json"}}
        last = None
        for model in [un.GEMINI_MODEL] + un.GEMINI_FALLBACKS:
            u = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={un.GEMINI_KEY}"
            try:
                r = un.post_json(u, body, {})
                return "".join(p.get("text", "") for p in r["candidates"][0]["content"]["parts"])
            except (un.Quota, un.Missing) as e:
                last = e
                print("  modelo indisponível ou sem cota:", model)
        raise last
    if un.OPENAI_KEY:
        r = un.post_json("https://api.openai.com/v1/chat/completions",
                         {"model": un.OPENAI_MODEL, "response_format": {"type": "json_object"},
                          "messages": [{"role": "user", "content": prompt}]},
                         {"Authorization": "Bearer " + un.OPENAI_KEY})
        return r["choices"][0]["message"]["content"]
    return ""

def parse(raw):
    raw = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.M).strip()
    m = re.search(r"\{.*\}", raw, re.S)
    return json.loads(m.group(0)) if m else None

def translate(n):
    body = n.get("body") or []
    idx = [i for i, x in enumerate(body) if isinstance(x, str) and not RAW.match(x)]
    inp = json.dumps({"t": n["t"], "d": n.get("d", ""), "body": [body[i] for i in idx]}, ensure_ascii=False)
    res = parse(ai_json(PROMPT.format(inp=inp)))
    out = {}
    for lg in ("en", "es"):
        r = (res or {}).get(lg) or {}
        tb = r.get("body") or []
        if not (isinstance(r.get("t"), str) and r["t"].strip()):
            return None
        if idx and len(tb) != len(idx):
            return None
        nb = list(body)
        for j, i in enumerate(idx):
            nb[i] = str(tb[j]).strip()
        out[lg] = {"t": r["t"].strip().strip("*#"), "d": str(r.get("d") or "").strip(), "body": nb if body else []}
    return out

def main():
    if not (un.GEMINI_KEY or un.OPENAI_KEY):
        print("Sem chave de IA: nada traduzido.")
        return
    items = json.loads(OUT.read_text("utf-8"))
    todo = [n for n in items if isinstance(n, dict) and n.get("t") and not n.get("hide")
            and not (n.get("tr") and n["tr"].get("en") and n["tr"].get("es")) and n.get("trt", 0) < 4]
    print(len(todo), "notícias sem tradução; traduzindo até", MAX_TR)
    done = 0
    for n in todo:
        if done >= MAX_TR:
            break
        n["trt"] = n.get("trt", 0) + 1
        print("Traduzindo:", n["t"][:70])
        try:
            tr = translate(n)
        except (un.Quota, un.Missing) as e:
            print("  IA indisponível (limite ou modelo), parando por agora:", str(e)[:200].replace("\n", " "))
            n["trt"] -= 1
            break
        except Exception as e:
            print("  falhou:", e)
            continue
        if not tr:
            print("  resposta incompleta; tenta de novo na próxima rodada")
            continue
        n["tr"] = tr
        n.pop("trt", None)
        done += 1
        OUT.write_text(json.dumps(items, ensure_ascii=False, indent=1), "utf-8")   # salva a cada notícia
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=1), "utf-8")
    print(done, "notícias traduzidas")

if __name__ == "__main__":
    main()
