"""Quiz diário da Billie: pede à IA 10 perguntas NOVAS por dia e grava em quiz.json.
Roda todo dia pouco depois da meia-noite (Brasília). Se a IA falhar, o site usa o 'bank' (banco de reserva) do próprio quiz.json."""
import json, random, re, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import update_news as un   # reaproveita call_ai() (Gemini/OpenAI) e as chaves já configuradas

QZ_FILE = ROOT / "quiz.json"
N = 10
HISTORY_MAX = 150

PROMPT = """Você cria o QUIZ DIÁRIO de um site brasileiro de fãs da cantora Billie Eilish.
Hoje é {hoje}. Crie exatamente {n} perguntas de múltipla escolha, em português do Brasil, bem DIFERENTES entre si.

Regras:
- Misture assuntos: discografia (álbuns, singles, faixas), prêmios (Grammy, Oscar, VMAs), turnês e shows, Finneas, parcerias,
  filmes e projetos, curiosidades da carreira, moda e visual artístico, e fatos recentes de 2025-2026 confirmados oficialmente.
- Dificuldade: 4 fáceis, 4 médias, 2 difíceis.
- Use SOMENTE fatos confirmados e verificáveis. Nada de boatos, especulação, vida íntima, saúde, política ou polêmicas.
- Pergunte coisas que não mudam com o tempo (evite "atualmente", "hoje", "o mais recente").
- Não copie trechos de letras de músicas. Não use perguntas que dependam de citações exatas.
- Cada pergunta tem 4 alternativas curtas (até 60 caracteres), plausíveis e diferentes. Só UMA correta.
- "e" é uma explicação curta (1 frase) que confirma o fato.
- Não repita nem reescreva as perguntas já usadas abaixo.

Responda SOMENTE com um array JSON (sem markdown, sem comentários), neste formato:
[{{"q":"pergunta","o":["alt A","alt B","alt C","alt D"],"a":0,"e":"explicação curta"}}]
("a" é o índice 0-3 da alternativa correta.)

PERGUNTAS JÁ USADAS (não repetir):
{usadas}
"""

def load():
    try:
        return json.loads(QZ_FILE.read_text("utf-8"))
    except Exception:
        return {}

def brt_today():
    return (datetime.now(timezone.utc) - timedelta(hours=3)).strftime("%Y-%m-%d")

def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()

def parse(raw):
    m = re.search(r"\[.*\]", raw or "", re.S)
    if not m:
        return []
    try:
        out = json.loads(m.group(0))
        return out if isinstance(out, list) else []
    except Exception:
        return []

def clean(items, used):
    seen, out = set(used), []
    rnd = random.Random()
    for it in items:
        try:
            q = re.sub(r"\s+", " ", str(it["q"])).strip()
            o = [re.sub(r"\s+", " ", str(x)).strip() for x in it["o"]]
            a = int(it["a"])
            e = re.sub(r"\s+", " ", str(it.get("e", ""))).strip()
        except Exception:
            continue
        if len(o) != 4 or not 0 <= a <= 3 or len(q) < 10 or len(set(map(norm, o))) != 4 or not all(o):
            continue
        if norm(q) in seen:
            continue
        correct = o[a]
        rnd.shuffle(o)               # embaralha para a resposta certa não cair sempre na mesma letra
        out.append({"q": q, "o": o, "a": o.index(correct), "e": e[:300]})
        seen.add(norm(q))
    return out

def main():
    data = load()
    today = brt_today()
    if data.get("date") == today and len(data.get("questions", [])) >= N:
        print("Quiz de hoje já existe:", today)
        return 0
    hist = data.get("history", [])
    used = [norm(h) for h in hist]
    usadas = "\n".join("- " + h for h in hist[-60:]) or "(nenhuma ainda)"
    good = []
    for tentativa in range(3):
        raw = un.call_ai(PROMPT.format(hoje=today, n=N + 2, usadas=usadas))
        good = clean(parse(raw), used)
        print("tentativa", tentativa + 1, "->", len(good), "perguntas válidas")
        if len(good) >= N:
            break
    if len(good) < N:
        print("A IA não gerou perguntas suficientes; o site usará o banco de reserva hoje.")
        return 1
    good = good[:N]
    data["date"] = today
    data["questions"] = good
    data["history"] = (hist + [q["q"] for q in good])[-HISTORY_MAX:]
    data.setdefault("bank", [])
    QZ_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=1), "utf-8")
    print("quiz.json atualizado para", today)
    return 0

if __name__ == "__main__":
    sys.exit(main())
