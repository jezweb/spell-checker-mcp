import nspell from 'nspell';
// @ts-ignore - Wrangler bundles text files
import affData from '../dictionaries/en-AU.aff';
// @ts-ignore - Wrangler bundles text files
import dicData from '../dictionaries/en-AU.dic';

export type LanguageCode = 'en-AU';

export interface Dictionary {
  code: LanguageCode;
  spell: ReturnType<typeof nspell>;
  name: string;
}

// Cache for loaded dictionaries
const dictionaryCache = new Map<LanguageCode, Dictionary>();

/**
 * Load a dictionary for the specified language
 * Dictionaries are cached after first load
 */
export async function loadDictionary(
  language: LanguageCode = 'en-AU'
): Promise<Dictionary> {
  // Return cached dictionary if available
  if (dictionaryCache.has(language)) {
    return dictionaryCache.get(language)!;
  }

  // Load dictionary based on language code
  let aff: string | Buffer;
  let dic: string | Buffer;
  let name: string;

  switch (language) {
    case 'en-AU':
      // Dictionary files are bundled as text by Wrangler
      aff = affData;
      dic = dicData;
      name = 'Australian English';
      break;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }

  // Create nspell instance with raw text data
  const spell = nspell({ aff, dic });

  // Create dictionary object
  const dictionary: Dictionary = {
    code: language,
    spell,
    name,
  };

  // Cache for future use
  dictionaryCache.set(language, dictionary);

  return dictionary;
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): Array<{
  code: LanguageCode;
  name: string;
}> {
  return [{ code: 'en-AU', name: 'Australian English' }];
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(code: string): code is LanguageCode {
  return code === 'en-AU';
}
