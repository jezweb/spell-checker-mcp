import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const tools: Tool[] = [
  {
    name: 'spell_check_analyze',
    description:
      'Analyze text for spelling errors using Australian English dictionary. Returns list of misspelled words with line/column positions and suggestions. Fast and free (uses local dictionary, no AI).',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to check for spelling errors',
        },
        language: {
          type: 'string',
          description: 'Language code for spell checking (default: en-AU)',
          enum: ['en-AU'],
          default: 'en-AU',
        },
      },
      required: ['text'],
    },
  },
];

export function getToolByName(name: string): Tool | undefined {
  return tools.find((tool) => tool.name === name);
}
