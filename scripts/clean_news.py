"""Esconde do site as notícias SEM imagem e SEM texto reescrito. Não mexe nas outras."""
import json
from pathlib import Path

F = Path(__file__).resolve().parent.parent / "news.json"
items = json.loads(F.read_text("utf-8"))
removidas = 0
for n in items:
    sem_texto = not n.get("body")
    sem_imagem = not n.get("img") and not n.get("pics") and not n.get("imgs")
    if sem_texto and sem_imagem and not n.get("hide"):
        n["hide"] = True   # fica marcada para o robô não trazer de volta
        removidas += 1
F.write_text(json.dumps(items, ensure_ascii=False, indent=1), "utf-8")
print(f"{removidas} notícias removidas do site; {sum(1 for n in items if not n.get('hide'))} continuam.")

