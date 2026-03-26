# OpenClaw + AIOSON Bridge

> AIOSON receives external triggers. OpenClaw delivers them. Neither system changes — the bridge is pure configuration.

## Overview

```
[External channel]          [OpenClaw]            [AIOSON squad-webhook]
 WhatsApp, Telegram,   →   gateway de canal   →   POST /trigger
 Slack, webhook ERP         identifica sessão       executa squad
                                                    ↓
                            ←   callback HTTP   ←   POST callback_url
                            envia resposta
                            ao canal
```

## Quick start

### 1. Start the webhook server

```bash
export AIOSON_WEBHOOK_TOKEN=your-secret-token
aioson squad:webhook start --port 3210
```

The server auto-discovers all squads in `.aioson/squads/`. Output:

```
AIOSON squad webhook server started on port 3210
Available squads: atendimento, vendas, logistica
Endpoints: POST /trigger  GET /status/:run_id  GET /health
```

### 2. Generate the OpenClaw configuration

```bash
aioson squad:webhook config --channel whatsapp --squad atendimento
```

Copy the output into your `openclaw.json`.

### 3. Verify

```bash
curl http://localhost:3210/health
# {"ok":true,"version":"x.x.x","squads":["atendimento","vendas","logistica"]}
```

---

## Endpoints

### `GET /health`

No authentication required.

```json
{ "ok": true, "version": "1.4.0", "squads": ["atendimento", "vendas"] }
```

---

### `POST /trigger`

Async squad execution. Returns immediately with a `run_id`.

**Headers:**
```
Authorization: Bearer <AIOSON_WEBHOOK_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "squad": "atendimento",
  "input": "quero dipirona 500mg",
  "session_id": "wa:5511999000",
  "callback_url": "https://your-server/callback",
  "metadata": {
    "channel": "whatsapp",
    "phone": "+5511999000",
    "user_name": "João"
  }
}
```

| Field          | Required | Description |
|----------------|----------|-------------|
| `squad`        | yes      | Squad slug to execute |
| `input`        | yes      | User message |
| `session_id`   | no       | Opaque string — enables conversation continuity |
| `callback_url` | no       | Where to POST the response when done |
| `metadata`     | no       | Arbitrary key/value, echoed back in the callback |

**Response (202):**
```json
{ "run_id": "a1b2c3d4e5f6a7b8", "status": "queued" }
```

**Callback payload (async POST to `callback_url`):**
```json
{
  "run_id": "a1b2c3d4e5f6a7b8",
  "session_id": "wa:5511999000",
  "response": "Temos dipirona 500mg por R$8,90. Deseja adicionar ao carrinho?",
  "status": "completed",
  "metadata": { "channel": "whatsapp", "phone": "+5511999000", "user_name": "João" }
}
```

Callback delivery: 3 retries with exponential backoff (30s → 60s → 120s).

---

### `GET /status/:run_id`

Poll execution state when no `callback_url` was provided.

```
GET /status/a1b2c3d4e5f6a7b8
Authorization: Bearer <token>
```

```json
{
  "run_id": "a1b2c3d4e5f6a7b8",
  "status": "running",
  "response": null,
  "error": null
}
```

`status` values: `queued` → `running` → `completed` | `failed`

---

### `POST /query`

Synchronous query — for fast lookups that don't need a full squad session (e.g., product search from a website). Timeout: 10 seconds.

```json
{
  "squad": "catalogo",
  "query": "dipirona 500mg",
  "max_results": 10
}
```

```json
{
  "results": [{ "id": 42, "name": "Dipirona 500mg", "price": 8.90 }],
  "squad": "catalogo",
  "latency_ms": 340
}
```

---

## Session continuity

When `session_id` is provided, AIOSON maintains conversation history across multiple calls.

**First call:**
```json
{ "squad": "atendimento", "input": "quero dipirona", "session_id": "wa:5511999000" }
```
→ Squad receives: `quero dipirona`

**Second call (same session):**
```json
{ "squad": "atendimento", "input": "qual o preço?", "session_id": "wa:5511999000" }
```
→ Squad receives:
```
[Conversation history]
user: quero dipirona
assistant: Temos dipirona 500mg por R$8,90. Deseja adicionar ao carrinho?

[Current message]
qual o preço?
```

Session files are stored in `.aioson/sessions/` and expire after 24 hours of inactivity (configurable via `AIOSON_SESSION_TTL_HOURS`).

---

## OpenClaw configuration

### WhatsApp (full example)

```yaml
# openclaw.json
hooks:
  whatsapp:
    auto_reply:
      - pattern: ".*"
        action: webhook
        url: "http://localhost:3210/trigger"
        headers:
          Authorization: "Bearer ${AIOSON_WEBHOOK_TOKEN}"
        body_template: |
          {
            "squad": "atendimento",
            "input": "{{message.text}}",
            "session_id": "wa:{{message.from}}",
            "callback_url": "{{openclaw.callback_url}}",
            "metadata": {
              "channel": "whatsapp",
              "phone": "{{message.from}}",
              "user_name": "{{message.contact_name}}"
            }
          }
```

### Telegram

```yaml
hooks:
  telegram:
    auto_reply:
      - pattern: ".*"
        action: webhook
        url: "http://localhost:3210/trigger"
        headers:
          Authorization: "Bearer ${AIOSON_WEBHOOK_TOKEN}"
        body_template: |
          {
            "squad": "suporte",
            "input": "{{message.text}}",
            "session_id": "tg:{{message.chat_id}}",
            "callback_url": "{{openclaw.callback_url}}",
            "metadata": { "channel": "telegram" }
          }
```

### Multiple squads by intent

Route different message patterns to different squads:

```yaml
hooks:
  whatsapp:
    auto_reply:
      - pattern: "^(pedido|comprar|quero|carrinho)"
        action: webhook
        url: "http://localhost:3210/trigger"
        headers:
          Authorization: "Bearer ${AIOSON_WEBHOOK_TOKEN}"
        body_template: |
          { "squad": "vendas", "input": "{{message.text}}", "session_id": "wa:{{message.from}}", "callback_url": "{{openclaw.callback_url}}" }

      - pattern: "^(onde|entrega|rastreio|pedido)"
        action: webhook
        url: "http://localhost:3210/trigger"
        headers:
          Authorization: "Bearer ${AIOSON_WEBHOOK_TOKEN}"
        body_template: |
          { "squad": "logistica", "input": "{{message.text}}", "session_id": "wa:{{message.from}}", "callback_url": "{{openclaw.callback_url}}" }

      - pattern: ".*"
        action: webhook
        url: "http://localhost:3210/trigger"
        headers:
          Authorization: "Bearer ${AIOSON_WEBHOOK_TOKEN}"
        body_template: |
          { "squad": "atendimento", "input": "{{message.text}}", "session_id": "wa:{{message.from}}", "callback_url": "{{openclaw.callback_url}}" }
```

---

## Security

| Concern | Mechanism |
|---------|-----------|
| Authentication | Bearer token (`AIOSON_WEBHOOK_TOKEN`) on all endpoints except `/health` |
| Rate limiting | 60 req/min per IP by default |
| Squad allowlist | Only squads in `.aioson/squads/` are accessible |
| Callback security | Callbacks only POST to URLs provided by the caller |
| Session isolation | Each `session_id` maps to a separate file; no cross-session access |

Set `AIOSON_WEBHOOK_TOKEN` to a random secret (minimum 32 chars):

```bash
openssl rand -hex 32
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AIOSON_WEBHOOK_TOKEN` | — | Bearer token (required for security) |
| `AIOSON_WEBHOOK_PORT` | `3210` | Server port |
| `AIOSON_SESSION_TTL_HOURS` | `24` | Session expiry in hours |

---

## CLI reference

```bash
# Start webhook server
aioson squad:webhook start [path] [--port 3210] [--token TOKEN]

# Generate OpenClaw config snippet
aioson squad:webhook config [--channel whatsapp] [--squad atendimento] [--port 3210]
```
