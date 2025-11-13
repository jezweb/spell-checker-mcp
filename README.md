# Spell Checker MCP Server

> Multi-language spell checking and AI-powered grammar correction for MCP clients

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/jezweb/spell-checker-mcp)
[![npm version](https://img.shields.io/npm/v/spell-checker-mcp.svg)](https://www.npmjs.com/package/spell-checker-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for real-time spell checking and grammar correction in AI coding assistants. Supports 53 languages with automatic detection, powered by Cloudflare Workers, nspell dictionaries, and Workers AI.

**Live Demo:** https://spell-checker-mcp-api.webfonts.workers.dev

---

## Features

- **53 Languages**: Comprehensive spell checking with automatic language detection
- **AI Grammar**: Context-aware grammar checking powered by DeepSeek R1 32B
- **Auto-Correction**: Three modes (spelling only, grammar only, or both)
- **Document Storage**: Corrected documents saved to R2 with 30-day auto-delete
- **Edge Deployment**: Global low-latency via Cloudflare Workers
- **Zero-Config**: One-click deployment with automatic resource provisioning

### Supported Languages

English (en, en-au, en-ca, en-gb, en-us, en-za) • Spanish • French • German • Italian • Dutch • Portuguese • Russian • Polish • Czech • Romanian • Swedish • Danish • Norwegian • Bulgarian • Catalan • Welsh • Greek • Esperanto • Estonian • Basque • Faroese • Friulian • Frisian • Irish • Scottish Gaelic • Galician • Hebrew • Croatian • Hungarian • Armenian • Icelandic • Georgian • Korean • Latin • Lithuanian • Latvian • Macedonian • Mongolian • Persian • Breton • Slovak • Slovenian • Serbian • Turkish • Ukrainian • Vietnamese

---

## Quick Start

### Option 1: Deploy Your Own (Recommended)

Click the button to deploy your own instance:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/jezweb/spell-checker-mcp)

This will automatically:
1. Fork the repository to your GitHub account
2. Create R2 buckets for dictionaries and documents
3. Set up Workers AI binding for grammar checking
4. Deploy to Cloudflare Workers with CI/CD

**After deployment:**
- Your server will be live at: `https://spell-checker-mcp.<your-subdomain>.workers.dev`
- No additional configuration needed - all bindings are auto-provisioned!

### Option 2: Use Public Instance

Connect to the public demo instance (rate-limited):

```bash
# Claude Code CLI
claude mcp add spell-checker --transport http https://spell-checker-mcp-api.webfonts.workers.dev/mcp
```

### Option 3: Run Locally

```bash
# Clone repository
git clone https://github.com/jezweb/spell-checker-mcp.git
cd spell-checker-mcp

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## Installation

Connect this MCP server to your favorite AI coding assistant.

<details>
<summary><b>Claude Code CLI</b></summary>

### Via CLI (Recommended)

**Use HTTP transport (deployed server):**
```bash
claude mcp add spell-checker --transport http https://your-worker.workers.dev/mcp
```

**Or use NPX (local):**
```bash
claude mcp add spell-checker -- npx -y spell-checker-mcp
```

### Via Configuration File

Add to `~/.claude/mcp.json` (user-level) or `.mcp.json` (project-level):

**HTTP Transport:**
```json
{
  "mcpServers": {
    "spell-checker": {
      "url": "https://your-worker.workers.dev/mcp",
      "transport": "http"
    }
  }
}
```

**NPX (local):**
```json
{
  "mcpServers": {
    "spell-checker": {
      "command": "npx",
      "args": ["-y", "spell-checker-mcp"]
    }
  }
}
```

### Verify Installation

```bash
claude mcp list
claude mcp get spell-checker
```

</details>

<details>
<summary><b>Cursor</b></summary>

1. Open Cursor Settings
2. Navigate to "MCP Servers"
3. Click "Add Server"
4. Choose configuration:

**HTTP Transport (Deployed Server):**
```json
{
  "mcpServers": {
    "spell-checker": {
      "url": "https://your-worker.workers.dev/mcp",
      "transport": "http"
    }
  }
}
```

**NPX (Local):**
```json
{
  "mcpServers": {
    "spell-checker": {
      "command": "npx",
      "args": ["-y", "spell-checker-mcp"]
    }
  }
}
```

5. Save and restart Cursor

</details>

<details>
<summary><b>Cline (VS Code Extension)</b></summary>

Add to `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`:

**HTTP Transport:**
```json
{
  "mcpServers": {
    "spell-checker": {
      "url": "https://your-worker.workers.dev/mcp",
      "transport": "http"
    }
  }
}
```

**NPX:**
```json
{
  "mcpServers": {
    "spell-checker": {
      "command": "npx",
      "args": ["-y", "spell-checker-mcp"]
    }
  }
}
```

Restart VS Code after configuration.

</details>

<details>
<summary><b>Roo Code</b></summary>

### Project Configuration

Create `.roo/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "spell-checker": {
      "url": "https://your-worker.workers.dev/mcp",
      "transport": "http"
    }
  }
}
```

### Global Configuration

Add to VS Code settings under `mcp_settings.json`:

```json
{
  "mcpServers": {
    "spell-checker": {
      "command": "npx",
      "args": ["-y", "spell-checker-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Zed Editor</b></summary>

Add to `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "spell-checker": {
      "settings": {
        "url": "https://your-worker.workers.dev/mcp",
        "transport": "http"
      }
    }
  }
}
```

Restart Zed after configuration.

</details>

<details>
<summary><b>Other MCP Clients</b></summary>

Most MCP clients support the standard configuration format:

**HTTP Transport:**
```json
{
  "mcpServers": {
    "spell-checker": {
      "url": "https://your-worker.workers.dev/mcp",
      "transport": "http"
    }
  }
}
```

**Stdio (NPX):**
```json
{
  "mcpServers": {
    "spell-checker": {
      "command": "npx",
      "args": ["-y", "spell-checker-mcp"]
    }
  }
}
```

Consult your client's documentation for the specific configuration file location.

</details>

---

## MCP Tools

### `spell_check_analyze`

Analyze text for spelling errors with suggestions.

**Input:**
```json
{
  "text": "The text to check for speling errors",
  "language": "en-au"
}
```

**Output:**
```json
{
  "summary": "Found 1 spelling error",
  "errors": [
    {
      "word": "speling",
      "line": 1,
      "column": 25,
      "suggestions": ["spelling", "spieling", "peeling"]
    }
  ]
}
```

**Parameters:**
- `text` (required): Text to analyze
- `language` (optional): Language code (defaults to auto-detect)

### `spell_check_grammar`

AI-powered grammar and style checking.

**Input:**
```json
{
  "text": "The team are ready but they dont know what their doing.",
  "language": "en-au"
}
```

**Output:**
```json
{
  "summary": "Found 2 grammar issues",
  "errors": [
    {
      "message": "Missing apostrophe in contraction",
      "context": "they dont know",
      "suggestions": ["they don't know"],
      "ruleId": "APOSTROPHE_MISSING",
      "category": "PUNCTUATION"
    },
    {
      "message": "Incorrect use of 'their' - should be 'they're'",
      "context": "what their doing",
      "suggestions": ["what they're doing"],
      "ruleId": "THEIR_THEYRE",
      "category": "GRAMMAR"
    }
  ]
}
```

**Categories:**
- `GRAMMAR`: Subject-verb agreement, tense, etc.
- `PUNCTUATION`: Apostrophes, commas, quotation marks
- `STYLE`: Wordiness, passive voice, clarity
- `TYPOGRAPHY`: Spacing, capitalization

### `spell_check_correct`

Auto-correct spelling and grammar errors.

**Input:**
```json
{
  "text": "The text to corect with speling and grammer errors.",
  "language": "en-au",
  "mode": "both"
}
```

**Output:**
```json
{
  "original": "The text to corect with speling and grammer errors.",
  "corrected": "The text to correct with spelling and grammar errors.",
  "changes": [
    {
      "type": "spelling",
      "position": 12,
      "original": "corect",
      "correction": "correct",
      "confidence": 0.95
    },
    {
      "type": "spelling",
      "position": 24,
      "original": "speling",
      "correction": "spelling",
      "confidence": 0.98
    },
    {
      "type": "spelling",
      "position": 36,
      "original": "grammer",
      "correction": "grammar",
      "confidence": 0.92
    }
  ],
  "summary": "Applied 3 corrections",
  "r2": {
    "url": "https://spell-checker-documents.your-account.r2.dev/abc123.txt",
    "key": "abc123.txt",
    "size": 52,
    "expiresAt": "2025-12-13T00:00:00Z"
  }
}
```

**Modes:**
- `spelling`: Fix spelling only (fast, no AI required)
- `grammar`: Fix grammar only (AI-powered)
- `both`: Fix spelling then grammar (default)

**R2 Storage:**
All corrected documents are automatically uploaded to R2 storage with:
- 30-day automatic expiration
- Unique non-guessable URLs
- Public read access

---

## Architecture

### Tech Stack

- **Runtime**: Cloudflare Workers (V8 isolates)
- **Framework**: Hono (lightweight HTTP)
- **Spell Checking**: nspell + 53 Hunspell dictionaries
- **Language Detection**: franc-min (automatic)
- **Grammar AI**: Workers AI (DeepSeek R1 Distill Qwen 32B)
- **Storage**: R2 (dictionaries + corrected documents)
- **Transport**: HTTP JSON-RPC (MCP standard)

### Project Structure

```
src/
├── index.ts              # Main Worker entry, HTTP routes
├── lib/
│   ├── dictionary.ts     # Dictionary loader with R2 lazy loading
│   ├── spellcheck.ts     # nspell wrapper with position tracking
│   ├── grammar.ts        # Workers AI grammar checking
│   ├── correction.ts     # Correction application logic
│   └── storage.ts        # R2 document storage
├── mcp/
│   ├── server.ts         # MCP request handler
│   ├── tools.ts          # Tool definitions (3 tools)
│   └── types.ts          # JSON-RPC type definitions
├── tools/
│   ├── analyze.ts        # spell_check_analyze implementation
│   ├── grammar.ts        # spell_check_grammar implementation
│   └── correct.ts        # spell_check_correct implementation
├── prompts/
│   ├── types.ts          # Grammar prompt configuration interfaces
│   └── grammar-prompts.ts # 53-language grammar prompts registry
└── utils/
    └── responses.ts      # JSON-RPC response helpers
```

### Bindings

Configured in `wrangler.jsonc`:

- **SPELL_CHECK_DICTS**: R2 bucket for dictionaries (170MB, 106 files)
- **SPELL_CHECK_DOCS**: R2 bucket for corrected documents (30-day lifecycle)
- **AI**: Workers AI binding for grammar checking
- **MCP_METRICS**: Analytics Engine for usage tracking

---

## Development

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Setup

```bash
# Install dependencies
npm install

# Generate Cloudflare types
npm run cf-typegen

# Start dev server
npm run dev
# Server runs on http://localhost:8787
```

### Testing

```bash
# Health check
curl http://localhost:8787/health

# Test spell checking
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "spell_check_analyze",
      "arguments": {
        "text": "This is a tesst with speling errors"
      }
    }
  }'
```

### Deployment

```bash
# Build TypeScript
npm run build

# Deploy to Cloudflare
npm run deploy
```

**Production URL:** `https://spell-checker-mcp.<your-subdomain>.workers.dev`

---

## Configuration

### Environment Variables

None required! All bindings (R2, AI) are provisioned automatically via the Deploy to Cloudflare button.

### Custom Deployment

If deploying manually:

1. **Create R2 Buckets:**
   ```bash
   wrangler r2 bucket create spell-checker-dictionaries
   wrangler r2 bucket create spell-checker-documents
   ```

2. **Upload Dictionaries:**
   ```bash
   npm run upload-dictionaries
   ```

3. **Configure Lifecycle Policy** (30-day auto-delete):
   ```bash
   wrangler r2 bucket lifecycle set spell-checker-documents \
     --expiration-days 30
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

---

## Performance

### Benchmarks

- **Spell check (cached)**: <50ms
- **Spell check (first load)**: 200-400ms (R2 fetch + parse)
- **Grammar check**: 800-1500ms (AI inference)
- **Auto-correct**: 300-2000ms (depends on mode)

### Bundle Size

- **Worker bundle**: 348KB (gzipped)
- **Dictionaries**: 170MB (R2 lazy-loaded, not bundled)

### Caching Strategy

- **Dictionaries**: In-memory cache (per-language, per-isolate)
- **HTTP responses**: Standard Cloudflare CDN caching
- **AI results**: No caching (always fresh grammar checks)

---

## Troubleshooting

<details>
<summary><b>MCP server not connecting</b></summary>

**Check server status:**
```bash
curl https://your-worker.workers.dev/health
```

**Verify client configuration:**
```bash
# Claude Code CLI
claude mcp get spell-checker
```

**Check logs:**
```bash
wrangler tail
```

</details>

<details>
<summary><b>Grammar checking fails</b></summary>

**Verify Workers AI binding:**
```bash
wrangler deployments list
```

Workers AI binding must be configured in `wrangler.jsonc`:
```json
{
  "ai": {
    "binding": "AI"
  }
}
```

</details>

<details>
<summary><b>R2 upload errors</b></summary>

**Check R2 bucket exists:**
```bash
wrangler r2 bucket list
```

**Verify bindings:**
```bash
wrangler deployments list
```

Bindings must match `wrangler.jsonc` configuration.

</details>

<details>
<summary><b>Deployment fails</b></summary>

**Common issues:**

1. **Missing Wrangler login:**
   ```bash
   wrangler login
   ```

2. **Binding name mismatch:**
   - Check `wrangler.jsonc` binding names
   - Must match variable names in code

3. **TypeScript errors:**
   ```bash
   npm run build
   ```

</details>

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript strict mode
- Follow existing code style
- Add tests for new features
- Update documentation

---

## Roadmap

- [ ] URL fetching support (spell check content from external URLs)
- [ ] Document format conversion (HTML → text, PDF → text)
- [ ] Chunking for very large documents (>1MB)
- [ ] Custom dictionary management (add/remove words)
- [ ] Language-specific grammar rules refinement
- [ ] Batch processing API
- [ ] WebSocket streaming for real-time checking

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Jeremy Dawes (Jezweb)

---

## Author

**Jezweb** - [jeremy@jezweb.net](mailto:jeremy@jezweb.net)

- Website: [jezweb.com.au](https://www.jezweb.com.au)
- GitHub: [@jezweb](https://github.com/jezweb)

---

## Acknowledgments

- [nspell](https://github.com/wooorm/nspell) - Spell checking engine
- [franc-min](https://github.com/wooorm/franc) - Language detection
- [Hunspell dictionaries](https://github.com/wooorm/dictionaries) - Dictionary files
- [Cloudflare Workers](https://workers.cloudflare.com) - Edge compute platform
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification

---

**Built with ❤️ on Cloudflare Workers**
