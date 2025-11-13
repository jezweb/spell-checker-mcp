import { loadDictionary, detectLanguage, type LanguageCode } from './dictionary';

export interface SpellingError {
  word: string;
  position: number;
  line: number;
  column: number;
  suggestions: string[];
}

export interface SpellCheckResult {
  text: string;
  language: LanguageCode;
  detectedLanguage?: LanguageCode | null;  // If auto-detected
  errors: SpellingError[];
  wordCount: number;
  errorCount: number;
}

/**
 * Extract words from text while preserving positions
 * Returns array of {word, position, line, column}
 * Handles multi-byte characters correctly using Array.from()
 */
function extractWords(text: string): Array<{
  word: string;
  position: number;
  line: number;
  column: number;
}> {
  const words: Array<{
    word: string;
    position: number;
    line: number;
    column: number;
  }> = [];

  // Split text into lines to track line numbers
  const lines = text.split('\n');
  let globalPosition = 0;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    // Match word characters (letters, numbers, apostrophes)
    // Updated regex to support Unicode word characters
    const wordRegex = /\b[\p{L}\p{N}'']+\b/giu;
    let match;

    while ((match = wordRegex.exec(line)) !== null) {
      words.push({
        word: match[0],
        position: globalPosition + match.index,
        line: lineNum + 1, // 1-indexed
        column: match.index + 1, // 1-indexed
      });
    }

    // Calculate position using Array.from for multi-byte support
    globalPosition += Array.from(line).length + 1; // +1 for newline
  }

  return words;
}

/**
 * Check text for spelling errors
 *
 * @param text - Text to check
 * @param language - Language code (optional, will auto-detect if not provided)
 * @param r2Bucket - R2 bucket containing dictionaries
 * @returns Spell check result with errors and suggestions
 */
export async function checkSpelling(
  text: string,
  language: LanguageCode | undefined,
  r2Bucket: R2Bucket
): Promise<SpellCheckResult> {
  let finalLanguage: LanguageCode = 'en-au';  // Default fallback
  let detectedLang: LanguageCode | null = null;

  // Auto-detect language if not specified
  if (!language) {
    detectedLang = detectLanguage(text);
    if (detectedLang) {
      finalLanguage = detectedLang;
      console.log(`🔍 Auto-detected language: ${finalLanguage}`);
    } else {
      console.log('⚠️  Language detection failed, using default: en-au');
    }
  } else {
    finalLanguage = language;
  }

  const dictionary = await loadDictionary(finalLanguage, r2Bucket);
  const words = extractWords(text);
  const errors: SpellingError[] = [];

  for (const { word, position, line, column } of words) {
    // Skip if word is correctly spelled
    if (dictionary.spell.correct(word)) {
      continue;
    }

    // Get suggestions for misspelled word
    const suggestions = dictionary.spell.suggest(word).slice(0, 5);

    errors.push({
      word,
      position,
      line,
      column,
      suggestions,
    });
  }

  return {
    text,
    language: finalLanguage,
    detectedLanguage: language ? undefined : detectedLang,
    errors,
    wordCount: words.length,
    errorCount: errors.length,
  };
}

/**
 * Check if a single word is spelled correctly
 */
export async function isCorrect(
  word: string,
  language: LanguageCode,
  r2Bucket: R2Bucket
): Promise<boolean> {
  const dictionary = await loadDictionary(language, r2Bucket);
  return dictionary.spell.correct(word);
}

/**
 * Get spelling suggestions for a word
 */
export async function getSuggestions(
  word: string,
  language: LanguageCode,
  r2Bucket: R2Bucket,
  limit = 5
): Promise<string[]> {
  const dictionary = await loadDictionary(language, r2Bucket);
  return dictionary.spell.suggest(word).slice(0, limit);
}
