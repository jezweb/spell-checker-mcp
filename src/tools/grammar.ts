import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { checkGrammar } from '../lib/grammar';
import { isLanguageSupported, type LanguageCode } from '../lib/dictionary';

export const grammarToolDefinition: Tool = {
  name: 'spell_check_grammar',
  description:
    'Check text for grammar, punctuation, and style issues using AI (Workers AI Llama 3.1). Respects Australian English conventions. Returns detailed errors with suggestions and context. Slower than spell check but catches grammar issues.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to check for grammar and style issues',
      },
      language: {
        type: 'string',
        description: 'Language code for grammar checking (default: en-AU)',
        enum: ['en-AU'],
        default: 'en-AU',
      },
    },
    required: ['text'],
  },
};

export async function handleGrammarTool(
  args: {
    text?: string;
    language?: string;
  },
  ai: Ai
): Promise<CallToolResult> {
  // Validate arguments
  if (!args.text) {
    throw new Error('Missing required argument: text');
  }

  const language = (args.language || 'en-AU') as LanguageCode;

  if (!isLanguageSupported(language)) {
    throw new Error(
      `Unsupported language: ${language}. Supported languages: en-AU`
    );
  }

  // Run grammar check
  const result = await checkGrammar(args.text, ai, language);

  // Format result for MCP
  const summary = `Grammar check complete. Found ${result.errorCount} issue${result.errorCount === 1 ? '' : 's'}.`;

  let detailsText = '';
  if (result.errors.length > 0) {
    detailsText = '\n\nIssues:\n';
    result.errors.forEach((error, index) => {
      const suggestionsText =
        error.suggestions.length > 0
          ? ` → Suggestions: ${error.suggestions.join(', ')}`
          : '';

      detailsText += `${index + 1}. [${error.category}] ${error.message}\n`;
      detailsText += `   Context: "${error.context}"\n`;
      detailsText += `   Position: offset ${error.offset}, length ${error.length}${suggestionsText}\n`;
      detailsText += `   Rule: ${error.ruleId}\n\n`;
    });
  } else {
    detailsText = '\n\nNo grammar issues found! ✓';
  }

  detailsText += `\nModel: ${result.aiModel}`;

  return {
    content: [
      {
        type: 'text',
        text: `${summary}${detailsText}`,
      },
      {
        type: 'text',
        text: `\nJSON Result:\n${JSON.stringify(result, null, 2)}`,
      },
    ],
  };
}
