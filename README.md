# jobly-mcp

A CLI to add the [JoblyAI](https://github.com/JoblyAI) MCP server to your OpenCode configuration.

## Quick Start

```bash
npx jobly-mcp
```

The CLI will:
1. Prompt for your JoblyAI API key (masked input)
2. Ask whether to install globally or in the current project
3. Write the MCP server config to `opencode.json` (or `opencode.jsonc`)

## Uninstall

```bash
npx jobly-mcp --uninstall
```

## Flags

| Flag | Description |
|------|-------------|
| `-u, --uninstall` | Remove the jobly-mcp entry instead of adding it |
| `-y, --yes` | Skip confirmation prompts (overwrite, comment-loss) |
| `-V, --version` | Print version |
| `-h, --help` | Print help |

## Where configs are written

| Scope | Path |
|-------|------|
| Global | `~/.config/opencode/opencode.jsonc` (or `$XDG_CONFIG_HOME/opencode/opencode.jsonc`) |
| Local | `<nearest-git-root>/opencode.json` |

## Requirements

- Node.js 20+
- An OpenCode installation
- A JoblyAI API key (starts with `jobly_sk_`)
