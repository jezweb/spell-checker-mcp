import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { MCPRequest } from './mcp/types';
import { handleMCPRequest } from './mcp/server';
import { createInvalidRequest, createParseError } from './utils/responses';

type Env = Cloudflare.Env;

const app = new Hono<{ Bindings: Env }>();

// CORS middleware - allow all origins for MCP
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint (public)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: '1.1.0',
    tools: 3,
    languages: 53,
    description: 'Multi-language spell and grammar checker MCP server (53 languages with auto-detection)',
    features: {
      spelling: '53 languages',
      grammar: '53 languages (AI-powered)',
      autoCorrect: '3 modes (spelling/grammar/both)',
      languageDetection: 'Automatic with franc-min'
    }
  });
});

// Root endpoint - landing page (public)
app.get('/', (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spell Checker MCP Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #e4e4e7;
      background: #09090b;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    header {
      text-align: center;
      padding: 3rem 0;
      border-bottom: 1px solid #27272a;
    }
    h1 {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #a78bfa 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .tagline {
      font-size: 1.25rem;
      color: #a1a1aa;
      margin-bottom: 2rem;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .cta-container {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 3rem;
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }
    .btn-primary {
      background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
      color: white;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(124, 58, 237, 0.4); }
    .btn-secondary {
      background: #18181b;
      color: #e4e4e7;
      border: 1px solid #27272a;
    }
    .btn-secondary:hover { background: #27272a; }
    section {
      margin: 3rem 0;
      padding: 2rem 0;
    }
    h2 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #fafafa;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .feature-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: all 0.3s;
    }
    .feature-card:hover {
      border-color: #7c3aed;
      transform: translateY(-4px);
    }
    .feature-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .feature-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #fafafa;
    }
    .feature-desc {
      color: #a1a1aa;
      font-size: 0.9rem;
    }
    .code-block {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 0.5rem;
      padding: 1.5rem;
      overflow-x: auto;
      margin: 1rem 0;
    }
    pre {
      font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.875rem;
      line-height: 1.7;
    }
    .json { color: #a78bfa; }
    .string { color: #34d399; }
    .number { color: #fbbf24; }
    .key { color: #60a5fa; }
    .tools-grid {
      display: grid;
      gap: 1rem;
      margin-top: 1rem;
    }
    .tool-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 0.5rem;
      padding: 1rem 1.5rem;
    }
    .tool-name {
      font-family: 'SF Mono', Consolas, monospace;
      color: #a78bfa;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .tool-desc { color: #a1a1aa; font-size: 0.9rem; }
    .stats {
      display: flex;
      gap: 2rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 2rem;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #a78bfa;
    }
    .stat-label {
      color: #a1a1aa;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    footer {
      text-align: center;
      padding: 2rem 0;
      border-top: 1px solid #27272a;
      color: #71717a;
      font-size: 0.875rem;
    }
    footer a {
      color: #a78bfa;
      text-decoration: none;
    }
    footer a:hover {
      text-decoration: underline;
    }
    .api-endpoint {
      background: #18181b;
      border-left: 3px solid #7c3aed;
      padding: 1rem 1.5rem;
      margin: 1rem 0;
      border-radius: 0.25rem;
    }
    .endpoint-method {
      display: inline-block;
      background: #7c3aed;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.5rem;
    }
    .endpoint-path {
      font-family: 'SF Mono', Consolas, monospace;
      color: #a78bfa;
    }
    @media (max-width: 768px) {
      h1 { font-size: 2rem; }
      .features { grid-template-columns: 1fr; }
      .stats { flex-direction: column; gap: 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>✓ Spell Checker MCP Server</h1>
      <p class="tagline">Multi-language spell checking and AI-powered grammar correction for MCP clients</p>

      <div class="status">
        <span class="status-indicator"></span>
        <span>Server Online • v1.1.0 • 53 Languages</span>
      </div>

      <div class="cta-container">
        <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/jezweb/spell-checker-mcp" class="btn btn-primary">
          ☁️ Deploy to Cloudflare
        </a>
        <a href="https://github.com/jezweb/spell-checker-mcp" class="btn btn-secondary">
          📖 View on GitHub
        </a>
      </div>
    </header>

    <section>
      <h2>Features</h2>
      <div class="features">
        <div class="feature-card">
          <div class="feature-icon">🌍</div>
          <div class="feature-title">53 Languages</div>
          <div class="feature-desc">Comprehensive spell checking with automatic language detection using franc-min</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <div class="feature-title">AI Grammar</div>
          <div class="feature-desc">Context-aware grammar checking powered by DeepSeek R1 32B via Workers AI</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <div class="feature-title">Edge Deployment</div>
          <div class="feature-desc">Global low-latency via Cloudflare Workers with R2 dictionary caching</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔧</div>
          <div class="feature-title">Auto-Correction</div>
          <div class="feature-desc">Three modes: spelling only, grammar only, or both combined</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💾</div>
          <div class="feature-title">Document Storage</div>
          <div class="feature-desc">Corrected documents saved to R2 with 30-day auto-delete</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🚀</div>
          <div class="feature-title">Zero-Config</div>
          <div class="feature-desc">One-click deployment with automatic resource provisioning</div>
        </div>
      </div>
    </section>

    <section>
      <h2>MCP Tools</h2>
      <div class="tools-grid">
        <div class="tool-card">
          <div class="tool-name">spell_check_analyze</div>
          <div class="tool-desc">Analyze text for spelling errors with line/column positions and suggestions</div>
        </div>
        <div class="tool-card">
          <div class="tool-name">spell_check_grammar</div>
          <div class="tool-desc">AI-powered grammar and style checking with context and rule categorization</div>
        </div>
        <div class="tool-card">
          <div class="tool-name">spell_check_correct</div>
          <div class="tool-desc">Auto-correct spelling and grammar errors, returns corrected text and R2 storage URL</div>
        </div>
      </div>
    </section>

    <section>
      <h2>Quick Start</h2>
      <p style="color: #a1a1aa; margin-bottom: 1rem;">Connect to this MCP server using Claude Code CLI:</p>
      <div class="code-block">
        <pre><span class="key">claude</span> mcp add spell-checker --transport http <span class="string">${c.req.url.split('/')[0]}//${c.req.url.split('/')[2]}/mcp</span></pre>
      </div>

      <p style="color: #a1a1aa; margin: 1.5rem 0 1rem;">Or test the API directly:</p>
      <div class="code-block">
        <pre><span class="key">curl</span> -X POST <span class="string">${c.req.url.split('/')[0]}//${c.req.url.split('/')[2]}/mcp</span> \\
  -H <span class="string">"Content-Type: application/json"</span> \\
  -d <span class="string">'{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}'</span></pre>
      </div>
    </section>

    <section>
      <h2>API Endpoints</h2>
      <div class="api-endpoint">
        <span class="endpoint-method">POST</span>
        <span class="endpoint-path">/mcp</span>
        <p style="color: #a1a1aa; margin-top: 0.5rem; font-size: 0.9rem;">MCP JSON-RPC endpoint for tool invocation</p>
      </div>
      <div class="api-endpoint">
        <span class="endpoint-method">GET</span>
        <span class="endpoint-path">/health</span>
        <p style="color: #a1a1aa; margin-top: 0.5rem; font-size: 0.9rem;">Health check and server status</p>
      </div>
    </section>

    <section>
      <h2>Performance</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">&lt;50ms</div>
          <div class="stat-label">Spell Check (Cached)</div>
        </div>
        <div class="stat">
          <div class="stat-value">348KB</div>
          <div class="stat-label">Bundle Size</div>
        </div>
        <div class="stat">
          <div class="stat-value">53</div>
          <div class="stat-label">Languages</div>
        </div>
      </div>
    </section>

    <footer>
      <p>Built with ❤️ on Cloudflare Workers by <a href="https://jezweb.com.au" target="_blank">Jezweb</a></p>
      <p style="margin-top: 0.5rem;">
        <a href="https://github.com/jezweb/spell-checker-mcp" target="_blank">GitHub</a> •
        <a href="https://github.com/jezweb/spell-checker-mcp#readme" target="_blank">Documentation</a> •
        <a href="https://github.com/jezweb/spell-checker-mcp/blob/main/LICENSE" target="_blank">MIT License</a>
      </p>
    </footer>
  </div>
</body>
</html>`;

  return c.html(html);
});

// MCP endpoint - GET returns info, POST handles JSON-RPC
app.get('/mcp', (c) => {
  return c.json({
    name: 'spell-checker-mcp',
    version: '1.1.0',
    description: 'MCP server for multi-language spell and grammar checking',
    transport: 'http',
    protocol: 'json-rpc',
    note: 'This server uses HTTP transport (POST only). Send JSON-RPC requests via POST.',
    usage: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      example: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      },
    },
  });
});

app.post('/mcp', async (c) => {
  try {
    const body = await c.req.json() as MCPRequest;

    // Validate JSON-RPC format
    if (!body || body.jsonrpc !== '2.0' || !body.method) {
      return c.json(createInvalidRequest(body?.id || 0));
    }

    // Pass AI and R2 bindings to MCP handler
    const response = await handleMCPRequest(
      body,
      c.env.AI,
      c.env.SPELL_CHECK_DOCS,
      c.env.SPELL_CHECK_DICTS
    );
    return c.json(response);
  } catch (error) {
    console.error('Failed to parse request:', error);
    return c.json(createParseError());
  }
});

export default app;
