import type { MCPRequest, MCPResponse } from './types';
import { tools, getToolByName } from './tools';
import {
  createMCPResponse,
  createMethodNotFound,
  createInvalidParams,
  createInternalError,
} from '../utils/responses';
import { handleAnalyzeTool } from '../tools/analyze';
import { handleGrammarTool } from '../tools/grammar';
import { handleCorrectTool } from '../tools/correct';

export async function handleMCPRequest(
  request: MCPRequest,
  ai?: Ai,
  r2Bucket?: R2Bucket
): Promise<MCPResponse> {
  const { id, method, params } = request;

  try {
    // Handle MCP protocol methods
    switch (method) {
      case 'initialize':
        return createMCPResponse(id, {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'spell-checker-mcp-api',
            version: '1.0.0',
          },
          capabilities: {
            tools: {},
          },
        });

      case 'tools/list':
        return createMCPResponse(id, {
          tools: tools,
        });

      case 'tools/call': {
        const toolName = params?.name;
        const args = params?.arguments || {};

        if (!toolName) {
          return createInvalidParams(id, 'Tool name is required');
        }

        const tool = getToolByName(toolName);
        if (!tool) {
          return createMethodNotFound(id);
        }

        // Dispatch to tool handlers
        try {
          let toolResult: any;

          switch (toolName) {
            case 'spell_check_analyze':
              toolResult = await handleAnalyzeTool(args);
              break;

            case 'spell_check_grammar':
              if (!ai) {
                return createInternalError(
                  id,
                  'AI binding not available for grammar checking'
                );
              }
              toolResult = await handleGrammarTool(args, ai);
              break;

            case 'spell_check_correct':
              // Correction tool can work without AI (spelling-only mode)
              toolResult = await handleCorrectTool(args, ai, r2Bucket);
              break;

            default:
              return createInternalError(
                id,
                `Tool "${toolName}" not yet implemented`
              );
          }

          return createMCPResponse(id, toolResult);
        } catch (error: any) {
          console.error(`Tool execution error (${toolName}):`, error);
          return createInternalError(id, error.message);
        }
      }

      default:
        return createMethodNotFound(id);
    }
  } catch (error: any) {
    console.error('MCP request error:', error);
    return createInternalError(id, error.message);
  }
}
