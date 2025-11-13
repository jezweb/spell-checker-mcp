import type { MCPRequest, MCPResponse } from './types';
import { tools, getToolByName } from './tools';
import {
  createMCPResponse,
  createMethodNotFound,
  createInvalidParams,
  createInternalError,
} from '../utils/responses';
import { checkSpelling } from '../lib/spellcheck';
import { isLanguageSupported, type LanguageCode } from '../lib/dictionary';

export async function handleMCPRequest(
  request: MCPRequest
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
          let result: any;

          switch (toolName) {
            case 'spell_check_analyze': {
              // Validate arguments
              if (!args.text) {
                return createInvalidParams(id, 'Missing required argument: text');
              }

              const language = (args.language || 'en-AU') as LanguageCode;

              if (!isLanguageSupported(language)) {
                return createInvalidParams(
                  id,
                  `Unsupported language: ${language}. Supported languages: en-AU`
                );
              }

              // Run spell check
              const spellCheckResult = await checkSpelling(args.text, language);

              // Format result for MCP
              const summary = `Checked ${spellCheckResult.wordCount} words. Found ${spellCheckResult.errorCount} spelling error${spellCheckResult.errorCount === 1 ? '' : 's'}.`;

              let detailsText = '';
              if (spellCheckResult.errors.length > 0) {
                detailsText = '\n\nErrors:\n';
                spellCheckResult.errors.forEach((error, index) => {
                  const suggestionsText =
                    error.suggestions.length > 0
                      ? ` → Suggestions: ${error.suggestions.join(', ')}`
                      : ' → No suggestions available';

                  detailsText += `${index + 1}. "${error.word}" at line ${error.line}, column ${error.column}${suggestionsText}\n`;
                });
              } else {
                detailsText = '\n\nNo spelling errors found! ✓';
              }

              result = {
                summary: summary + detailsText,
                data: spellCheckResult,
              };
              break;
            }

            default:
              return createInternalError(
                id,
                `Tool "${toolName}" not yet implemented`
              );
          }

          return createMCPResponse(id, {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          });
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
