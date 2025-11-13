import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { checkSpelling } from '../lib/spellcheck';
import { checkGrammar } from '../lib/grammar';
import {
  applySpellingCorrections,
  applyGrammarCorrections,
  type CorrectionOptions,
} from '../lib/correction';
import { isLanguageSupported, type LanguageCode } from '../lib/dictionary';

export const correctToolDefinition: Tool = {
  name: 'spell_check_correct',
  description:
    'Automatically correct spelling and/or grammar errors in text. Applies first suggestion for each error. Supports spelling-only, grammar-only, or combined correction modes. Returns original text, corrected text, and detailed change log.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to auto-correct',
      },
      language: {
        type: 'string',
        description: 'Language code for correction (default: en-AU)',
        enum: ['en-AU'],
        default: 'en-AU',
      },
      mode: {
        type: 'string',
        description:
          'Correction mode: spelling-only, grammar-only, or both (default: both)',
        enum: ['spelling', 'grammar', 'both'],
        default: 'both',
      },
    },
    required: ['text'],
  },
};

export async function handleCorrectTool(
  args: {
    text?: string;
    language?: string;
    mode?: 'spelling' | 'grammar' | 'both';
  },
  ai?: Ai
): Promise<CallToolResult> {
  // Validate arguments
  if (!args.text) {
    throw new Error('Missing required argument: text');
  }

  const language = (args.language || 'en-AU') as LanguageCode;
  const mode = args.mode || 'both';

  if (!isLanguageSupported(language)) {
    throw new Error(
      `Unsupported language: ${language}. Supported languages: en-AU`
    );
  }

  // If grammar mode is requested, ensure AI binding is available
  if ((mode === 'grammar' || mode === 'both') && !ai) {
    throw new Error('AI binding not available for grammar correction');
  }

  const options: CorrectionOptions = {
    mode,
    strategy: 'first-suggestion',
  };

  let result;

  try {
    if (mode === 'spelling') {
      // Spelling-only mode
      const spellCheckResult = await checkSpelling(args.text, language);
      result = applySpellingCorrections(args.text, spellCheckResult, options);
    } else if (mode === 'grammar') {
      // Grammar-only mode
      if (!ai) {
        throw new Error('AI binding required for grammar correction');
      }
      const grammarCheckResult = await checkGrammar(args.text, ai, language);
      result = applyGrammarCorrections(
        args.text,
        grammarCheckResult,
        options
      );
    } else {
      // Combined mode (both spelling and grammar)
      if (!ai) {
        throw new Error('AI binding required for combined correction');
      }

      // First, check and apply spelling corrections
      const spellCheckResult = await checkSpelling(args.text, language);
      const spellingCorrected = applySpellingCorrections(
        args.text,
        spellCheckResult,
        options
      );

      // Then, check grammar on the spelling-corrected text
      // This ensures grammar errors don't overlap with spelling corrections
      const grammarCheckResult = await checkGrammar(
        spellingCorrected.correctedText,
        ai,
        language
      );

      const grammarCorrected = applyGrammarCorrections(
        spellingCorrected.correctedText,
        grammarCheckResult,
        options
      );

      // Combine changes
      const allChanges = [...spellingCorrected.changes, ...grammarCorrected.changes];

      result = {
        originalText: args.text,
        correctedText: grammarCorrected.correctedText,
        changes: allChanges,
        changeCount: allChanges.length,
        conflictsResolved: 0,
        strategy: 'both',
      };

    }

    // Format result for MCP
    const summary = `Auto-correction complete (${mode} mode). Applied ${result.changeCount} change${result.changeCount === 1 ? '' : 's'}.`;

    let detailsText = '';

    if (result.changes.length > 0) {
      detailsText = '\n\nChanges applied:\n';
      result.changes.forEach((change, index) => {
        const typeLabel = change.type === 'spelling' ? 'SPELL' : 'GRAMMAR';
        const ruleInfo = change.ruleId ? ` [${change.ruleId}]` : '';
        const locationInfo =
          change.line && change.column
            ? ` (line ${change.line}, column ${change.column})`
            : ` (offset ${change.position})`;

        detailsText += `${index + 1}. [${typeLabel}${ruleInfo}] "${change.original}" → "${change.corrected}"${locationInfo}\n`;
        detailsText += `   Confidence: ${change.confidence}\n`;
      });
    } else {
      detailsText = '\n\nNo corrections needed! Text is already correct. ✓';
    }

    detailsText += `\n\n--- CORRECTED TEXT ---\n${result.correctedText}\n--- END ---`;

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
  } catch (error) {
    console.error('Correction error:', error);
    throw new Error(
      `Auto-correction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
