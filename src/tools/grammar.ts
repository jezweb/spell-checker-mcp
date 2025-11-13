import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { checkGrammar } from '../lib/grammar';
import { checkSpelling } from '../lib/spellcheck';
import { isLanguageSupported, type LanguageCode } from '../lib/dictionary';

export const grammarToolDefinition: Tool = {
  name: 'spell_check_grammar',
  description:
    'Check text for grammar, punctuation, and style issues using AI (DeepSeek R1 32B). Respects Australian English conventions. Returns detailed errors with suggestions and context. Automatically detects spelling errors first to provide context to AI for more accurate grammar checking.',
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

  // First, run spell check to get spelling errors for context
  const spellCheckResult = await checkSpelling(args.text, language);

  // Run grammar check with spelling context
  const result = await checkGrammar(
    args.text,
    ai,
    language,
    spellCheckResult.errors // Pass spelling errors as context
  );

  // Format result for MCP
  const summary = `Grammar check complete. Found ${result.errorCount} issue${result.errorCount === 1 ? '' : 's'}.`;

  let detailsText = '';

  // Show spelling context if any
  if (spellCheckResult.errors.length > 0) {
    detailsText += `\n\nSpelling errors detected (provided as context to AI):\n`;
    spellCheckResult.errors.slice(0, 5).forEach((err) => {
      const suggestions = err.suggestions.slice(0, 3).join(', ');
      detailsText += `- "${err.word}" → ${suggestions}\n`;
    });
    if (spellCheckResult.errors.length > 5) {
      detailsText += `... and ${spellCheckResult.errors.length - 5} more\n`;
    }
  }

  if (result.errors.length > 0) {
    detailsText += '\n\nGrammar/Style issues:\n';
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
    detailsText += '\n\nNo grammar issues found! ✓';
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
