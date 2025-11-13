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

// Root endpoint - server info (public)
app.get('/', (c) => {
  return c.json({
    name: 'spell-checker-mcp-api',
    version: '1.0.0',
    description: 'MCP server for Australian English spell checking with AI grammar support',
    transport: 'http',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
    tools: ['spell_check_analyze', 'spell_check_grammar', 'spell_check_correct'],
    usage: {
      example: {
        method: 'POST',
        url: '/mcp',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      },
    },
  });
});

// MCP endpoint (POST only for JSON-RPC requests)
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
