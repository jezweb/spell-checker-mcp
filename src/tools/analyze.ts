import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { checkSpelling } from '../lib/spellcheck';
import { isLanguageSupported, getSupportedLanguages, type LanguageCode } from '../lib/dictionary';

export const analyzeToolDefinition: Tool = {
  name: 'spell_check_analyze',
  description:
    'Analyze text for spelling errors in 56+ languages. Returns list of misspelled words with line/column positions and suggestions. Supports auto-detection if language not specified. Fast and free (uses dictionaries, no AI).',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to check for spelling errors',
      },
      language: {
        type: 'string',
        description: 'Language code for spell checking (optional, will auto-detect if not provided)',
        enum: [
          'en', 'en-au', 'en-ca', 'en-gb', 'en-us', 'en-za',
          'es', 'fr', 'de', 'it', 'nl', 'pt', 'ru',
          'pl', 'cs', 'ro', 'sv', 'da', 'nb', 'nn',
          'bg', 'ca', 'cy', 'el', 'eo', 'et', 'eu',
          'fo', 'fur', 'fy', 'ga', 'gd', 'gl', 'he',
          'hr', 'hu', 'hy', 'is', 'ka', 'ko', 'lt',
          'lv', 'mk', 'mn', 'fa', 'br', 'la', 'sk',
          'sl', 'sr', 'tr', 'uk', 'vi'
        ],
      },
    },
    required: ['text'],
  },
};

export async function handleAnalyzeTool(
  args: {
    text?: string;
    language?: string;
  },
  r2Bucket?: R2Bucket
): Promise<CallToolResult> {
  // Validate arguments
  if (!args.text) {
    throw new Error('Missing required argument: text');
  }

  if (!r2Bucket) {
    throw new Error('R2 bucket not available for dictionary loading');
  }

  // Validate language if provided
  const language = args.language ? (args.language.toLowerCase() as LanguageCode) : undefined;

  if (language && !isLanguageSupported(language)) {
    const supported = getSupportedLanguages();
    throw new Error(
      `Unsupported language: ${language}. Supported languages: ${supported.map(l => l.code).join(', ')}`
    );
  }

  // Run spell check (will auto-detect if language not specified)
  const result = await checkSpelling(args.text, language, r2Bucket);

  // Format result for MCP
  let summary = `Checked ${result.wordCount} words in ${result.language.toUpperCase()}. Found ${result.errorCount} spelling error${result.errorCount === 1 ? '' : 's'}.`;

  // Add auto-detection info if language was detected
  if (result.detectedLanguage !== undefined) {
    if (result.detectedLanguage) {
      summary += ` (Auto-detected language: ${result.language.toUpperCase()})`;
    } else {
      summary += ` (Auto-detection failed, used default: ${result.language.toUpperCase()})`;
    }
  }

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
