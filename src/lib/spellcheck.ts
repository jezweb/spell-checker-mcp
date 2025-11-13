import { loadDictionary, type LanguageCode } from './dictionary';

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
  errors: SpellingError[];
  wordCount: number;
  errorCount: number;
}

/**
 * Extract words from text while preserving positions
 * Returns array of {word, position, line, column}
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
    const wordRegex = /\b[a-z'']+\b/gi;
    let match;

    while ((match = wordRegex.exec(line)) !== null) {
      words.push({
        word: match[0],
        position: globalPosition + match.index,
        line: lineNum + 1, // 1-indexed
        column: match.index + 1, // 1-indexed
      });
    }

    globalPosition += line.length + 1; // +1 for newline
  }

  return words;
}

/**
 * Check text for spelling errors
 */
export async function checkSpelling(
  text: string,
  language: LanguageCode = 'en-AU'
): Promise<SpellCheckResult> {
  const dictionary = await loadDictionary(language);
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
    language,
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
  language: LanguageCode = 'en-AU'
): Promise<boolean> {
  const dictionary = await loadDictionary(language);
  return dictionary.spell.correct(word);
}

/**
 * Get spelling suggestions for a word
 */
export async function getSuggestions(
  word: string,
  language: LanguageCode = 'en-AU',
  limit = 5
): Promise<string[]> {
  const dictionary = await loadDictionary(language);
  return dictionary.spell.suggest(word).slice(0, limit);
}
