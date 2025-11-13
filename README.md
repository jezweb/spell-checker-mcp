# Spell Checker MCP API

MCP server for Australian English spell checking with AI-powered grammar support, deployed on Cloudflare Workers.

## Features

- **nspell + dictionary-en-au**: Fast, free spell checking
- **Workers AI (GPT-OSS-120B)**: Grammar and context checking
- **Multi-language support**: Extensible architecture (starts with EN-AU)
- **Dual modes**: Analyze (show errors) vs Auto-correct (apply fixes)
- **R2 storage**: Handles large documents efficiently
- **Cloudflare Workers**: Global edge deployment

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Generate types
npm run cf-typegen

# Deploy
npm run deploy
```

## MCP Tools

### `spell_check_analyze`
Analyze text for spelling errors using Australian English dictionary.

**Input:**
```json
{
  "text": "The text to check",
  "language": "en-AU"
}
```

**Output:**
```json
{
  "errors": [
    {
      "word": "recieve",
      "position": 45,
      "suggestions": ["receive", "relieve"]
    }
  ]
}
```

### `spell_check_grammar` (Coming Soon)
Full grammar and style checking with AI.

### `spell_check_correct` (Coming Soon)
Auto-correct spelling errors and return corrected text.

## Architecture

- **Frontend**: Cloudflare Workers (Hono framework)
- **MCP Transport**: SSE (Server-Sent Events)
- **Spell Check**: nspell + dictionary-en-au (bundled)
- **Grammar**: Workers AI (@cf/openai/gpt-oss-120b)
- **Storage**: R2 (for large documents > 100KB)

## Project Structure

```
src/
├── index.ts           # Main Worker entry point
├── lib/
│   ├── dictionary.ts  # Dictionary loader (multi-language)
│   ├── spellcheck.ts  # nspell wrapper
│   ├── grammar.ts     # AI grammar checking
│   ├── corrector.ts   # Correction application
│   └── storage.ts     # R2 operations
├── tools/
│   ├── analyze.ts     # spell_check_analyze MCP tool
│   ├── grammar.ts     # spell_check_grammar MCP tool
│   └── correct.ts     # spell_check_correct MCP tool
└── prompts/
    └── au-english.ts  # AI system prompts
```

## License

MIT

## Author

Jezweb <jeremy@jezweb.net>
