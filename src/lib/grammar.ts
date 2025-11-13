import type { LanguageCode } from './dictionary';
import type { SpellingError } from './spellcheck';

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
 * System prompt for Australian English grammar checking
 * Focuses on AU English conventions and common grammar issues
 */
const AU_GRAMMAR_BASE_PROMPT = `You are an expert Australian English grammar checker and style advisor. Your role is to identify grammar, punctuation, and style issues in text while respecting Australian English conventions.

AUSTRALIAN ENGLISH CONVENTIONS:
- Spelling: colour, honour, organise, realise, centre, theatre
- Date format: DD/MM/YYYY (e.g., 25/12/2023)
- Quotation marks: Single quotes for primary quotations, double for nested
- Collective nouns: Can be singular or plural (e.g., "the team is" OR "the team are")
- -ise vs -ize: Prefer -ise endings (organise, realise, recognise)

GRAMMAR RULES TO CHECK:
1. Subject-verb agreement
2. Verb tense consistency
3. Pronoun-antecedent agreement
4. Misplaced or dangling modifiers
5. Run-on sentences and fragments
6. Comma splices
7. Incorrect use of apostrophes
8. Commonly confused words (their/there/they're, your/you're, its/it's)
9. Passive voice overuse (flag but don't always suggest changing)
10. Wordiness and redundancy

STYLE GUIDELINES:
- Clarity and conciseness
- Active voice preferred (but not mandatory)
- Consistent tense usage
- Appropriate formality level
- Proper punctuation

OUTPUT FORMAT:
Return ONLY a valid JSON array of grammar errors. Each error must have this exact structure:
[
  {
    "message": "Brief description of the issue",
    "context": "The surrounding text where the error occurs",
    "offset": <character position in original text>,
    "length": <length of problematic text>,
    "suggestions": ["suggestion1", "suggestion2"],
    "ruleId": "descriptive-rule-id",
    "category": "GRAMMAR|PUNCTUATION|STYLE|TYPOGRAPHY"
  }
]

If there are NO errors, return an empty array: []

IMPORTANT:
- Do NOT flag correct Australian English spellings as errors
- Do NOT include explanatory text outside the JSON array
- Do NOT add markdown code fences
- Return ONLY the JSON array
- If the text is grammatically correct, return []`;

/**
 * Build system prompt with optional spelling context
 * If spelling errors provided, inject them into prompt so AI knows what will be fixed
 */
function buildSystemPrompt(spellingErrors?: SpellingError[]): string {
  let prompt = AU_GRAMMAR_BASE_PROMPT;

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
 *
 * @param text - Text to check
 * @param ai - Cloudflare AI binding
 * @param language - Language code (default: en-AU)
 * @param spellingErrors - Optional spelling errors to provide as context
 */
export async function checkGrammar(
  text: string,
  ai: Ai,
  language: LanguageCode = 'en-AU',
  spellingErrors?: SpellingError[]
): Promise<GrammarCheckResult> {
  const modelId = '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';

  // Build system prompt with spelling context if provided
  const systemPrompt = buildSystemPrompt(spellingErrors);

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

    // Extract response text
    const aiResponse =
      typeof response === 'object' && 'response' in response
        ? (response as { response: string }).response
        : '';

    // Parse JSON response
    let errors: GrammarError[] = [];
    try {
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
