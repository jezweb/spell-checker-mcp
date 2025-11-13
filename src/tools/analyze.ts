import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { checkSpelling } from '../lib/spellcheck';
import { isLanguageSupported, type LanguageCode } from '../lib/dictionary';

export const analyzeToolDefinition: Tool = {
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
};

export async function handleAnalyzeTool(args: {
  text?: string;
  language?: string;
}): Promise<CallToolResult> {
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

  // Run spell check
  const result = await checkSpelling(args.text, language);

  // Format result for MCP
  const summary = `Checked ${result.wordCount} words. Found ${result.errorCount} spelling error${result.errorCount === 1 ? '' : 's'}.`;

  let detailsText = '';
  if (result.errors.length > 0) {
    detailsText = '\n\nErrors:\n';
    result.errors.forEach((error, index) => {
      const suggestionsText =
        error.suggestions.length > 0
          ? ` → Suggestions: ${error.suggestions.join(', ')}`
          : ' → No suggestions available';

      detailsText += `${index + 1}. "${error.word}" at line ${error.line}, column ${error.column}${suggestionsText}\n`;
    });
  } else {
    detailsText = '\n\nNo spelling errors found! ✓';
  }

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
