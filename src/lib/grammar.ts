import type { LanguageCode } from './dictionary';
import type { SpellingError } from './spellcheck';
import { getGrammarPrompt } from '../prompts/grammar-prompts';

export interface GrammarError {
  message: string;
  context: string;
  offset: number;
  length: number;
  suggestions: string[];
  ruleId: string;
  category: string;
}

export interface GrammarCheckResult {
  text: string;
  language: LanguageCode;
  errors: GrammarError[];
  errorCount: number;
  aiModel: string;
}

/**
 * Build system prompt with language-specific grammar rules and optional spelling context
 * If spelling errors provided, inject them into prompt so AI knows what will be fixed
 */
function buildSystemPrompt(language: LanguageCode, spellingErrors?: SpellingError[]): string {
  const promptConfig = getGrammarPrompt(language);
  let prompt = promptConfig.systemPrompt;

  if (spellingErrors && spellingErrors.length > 0) {
    prompt += `\n\nSPELLING ERRORS (will be corrected separately - do NOT flag these):\n`;
    spellingErrors.forEach((err) => {
      const suggestions = err.suggestions.slice(0, 3).join(', ');
      prompt += `- "${err.word}" at position ${err.position} → suggestions: ${suggestions}\n`;
    });
    prompt += `\nFocus ONLY on grammar, punctuation, and style issues. Ignore the spelling errors listed above.`;
  }

  return prompt;
}

/**
 * Check grammar using Workers AI with DeepSeek R1
 * Supports spelling context for improved accuracy
 * Now supports all 53 languages with language-specific prompts
 *
 * @param text - Text to check
 * @param ai - Cloudflare AI binding
 * @param language - Language code (default: en-au)
 * @param spellingErrors - Optional spelling errors to provide as context
 */
export async function checkGrammar(
  text: string,
  ai: Ai,
  language: LanguageCode = 'en-au',
  spellingErrors?: SpellingError[]
): Promise<GrammarCheckResult> {
  const modelId = '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';

  // Build system prompt with language-specific rules and spelling context
  const systemPrompt = buildSystemPrompt(language, spellingErrors);

  try {
    const response = (await ai.run(modelId as any, {
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Check this text for grammar, punctuation, and style issues:\n\n${text}`,
        },
      ],
      temperature: 0.1, // Low temperature for consistent, deterministic output
      max_tokens: 2048,
    })) as any;

    // Extract response text - DeepSeek R1 returns array of objects
    let aiResponse = '';

    if (Array.isArray(response)) {
      // DeepSeek R1 format: array with reasoning + message objects
      const messageObj = response.find((item: any) => item.type === 'message');
      if (messageObj && messageObj.content && Array.isArray(messageObj.content)) {
        const textContent = messageObj.content.find((c: any) => c.type === 'text');
        aiResponse = textContent?.text || '';
      }
    } else if (typeof response === 'object' && 'response' in response) {
      // Legacy format: simple object with response property
      aiResponse = (response as { response: string }).response;
    } else if (typeof response === 'string') {
      // Direct string response
      aiResponse = response;
    }

    // Parse JSON response
    let errors: GrammarError[] = [];
    try {
      if (!aiResponse) {
        console.error('No text content found in AI response');
        console.error('Full response:', JSON.stringify(response, null, 2));
        return {
          text,
          language,
          errors: [],
          errorCount: 0,
          aiModel: modelId,
        };
      }

      // Try to extract JSON from response (in case AI adds extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        errors = JSON.parse(jsonMatch[0]);
      } else if (aiResponse.trim().startsWith('[')) {
        errors = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI Response:', aiResponse);
      // Return empty errors array if parsing fails
      errors = [];
    }

    // Validate and sanitize errors
    const validErrors = errors.filter(
      (err) =>
        err &&
        typeof err.message === 'string' &&
        typeof err.offset === 'number' &&
        typeof err.length === 'number' &&
        Array.isArray(err.suggestions)
    );

    return {
      text,
      language,
      errors: validErrors,
      errorCount: validErrors.length,
      aiModel: modelId,
    };
  } catch (error) {
    console.error('Workers AI grammar check failed:', error);
    throw new Error(
      `Grammar check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Combine spelling and grammar results
 * Useful for comprehensive text analysis
 */
export interface CombinedCheckResult {
  text: string;
  language: LanguageCode;
  spelling: {
    errors: Array<{
      word: string;
      position: number;
      line: number;
      column: number;
      suggestions: string[];
    }>;
    errorCount: number;
  };
  grammar: {
    errors: GrammarError[];
    errorCount: number;
  };
  totalErrors: number;
}
