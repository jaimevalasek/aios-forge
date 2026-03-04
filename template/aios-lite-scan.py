#!/usr/bin/env python3
"""
aios-lite-scan.py — Brownfield project scanner

Run this OUTSIDE of Claude Code / Codex to generate .aios-lite/context/discovery.md
using a cost-efficient LLM API, saving tokens for your main AI coding session.

Usage:
    python aios-lite-scan.py

Requires:
    aios-lite-models.json in the same directory (copy from aios-lite-models.json.example)
    Python 3.8+ — no pip install needed, uses stdlib only
"""

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

# ── Paths ────────────────────────────────────────────────────────────────────

CONFIG_FILE         = "aios-lite-models.json"
OUTPUT_FILE         = ".aios-lite/context/discovery.md"
SKELETON_FILE       = ".aios-lite/context/skeleton-system.md"
PROJECT_CONTEXT     = ".aios-lite/context/project.context.md"
SPEC_FILE           = ".aios-lite/context/spec.md"

SKELETON_DELIMITER  = "<<<SKELETON>>>"

# ── What to skip ─────────────────────────────────────────────────────────────

SKIP_DIRS = {
    ".git", "node_modules", "vendor", ".next", "dist", "build",
    "__pycache__", ".cache", "coverage", ".nyc_output", "target",
    ".gradle", "venv", ".venv", "env", ".env", "storage",
    "bootstrap/cache", ".idea", ".vscode", "tmp", "temp", "logs",
    "public/build", "public/hot", ".aios-lite/backups",
}

SKIP_EXTENSIONS = {
    ".lock", ".log", ".map", ".min.js", ".min.css",
    ".jpg", ".jpeg", ".png", ".gif", ".svg", ".ico", ".webp",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".mp4", ".mp3", ".wav", ".avi",
    ".zip", ".tar", ".gz", ".rar", ".7z",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".pyc", ".pyo", ".class", ".o", ".a", ".so",
    ".sqlite", ".db", ".sqlite3",
}

# Files whose full content is valuable for understanding the project
KEY_FILE_NAMES = {
    "package.json", "composer.json", "requirements.txt", "pyproject.toml",
    "Gemfile", "go.mod", "Cargo.toml", "pom.xml", "build.gradle",
    "docker-compose.yml", "docker-compose.yaml", "Dockerfile",
    ".env.example", ".env.sample", "README.md",
    "schema.prisma", "schema.rb", "routes.rb",
    "tsconfig.json", "next.config.js", "next.config.ts",
    "vite.config.js", "vite.config.ts",
    "tailwind.config.js", "tailwind.config.ts",
    "webpack.config.js",
}

# Relative paths (partial match) worth reading
KEY_FILE_PATHS = {
    "prisma/schema.prisma",
    "database/schema.rb",
    "config/routes.rb",
    "routes/web.php",
    "routes/api.php",
    "config/app.php",
    "app/Http/Kernel.php",
    "app/Providers/RouteServiceProvider.php",
}

MAX_KEY_FILE_CHARS = 3000   # truncate large key files
MAX_TREE_FILES     = 300    # max files to include in tree

# ── Provider config ───────────────────────────────────────────────────────────

PROVIDER_BASE_URLS = {
    "deepseek":  "https://api.deepseek.com/v1",
    "openai":    "https://api.openai.com/v1",
    "gemini":    "https://generativelanguage.googleapis.com/v1beta/openai",
    "groq":      "https://api.groq.com/openai/v1",
    "together":  "https://api.together.xyz/v1",
    "mistral":   "https://api.mistral.ai/v1",
    "anthropic": None,  # uses its own format
}

# ── Utilities ─────────────────────────────────────────────────────────────────

def read_file_safe(path, max_chars=None):
    try:
        content = Path(path).read_text(encoding="utf-8", errors="replace")
        if max_chars and len(content) > max_chars:
            content = content[:max_chars] + f"\n... [truncated at {max_chars} chars]"
        return content
    except Exception:
        return None


def load_gitignore_patterns(root):
    """Read .gitignore and return simple glob patterns (best-effort)."""
    patterns = set()
    gi = Path(root) / ".gitignore"
    if not gi.exists():
        return patterns
    for line in gi.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            # Strip leading slash and trailing slash for dir matching
            clean = line.lstrip("/").rstrip("/")
            if clean:
                patterns.add(clean)
    return patterns


def should_skip(path_obj, root, gitignore_patterns):
    """Return True if this file or directory should be skipped."""
    rel = path_obj.relative_to(root)
    parts = rel.parts

    # Check each part of the path against SKIP_DIRS
    for part in parts:
        if part in SKIP_DIRS:
            return True
        # Check gitignore patterns (simple name match)
        if part in gitignore_patterns:
            return True

    # Check extension
    if path_obj.suffix.lower() in SKIP_EXTENSIONS:
        return True

    return False


def walk_project(root):
    """Walk project and return (tree_lines, key_file_contents)."""
    root = Path(root).resolve()
    gitignore = load_gitignore_patterns(root)
    tree_lines = []
    key_contents = {}
    file_count = 0

    def walk(current, depth=0):
        nonlocal file_count
        if file_count >= MAX_TREE_FILES:
            return

        try:
            entries = sorted(current.iterdir(), key=lambda e: (e.is_file(), e.name.lower()))
        except PermissionError:
            return

        for entry in entries:
            if should_skip(entry, root, gitignore):
                continue

            rel = entry.relative_to(root)
            indent = "  " * depth

            if entry.is_dir():
                tree_lines.append(f"{indent}{entry.name}/")
                walk(entry, depth + 1)
            else:
                if file_count >= MAX_TREE_FILES:
                    tree_lines.append(f"{indent}... [more files omitted]")
                    return
                tree_lines.append(f"{indent}{entry.name}")
                file_count += 1

                # Collect key file contents
                rel_str = str(rel).replace("\\", "/")
                is_key = (
                    entry.name in KEY_FILE_NAMES
                    or rel_str in KEY_FILE_PATHS
                    or any(rel_str.endswith(p) for p in KEY_FILE_PATHS)
                )
                if is_key and rel_str not in key_contents:
                    content = read_file_safe(entry, MAX_KEY_FILE_CHARS)
                    if content:
                        key_contents[rel_str] = content

    walk(root)
    return tree_lines, key_contents


# ── API calls ─────────────────────────────────────────────────────────────────

def call_openai_compatible(base_url, api_key, model, prompt):
    url = f"{base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4096,
        "temperature": 0.2,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"]


def call_anthropic(api_key, model, prompt):
    url = "https://api.anthropic.com/v1/messages"
    payload = {
        "model": model,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["content"][0]["text"]


def call_llm(provider_name, provider_cfg, prompt):
    api_key = provider_cfg.get("api_key", "")
    model   = provider_cfg.get("model", "")
    base_url = provider_cfg.get("base_url") or PROVIDER_BASE_URLS.get(provider_name)

    if not api_key or api_key.startswith("YOUR_"):
        raise ValueError(f"API key not configured for provider '{provider_name}'")
    if not model:
        raise ValueError(f"Model not configured for provider '{provider_name}'")

    if provider_name == "anthropic":
        return call_anthropic(api_key, model, prompt)

    if not base_url:
        raise ValueError(f"No base_url for provider '{provider_name}'")

    return call_openai_compatible(base_url, api_key, model, prompt)


# ── Prompt builder ────────────────────────────────────────────────────────────

def build_prompt(tree_lines, key_contents, project_context, spec_content):
    parts = ["You are analyzing a software project to generate a structured discovery document.\n"]

    if project_context:
        parts.append("## Project Context (aios-lite)\n```\n" + project_context + "\n```\n")

    parts.append("## Project Structure\n```\n" + "\n".join(tree_lines) + "\n```\n")

    if key_contents:
        parts.append("## Key Files\n")
        for path, content in list(key_contents.items())[:12]:  # cap at 12 files
            parts.append(f"### {path}\n```\n{content}\n```\n")

    if spec_content:
        parts.append("## Development Memory (spec.md)\n```\n" + spec_content + "\n```\n")

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    parts.append("""
## Task
Generate TWO documents. Separate them with exactly this delimiter on its own line:
<<<SKELETON>>>

### Document 1: `.aios-lite/context/discovery.md`
Generate with exactly these sections:

# Discovery

## 1. What this project builds
2-3 objective lines describing what the system does.

## 2. Project structure overview
Key directories and their responsibilities. Identify the architectural pattern (MVC, layered, feature-based, etc.).

## 3. Key entities and relationships
Entities inferred from models, migrations, or schema files. Include relationships if detectable.

## 4. Entry points and routes
Main route files, controllers, or API handlers identified.

## 5. Dependencies and services
Key packages from package.json / composer.json / requirements.txt. External services detected.

## 6. Existing patterns and conventions
Coding patterns already in use (naming, folder organization, auth approach, etc.). These must be preserved.

## 7. Development state
What appears to be done, in-progress, or missing. Use spec.md if available.

## 8. Risks and technical debt
Issues, inconsistencies, or missing pieces that could become problems.

## 9. What to preserve
Explicit list of conventions and structures the AI must NOT change or override.

---
_Generated by aios-lite-scan.py — """ + now + """_

<<<SKELETON>>>

### Document 2: `.aios-lite/context/skeleton-system.md`
A lightweight living index of the system. Keep it concise — AI agents read this frequently as a quick-reference index. Do NOT repeat the full analysis from Document 1 here.

Generate with exactly this format:

# System Skeleton
_Generated by aios-lite-scan.py — """ + now + """_

## File map
Indented tree of key files and directories grouped by domain/module.
Skip: detailed migration lists, test fixtures, config boilerplate, lock files.
Mark each module or file with inferred status:
  ✓  complete — code present and appears fully implemented
  ◑  partial  — scaffolded or incomplete implementation
  ○  missing  — referenced but not found or empty

## Key routes
Main routes mapped to their handlers. One per line.
Format: `METHOD /path → Handler@method`
Skip standard auth boilerplate (login/logout/password-reset) unless customized.
If no route files found: _No route files detected_

## Module status
| Module | Status | Key files |
|--------|--------|-----------|
One row per logical module or feature area.
Status: ✓ done | ◑ in-progress | ○ pending

## Key relationships
Entity relationships in plain English, one per line.
Example: `User hasMany Orders → OrderItem → Product`
If no models/schema found: _No entities detected_
\n"""
    )

    return "\n".join(parts)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    root = Path.cwd()
    print(f"aios-lite-scan — scanning {root}")

    # Load config
    config_path = root / CONFIG_FILE
    if not config_path.exists():
        print(f"\n✗ {CONFIG_FILE} not found.")
        print("  Copy aios-lite-models.json.example to aios-lite-models.json")
        print("  and fill in your API keys.")
        sys.exit(1)

    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"\n✗ Invalid JSON in {CONFIG_FILE}: {e}")
        sys.exit(1)

    provider_name = config.get("preferred_scan_provider", "")
    providers     = config.get("providers", {})

    if not provider_name or provider_name not in providers:
        available = list(providers.keys())
        print(f"\n✗ preferred_scan_provider '{provider_name}' not found in providers.")
        print(f"  Available: {available}")
        sys.exit(1)

    provider_cfg = providers[provider_name]
    model = provider_cfg.get("model", "?")
    print(f"  Provider : {provider_name}")
    print(f"  Model    : {model}")

    # Read context files
    project_context = read_file_safe(root / PROJECT_CONTEXT)
    spec_content    = read_file_safe(root / SPEC_FILE)

    if project_context:
        print(f"  Context  : {PROJECT_CONTEXT} found")
    else:
        print(f"  Context  : {PROJECT_CONTEXT} not found (run aios-lite setup:context first)")

    if spec_content:
        print(f"  Spec     : {SPEC_FILE} found — development memory included")

    # Walk project
    print("\n  Scanning project structure...")
    tree_lines, key_contents = walk_project(root)
    print(f"  Files    : {len(tree_lines)} entries mapped")
    print(f"  Key files: {len(key_contents)} read")

    # Build prompt and call LLM
    prompt = build_prompt(tree_lines, key_contents, project_context, spec_content)
    print(f"\n  Calling {provider_name} ({model})...")

    try:
        result = call_llm(provider_name, provider_cfg, prompt)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"\n✗ HTTP {e.code} from {provider_name}: {body[:400]}")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"\n✗ Network error: {e.reason}")
        sys.exit(1)
    except ValueError as e:
        print(f"\n✗ Config error: {e}")
        sys.exit(1)

    # Parse and write both documents
    output_path = root / OUTPUT_FILE
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if SKELETON_DELIMITER in result:
        discovery_content, skeleton_content = result.split(SKELETON_DELIMITER, 1)
        discovery_content = discovery_content.strip()
        skeleton_content  = skeleton_content.strip()
    else:
        discovery_content = result.strip()
        skeleton_content  = None

    output_path.write_text(discovery_content, encoding="utf-8")
    print(f"\n✓ {OUTPUT_FILE} written ({len(discovery_content)} chars)")

    if skeleton_content:
        skeleton_path = root / SKELETON_FILE
        skeleton_path.write_text(skeleton_content, encoding="utf-8")
        print(f"✓ {SKELETON_FILE} written ({len(skeleton_content)} chars)")
    else:
        print(f"⚠  Skeleton delimiter not found — {SKELETON_FILE} not written")

    print("\n  Next steps:")
    print("  1. Open your AI coding session (Claude Code, Codex, etc.)")
    print("  2. Run @analyst — reads discovery.md + skeleton-system.md automatically")
    print("  3. Run @dev    — reads skeleton-system.md first, then discovery.md + spec.md")


if __name__ == "__main__":
    main()
