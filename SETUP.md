# ButternutBox Design Token System — Setup Guide

This guide replicates the exact development environment used for the ButternutBox design token workflow: **Claude Code + Figma MCP + figma-pilot + GitHub + Tokens Studio**.

---

## Prerequisites

- macOS (tested on Darwin 24.1.0)
- A [Figma](https://www.figma.com) account with access to the ButternutBox Component Library file
- A [GitHub](https://github.com) account with collaborator access to `JpHypno90/ButternutBox`
- An [Anthropic](https://console.anthropic.com) account with a Claude Code subscription

---

## Step 1: Install Node.js

Install Node.js v24+ via NVM (Node Version Manager):

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Restart your terminal, then:
nvm install 24
nvm use 24
nvm alias default 24

# Verify
node --version   # v24.x.x
npm --version    # 11.x.x
```

---

## Step 2: Install GitHub CLI

```bash
brew install gh
```

Authenticate with GitHub:

```bash
gh auth login
```

Choose:
- **GitHub.com**
- **HTTPS** protocol
- **Login with a web browser**

Verify:

```bash
gh auth status
# Should show: ✓ Logged in to github.com
```

---

## Step 3: Clone the Repository

```bash
cd ~/Documents/GitHub
git clone https://github.com/JpHypno90/ButternutBox.git
cd ButternutBox
git checkout Tokens
```

---

## Step 4: Install Claude Code

### Option A: VS Code Extension (recommended)

1. Open VS Code
2. Install the **Claude Code** extension from the marketplace
3. Open the terminal panel — Claude Code will be available

### Option B: CLI

```bash
# Install via npm
npm install -g @anthropic-ai/claude-code

# Or via Homebrew
brew install claude-code
```

Launch Claude Code and authenticate:

```bash
claude
# Follow the OAuth login flow when prompted
```

---

## Step 5: Configure Figma MCP Server (Figma Design Context)

This connects Claude Code to the Figma API for screenshots, design context, metadata, and variable definitions.

From the **ButternutBox project directory**, run:

```bash
cd ~/Documents/GitHub/ButternutBox
claude mcp add "claude.ai Figma" --transport http --url https://mcp.figma.com/mcp -s user
```

When you first use a Figma MCP tool, Claude Code will prompt you to authenticate via Figma OAuth.

Verify:

```bash
claude mcp list
# Should show: claude.ai Figma: https://mcp.figma.com/mcp - ✓ Connected
```

---

## Step 6: Install figma-pilot MCP Server

figma-pilot allows Claude Code to execute JavaScript directly in the Figma desktop app — creating elements, querying nodes, binding variables, etc.

### 6a: Add the MCP server to Claude Code

From the **ButternutBox project directory**:

```bash
cd ~/Documents/GitHub/ButternutBox
claude mcp add figma-pilot -s local -- npx @youware-labs/figma-pilot-mcp
```

This registers figma-pilot as a **local** (project-scoped) MCP server using `npx`.

### 6b: Install the figma-pilot Figma Plugin

1. Open the **Figma desktop app** (not the browser version)
2. Open the ButternutBox Component Library file
3. Go to **Plugins > Search for plugins** and search for **"Figma Pilot"**
4. Install and run the plugin
5. Keep the plugin running — it acts as the bridge between Claude Code and Figma

### 6c: Verify the connection

```bash
claude mcp list
# Should show: figma-pilot: npx @youware-labs/figma-pilot-mcp - ✓ Connected
```

Inside a Claude Code session, the AI can also verify with:
```
> Check figma-pilot status
# Should respond: connected, documentName: "1.3 Component Library"
```

**Important**: The figma-pilot plugin disconnects frequently. You must keep the plugin window open in Figma and re-run it if it disconnects.

---

## Step 7: Install Tokens Studio (Figma Plugin)

1. In the Figma desktop app, go to **Plugins > Search for plugins**
2. Search for **"Tokens Studio"** and install it
3. Open the plugin and connect it to the GitHub repo:
   - **Repository:** `JpHypno90/ButternutBox`
   - **Branch:** `Tokens`
   - **File path:** `tokens.json`
4. Tokens Studio will sync the token file between Figma and GitHub

---

## Step 8: Set Up Memory Files

Claude Code uses project memory files to maintain context across sessions. These are already in the repo under `.claude/`:

```
.claude/
└── settings.local.json     # Project-specific permission grants
```

The memory files are stored at:
```
~/.claude/projects/-Users-{username}-Documents-GitHub-ButternutBox/memory/
├── MEMORY.md                    # Main memory (loaded into every session)
└── token-binding-workflow.md    # Full token creation & variable binding workflow
```

These are created automatically as you work. The key file is `MEMORY.md` which contains the project overview, token architecture, workflow notes, and known issues.

---

## Step 9: Enable GitHub Pages (Design System Storybook)

The storybook is already set up in the `docs/` folder. To enable it:

```bash
gh api repos/JpHypno90/ButternutBox/pages -X POST \
  -f "source[branch]=Tokens" \
  -f "source[path]=/docs"
```

The storybook will be available at: **https://jphypno90.github.io/ButternutBox/**

---

## Verify Everything Works

Run these checks from the project directory:

```bash
# 1. Git & GitHub
git status                    # Should show: On branch Tokens, clean
gh auth status                # Should show: ✓ Logged in

# 2. Node
node --version                # v24.x.x

# 3. MCP servers
claude mcp list               # Should show both servers ✓ Connected

# 4. Token file exists
ls -la tokens.json            # ~220KB JSON file
```

Inside a Claude Code session, verify the AI tools:

```
> Check figma-pilot status
# Response: connected, documentName: "1.3 Component Library"

> Take a screenshot of the Buttons component in Figma
# Should return a screenshot from the Component Library
```

---

## Project Architecture

```
ButternutBox/
├── tokens.json                     # Main token file (synced via Tokens Studio)
├── Components-*.json               # Draft component token files
├── docs/                           # Design system storybook (GitHub Pages)
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── parser.js               # Token parser & reference resolver
│       ├── renderer.js             # Section renderers
│       ├── previews.js             # Interactive component preview builders
│       └── app.js                  # Main entry, routing, fetch
└── .claude/
    └── settings.local.json         # Project-level Claude Code permissions
```

### Token Architecture (3 layers)

```
Core/primatives     →  Raw values (hex colours, px dimensions)
    ↓ referenced by
Semantics/*         →  Named aliases (colour.text.primary, spacing.sm)
    ↓ referenced by
Components/*        →  Component-specific tokens (button.colour.background.primary.default)
```

---

## Daily Workflow

### Token Creation Workflow

1. Designer provides a Figma component URL
2. Claude Code screenshots the component, queries the node tree
3. Raw values are resolved through: **raw → primitive → semantic**
4. A `Components-{name}.json` draft is created
5. Designer imports into Tokens Studio and exports variables
6. Claude Code binds variables to Figma master components via figma-pilot

### Storybook Updates

The storybook at `docs/` reads `tokens.json` at runtime. When new components are added:

1. Add a preview builder in `docs/js/previews.js`
2. Register it in the `PREVIEW_MAP` object
3. Push to the `Tokens` branch — GitHub Pages deploys automatically

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| figma-pilot disconnected | Re-run the Figma Pilot plugin in Figma desktop |
| `bindToken` can't find variable | Re-export Styles & Variables from Tokens Studio |
| `bindToken` renders black fill | Use `figma.modify` to set correct hex first, then bind token on top |
| Tokens Studio sync fails | Check GitHub auth in Tokens Studio settings |
| Storybook shows "Loading tokens..." | Hard-refresh (Cmd+Shift+R) — CDN may be caching old JS |
| `figma.query()` times out | Simplify the query; avoid deep recursion on large components |

---

## Key Constraints

- `bindToken` only supports: `fill`, `stroke`, `cornerRadius`, `gap`, `padding`, `fontSize`
- `width`/`height`/`fontFamily`/`fontWeight`/`lineHeight` **cannot** be bound as variables
- Always bind to **master components only** — instances inherit automatically
- Keep binding batches to **~8-10 calls** per execution to avoid 30s timeout
- Token path format uses `/` separators in Figma (e.g. `slider/colour/track/background/default`)
- `createToken` type must be `NUMBER` not `FLOAT`
