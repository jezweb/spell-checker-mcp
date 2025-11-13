import { Hono } from 'hono';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

type Env = Cloudflare.Env;

const app = new Hono<{ Bindings: Env }>();

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'spell-checker-mcp-api',
    version: '1.0.0',
    description: 'MCP server for Australian English spell checking',
    endpoints: {
      mcp: '/mcp',
      health: '/',
    },
  });
});

// MCP SSE endpoint
app.get('/mcp', async (c) => {
  const server = new Server(
    {
      name: 'spell-checker-mcp-api',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define available tools
  const tools: Tool[] = [
    {
      name: 'spell_check_analyze',
      description:
        'Analyze text for spelling errors using Australian English dictionary. Returns list of misspelled words with suggestions.',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to check for spelling errors',
          },
          language: {
            type: 'string',
            description: 'Language code (default: en-AU)',
            enum: ['en-AU'],
            default: 'en-AU',
          },
        },
        required: ['text'],
      },
    },
  ];

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  // Handle tool call request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'spell_check_analyze') {
      // Placeholder response for Phase 1
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Spell check tool placeholder - dictionary integration coming in Phase 2',
              text: args.text || '',
              language: args.language || 'en-AU',
            }, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  // Create SSE transport
  const transport = new SSEServerTransport('/mcp', c.req.raw);
  await server.connect(transport);

  return transport.response;
});

export default app;
