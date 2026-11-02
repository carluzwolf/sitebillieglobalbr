#!/usr/bin/env python3
"""
Publica automaticamente no Canal do WhatsApp as notícias novas do news.json.

Fluxo:  notícia nova -> mensagem curta -> fila -> (aprovação) -> envio -> marcada como enviada

Estado em whatsapp_queue.json:
  {"sent": {"<slug>": "<data>"}, "queue": [{"slug","status","text","img","url"}]}
status: "pending" (aguarda aprovação) | "approved" | "sent" | "failed"

Variáveis de ambiente:
  WHAPI_TOKEN        token do Whapi.Cloud (obrigatório p/ enviar)
  WA_CHANNEL_ID      id do canal, formato 120363xxxxxxxxxx@newsletter
  WA_REQUIRE_APPROVAL "1" (padrão) = só envia itens com status "approved"; "0" = envia direto
  WA_DRY_RUN         "1" = não envia nada, só mostra
  WA_MAX_PER_RUN     máximo de envios por execução (padrão 3)
  WA_MAX_AGE_HOURS   ignora notícias mais velhas que isso (padrão 48)
"""
import base64, json, os, sys, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://www.billieglobalbr.com.br"
API = "https://gate.whapi.cloud"
QUEUE = ROOT / "whatsapp_queue.json"

TOKEN = os.environ.get("WHAPI_TOKEN", "")
CHANNEL = os.environ.get("WA_CHANNEL_ID", "")
REQUIRE_APPROVAL = os.environ.get("WA_REQUIRE_APPROVAL", "1") == "1"
DRY = os.environ.get("WA_DRY_RUN", "0") == "1"
MAX_RUN = int(os.environ.get("WA_MAX_PER_RUN", "3"))
MAX_AGE = timedelta(hours=int(os.environ.get("WA_MAX_AGE_HOURS", "48")))


def load(p, default):
    try:
        return json.loads(p.read_text("utf-8"))
    except Exception:
        return default


def save(state):
    QUEUE.write_text(json.dumps(state, ensure_ascii=False, indent=1), "utf-8")


def parse_ts(s):
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def clean(s, n):
    s = " ".join((s or "").split())
    return s if len(s) <= n else s[: n - 1].rsplit(" ", 1)[0] + "…"


def build_text(n):
    url = "%s/noticia/%s/" % (BASE, n["slug"])
    desc = clean(n.get("d") or (n.get("body") or [""])[0], 220)
    text = "🚨 *%s*\n\n%s\n\n🔗 Leia a matéria completa:\n%s\n\n— Billie Global BR" % (
        clean(n["t"], 120), desc, url)
    return text, url


def http(method, path, payload):
    req = urllib.request.Request(
        API + path, data=json.dumps(payload).encode(), method=method,
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json",
                 "Accept": "application/json",
                 "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode() or "{}")


def fetch_image_b64(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
        ctype = r.headers.get("Content-Type", "image/jpeg").split(";")[0]
    if not ctype.startswith("image/") or len(data) > 8_000_000:
        raise ValueError("não é imagem utilizável")
    return "data:%s;base64,%s" % (ctype, base64.b64encode(data).decode())


def send(item):
    """Tenta imagem+legenda; se falhar, manda só texto (WhatsApp gera o preview do link)."""
    img = item.get("img") or ""
    if img.startswith("/"):
        img = BASE + img
    if img.startswith("http"):
        try:
            media = fetch_image_b64(img)
            http("POST", "/messages/image", {"to": CHANNEL, "media": media, "caption": item["text"]})
            return "imagem"
        except Exception as e:
            print("  imagem falhou (%s), enviando só texto" % e)
    http("POST", "/messages/text", {"to": CHANNEL, "body": item["text"]})
    return "texto"


def main():
    news = load(ROOT / "news.json", [])
    state = load(QUEUE, None)

    # Primeira execução: marca tudo que já existe como "enviado" para não inundar o canal.
    if state is None:
        state = {"sent": {n["slug"]: "seed" for n in news if n.get("slug")}, "queue": []}
        save(state)
        print("Fila inicializada com %d notícias existentes (nada enviado)." % len(state["sent"]))
        return

    known = set(state["sent"]) | {q["slug"] for q in state["queue"]}
    now = datetime.now(timezone.utc)

    # 1) identificar inéditas -> gerar mensagem -> salvar na fila
    for n in news:
        slug = n.get("slug")
        if not slug or slug in known or n.get("hide"):
            continue
        ts = parse_ts(n.get("ts", ""))
        if ts and now - ts > MAX_AGE:
            state["sent"][slug] = "too-old"
            continue
        text, url = build_text(n)
        state["queue"].append({"slug": slug, "status": "pending" if REQUIRE_APPROVAL else "approved",
                               "text": text, "img": n.get("img", ""), "url": url})
        print("Na fila:", n["t"])

    # 2) enviar os aprovados
    sent_now = 0
    for item in state["queue"]:
        if item["status"] != "approved" or sent_now >= MAX_RUN:
            continue
        if DRY:
            print("[DRY-RUN] enviaria:\n" + item["text"] + "\n")
            continue
        if not (TOKEN and CHANNEL):
            sys.exit("Faltam WHAPI_TOKEN / WA_CHANNEL_ID")
        try:
            how = send(item)
            item["status"] = "sent"
            state["sent"][item["slug"]] = now.isoformat()
            sent_now += 1
            print("Enviado (%s): %s" % (how, item["slug"]))
        except urllib.error.HTTPError as e:
            item["status"] = "failed"
            print("Falhou %s: %s %s" % (item["slug"], e.code, e.read().decode()[:200]))
        except Exception as e:
            item["status"] = "failed"
            print("Falhou %s: %s" % (item["slug"], e))
        save(state)  # salva a cada envio para nunca duplicar

    state["queue"] = [q for q in state["queue"] if q["status"] != "sent"][-100:]
    save(state)


if __name__ == "__main__":
    main()
  
