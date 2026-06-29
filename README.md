# jobly-mcp

A CLI to add the [JoblyAI](https://github.com/JoblyAI) MCP server to your **OpenCode**, **Claude Code**, or **Codex CLI** configuration.

## Quick Start

```bash
npx jobly-mcp
```

The CLI will:
1. Ask which CLIs to configure (OpenCode, Claude Code, Codex CLI)
2. Prompt for your JoblyAI API key (masked input)
3. Ask whether to install globally or in the current project
4. Write the MCP server entry to each selected CLI's config

## Target a specific CLI

```bash
npx jobly-mcp --claude          # Claude Code only
npx jobly-mcp --codex           # Codex CLI only
npx jobly-mcp --opencode        # OpenCode only
npx jobly-mcp --claude --codex  # Claude Code + Codex CLI
npx jobly-mcp --all             # all three
```

Passing target flags skips the "which CLIs" prompt. One shared API key and one global/local choice apply to every selected target.

## Uninstall

```bash
npx jobly-mcp --uninstall              # choose which CLIs to remove from
npx jobly-mcp --uninstall --claude     # remove from Claude Code only
```

## Flags

| Flag | Description |
|------|-------------|
| `--claude` | Configure Claude Code |
| `--codex` | Configure Codex CLI |
| `--opencode` | Configure OpenCode |
| `--all` | Configure all supported CLIs |
| `-u, --uninstall` | Remove the jobly-mcp entry instead of adding it |
| `-y, --yes` | Skip confirmation prompts (overwrite, comment-loss) |
| `-V, --version` | Print version |
| `-h, --help` | Print help |

## Where configs are written

| CLI | Global | Local |
|-----|--------|-------|
| OpenCode | `~/.config/opencode/opencode.jsonc` (or `$XDG_CONFIG_HOME/opencode/`) | `<git-root>/opencode.json` |
| Claude Code | `~/.claude.json` (top-level `mcpServers`) | `<git-root>/.mcp.json` |
| Codex CLI | `~/.codex/config.toml` | `<git-root>/.codex/config.toml` |

> **Uninstall scope note:** uninstall only looks in the scope you choose (global or local). If an entry lives in the other scope, re-run with that scope.

## Entry shape per CLI

- **OpenCode** (`mcp` → `jobly-mcp`): `{ "type": "remote", "url": "https://jobly.ai.vn/api/mcp", "enabled": true, "headers": { "Authorization": "Bearer <key>" } }`
- **Claude Code** (`mcpServers` → `jobly-mcp`): `{ "type": "http", "url": "https://jobly.ai.vn/api/mcp", "headers": { "Authorization": "Bearer <key>" } }`
- **Codex CLI** (`[mcp_servers."jobly-mcp"]`): `url = "https://jobly.ai.vn/api/mcp"` and `http_headers = { "Authorization" = "Bearer <key>" }`

## Requirements

- Node.js 20+
- A JoblyAI API key (starts with `jobly_sk_`)
