# Task: Squad Output Configuration

> Loaded on-demand by `@squad` when configuring output strategy.
> Trigger: `@squad --config=output --squad={slug}` or auto-detected during creation.

## Purpose

Guide the user through configuring how the squad stores, routes, and delivers its outputs.
Write the result into `outputStrategy` in `squad.manifest.json`.

## Domain heuristics — auto-suggest the right mode

Before asking questions, infer the best strategy from the squad domain:

| Domain pattern | Suggested mode | Reasoning |
|---------------|---------------|-----------|
| Landing page, site, HTML standalone, presentation | `files` | Output IS the file |
| Copy for ads, social media, product descriptions | `sqlite` | Recurring data, dashboard + webhook |
| YouTube creator, editorial (scripts + thumbnails) | `hybrid` | Mix of structured data + media |
| Report/PDF generator | `files` + worker | Worker generates file |
| Blog, newsletter, editorial content | `hybrid` | Data in DB + HTML preview |
| Research, analysis, strategy | `files` | Document-oriented, not recurring |
| Data pipeline, ETL, structured extraction | `sqlite` | Structured data, API/webhook consumption |
| Image/video/media generation | `hybrid` | Media files + DB references |

## Configuration wizard

Present the inferred suggestion and ask for confirmation:

> "Based on the domain **{domain}**, I suggest:
>
> **Output mode: {mode}**
> - {brief explanation of what this means}
>
> Does this fit your workflow, or do you want to adjust?"

If the user wants to adjust, walk through these questions:

### Q1 — Output destination
> "Where should the squad outputs go?"
> - **Files only** — physical files in `output/{slug}/` (HTML, MD, etc.)
> - **Database only** — structured records in SQLite, viewable in dashboard
> - **Both** — files for preview + database for management and delivery

### Q2 — Delivery (only if `sqlite` or `hybrid`)
> "Should finished content be delivered somewhere automatically?"
> - **No** — just store in database, publish manually from dashboard
> - **Cloud** — publish to aioson.com when I click publish
> - **Webhook** — POST to an external URL (website, CMS, API)
> - **Both** — cloud + webhook

### Q3 — Webhook config (only if webhook selected)
> "Configure the webhook:"
> - **URL**: the endpoint to POST to (or use `{{ENV:WEBHOOK_URL}}` for env variable)
> - **Auth**: Bearer token? (or use `{{ENV:WEBHOOK_TOKEN}}`)
> - **Trigger**: on-publish (manual) or on-create (automatic)?

### Q4 — Auto-publish (only if webhook or cloud selected)
> "Should content be published automatically after creation?"
> - **No** — I'll review and publish manually from dashboard
> - **Yes** — publish automatically when the agent finishes

## Output — write to manifest

After collecting answers, write `outputStrategy` to `squad.manifest.json`:

```json
{
  "outputStrategy": {
    "mode": "{files|sqlite|hybrid}",
    "fileOutput": {
      "enabled": true,
      "dir": "output/{squad-slug}/",
      "formats": ["html", "md"]
    },
    "dataOutput": {
      "enabled": true,
      "storage": "sqlite",
      "table": "content_items",
      "contentItems": true
    },
    "delivery": {
      "webhooks": [
        {
          "slug": "{webhook-slug}",
          "url": "{{ENV:WEBHOOK_URL}}",
          "trigger": "on-publish",
          "format": "json",
          "headers": {
            "Authorization": "Bearer {{ENV:WEBHOOK_TOKEN}}"
          },
          "worker": ".aioson/squads/{squad-slug}/workers/webhook-post.py"
        }
      ],
      "cloudPublish": false,
      "autoPublish": false
    }
  }
}
```

## Delivery worker generation

If webhook is configured, generate a delivery worker at `.aioson/squads/{squad-slug}/workers/webhook-post.py`:

```python
#!/usr/bin/env python3
"""Delivery worker: POST content items to configured webhook."""
import json, sys, os, urllib.request, urllib.error

def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r') as f:
            payload = json.load(f)
    else:
        payload = json.load(sys.stdin)

    url = os.environ.get('WEBHOOK_URL')
    token = os.environ.get('WEBHOOK_TOKEN', '')

    if not url:
        print('ERROR: WEBHOOK_URL not set', file=sys.stderr)
        sys.exit(1)

    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')

    try:
        with urllib.request.urlopen(req) as resp:
            print(f'OK: {resp.status} {resp.reason}')
    except urllib.error.HTTPError as e:
        print(f'ERROR: {e.code} {e.reason}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
```

Register the worker in the manifest:
```json
{
  "slug": "webhook-post",
  "title": "Webhook Delivery",
  "type": "worker",
  "role": "POST content to configured webhook endpoint",
  "entrypoint": ".aioson/squads/{squad-slug}/workers/webhook-post.py",
  "runtime": "python",
  "deterministic": true,
  "usesLLM": false
}
```

## Compatibility with storagePolicy

If the squad already has `storagePolicy` but no `outputStrategy`:
- `primary: "sqlite"` → infer `mode: "hybrid"` (preserve existing behavior)
- `exports.html: true` → `fileOutput.formats` includes `"html"`
- Do NOT remove `storagePolicy` — keep both for backward compatibility

## After configuration

Show summary:
```
Output strategy configured for **{squad-name}**:
- Mode: {mode}
- Files: {enabled/disabled} → {dir}
- Database: {enabled/disabled} → {table}
- Delivery: {none | cloud | webhook | cloud+webhook}
- Auto-publish: {yes/no}

{if webhook: Delivery worker created at `.aioson/squads/{slug}/workers/webhook-post.py`}
{Reminder: Set WEBHOOK_URL and WEBHOOK_TOKEN in your environment if using {{ENV:}} placeholders.}
```
