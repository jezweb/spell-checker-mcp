import nspell from 'nspell';
import { franc } from 'franc-min';

// All supported language codes (56+ languages from wooorm/dictionaries)
export type LanguageCode =
  | 'en' | 'en-au' | 'en-ca' | 'en-gb' | 'en-us' | 'en-za'  // English variants
  | 'es' | 'fr' | 'de' | 'it' | 'nl' | 'pt' | 'ru'  // Major Western European + Russian
  | 'pl' | 'cs' | 'ro' | 'sv' | 'da' | 'nb' | 'nn'  // Eastern European + Nordic
  | 'bg' | 'ca' | 'cy' | 'el' | 'eo' | 'et' | 'eu'  // Additional European
  | 'fo' | 'fur' | 'fy' | 'ga' | 'gd' | 'gl' | 'he'  // Celtic + Hebrew
  | 'hr' | 'hu' | 'hy' | 'is' | 'ka' | 'ko' | 'lt'  // Eastern European + Asian
  | 'lv' | 'mk' | 'mn' | 'fa' | 'br' | 'la' | 'sk'  // Misc
  | 'sl' | 'sr' | 'tr' | 'uk' | 'vi';  // Slavic + Turkish + Vietnamese

export interface Dictionary {
  code: LanguageCode;
  spell: ReturnType<typeof nspell>;
  name: string;
}

// Metadata for all supported languages
export const LANGUAGE_METADATA: Record<LanguageCode, { name: string; francCode?: string }> = {
  'en': { name: 'English (US)', francCode: 'eng' },
  'en-au': { name: 'English (Australia)', francCode: 'eng' },
  'en-ca': { name: 'English (Canada)', francCode: 'eng' },
  'en-gb': { name: 'English (UK)', francCode: 'eng' },
  'en-us': { name: 'English (US)', francCode: 'eng' },
  'en-za': { name: 'English (South Africa)', francCode: 'eng' },
  'es': { name: 'Spanish', francCode: 'spa' },
  'fr': { name: 'French', francCode: 'fra' },
  'de': { name: 'German', francCode: 'deu' },
  'it': { name: 'Italian', francCode: 'ita' },
  'nl': { name: 'Dutch', francCode: 'nld' },
  'pt': { name: 'Portuguese', francCode: 'por' },
  'ru': { name: 'Russian', francCode: 'rus' },
  'pl': { name: 'Polish', francCode: 'pol' },
  'cs': { name: 'Czech', francCode: 'ces' },
  'ro': { name: 'Romanian', francCode: 'ron' },
  'sv': { name: 'Swedish', francCode: 'swe' },
  'da': { name: 'Danish', francCode: 'dan' },
  'nb': { name: 'Norwegian Bokmål', francCode: 'nob' },
  'nn': { name: 'Norwegian Nynorsk', francCode: 'nno' },
  'bg': { name: 'Bulgarian', francCode: 'bul' },
  'ca': { name: 'Catalan', francCode: 'cat' },
  'cy': { name: 'Welsh', francCode: 'cym' },
  'el': { name: 'Greek', francCode: 'ell' },
  'eo': { name: 'Esperanto', francCode: 'epo' },
  'et': { name: 'Estonian', francCode: 'est' },
  'eu': { name: 'Basque', francCode: 'eus' },
  'fo': { name: 'Faroese', francCode: 'fao' },
  'fur': { name: 'Friulian' },
  'fy': { name: 'Frisian', francCode: 'fry' },
  'ga': { name: 'Irish', francCode: 'gle' },
  'gd': { name: 'Scottish Gaelic', francCode: 'gla' },
  'gl': { name: 'Galician', francCode: 'glg' },
  'he': { name: 'Hebrew', francCode: 'heb' },
  'hr': { name: 'Croatian', francCode: 'hrv' },
  'hu': { name: 'Hungarian', francCode: 'hun' },
  'hy': { name: 'Armenian', francCode: 'hye' },
  'is': { name: 'Icelandic', francCode: 'isl' },
  'ka': { name: 'Georgian', francCode: 'kat' },
  'ko': { name: 'Korean', francCode: 'kor' },
  'lt': { name: 'Lithuanian', francCode: 'lit' },
  'lv': { name: 'Latvian', francCode: 'lav' },
  'mk': { name: 'Macedonian', francCode: 'mkd' },
  'mn': { name: 'Mongolian', francCode: 'mon' },
  'fa': { name: 'Persian', francCode: 'pes' },
  'br': { name: 'Breton', francCode: 'bre' },
  'la': { name: 'Latin', francCode: 'lat' },
  'sk': { name: 'Slovak', francCode: 'slk' },
  'sl': { name: 'Slovenian', francCode: 'slv' },
  'sr': { name: 'Serbian', francCode: 'srp' },
  'tr': { name: 'Turkish', francCode: 'tur' },
  'uk': { name: 'Ukrainian', francCode: 'ukr' },
  'vi': { name: 'Vietnamese', francCode: 'vie' },
};

// Cache for loaded dictionaries (in-memory, per Worker instance)
const dictionaryCache = new Map<LanguageCode, Dictionary>();

/**
 * Detect language from text content using franc-min
 * Returns language code or null if detection fails
 */
export function detectLanguage(text: string): LanguageCode | null {
  try {
    // franc returns ISO 639-3 codes (e.g., 'eng', 'spa', 'fra')
    const detectedCode = franc(text, { minLength: 10 });

    if (detectedCode === 'und') {
      // Undetermined language
      return null;
    }

    // Find matching language code
    for (const [langCode, metadata] of Object.entries(LANGUAGE_METADATA)) {
      if (metadata.francCode === detectedCode) {
        return langCode as LanguageCode;
      }
    }

    return null;
  } catch (error) {
    console.error('Language detection failed:', error);
    return null;
  }
}

/**
 * Load a dictionary for the specified language from R2
 * Dictionaries are cached after first load
 *
 * @param language - Language code to load
 * @param r2Bucket - R2 bucket containing dictionaries
 * @returns Dictionary object with nspell instance
 */
export async function loadDictionary(
  language: LanguageCode,
  r2Bucket: R2Bucket
): Promise<Dictionary> {
  // Return cached dictionary if available
  if (dictionaryCache.has(language)) {
    return dictionaryCache.get(language)!;
  }

  // Fetch dictionary files from R2
  const [affObj, dicObj] = await Promise.all([
    r2Bucket.get(`dictionaries/${language}.aff`),
    r2Bucket.get(`dictionaries/${language}.dic`),
  ]);

  if (!affObj || !dicObj) {
    throw new Error(
      `Dictionary not found for language: ${language}. ` +
      `Ensure dictionaries have been uploaded to R2 using: npm run upload-dictionaries`
    );
  }

  // Read file contents
  const aff = await affObj.text();
  const dic = await dicObj.text();

  // Create nspell instance
  const spell = nspell({ aff, dic });

  // Get language name from metadata
  const name = LANGUAGE_METADATA[language]?.name || language.toUpperCase();

  // Create dictionary object
  const dictionary: Dictionary = {
    code: language,
    spell,
    name,
  };

  // Cache for future use
  dictionaryCache.set(language, dictionary);

  console.log(`✓ Loaded dictionary: ${name} (${language})`);

  return dictionary;
}

/**
 * Get list of all supported languages
 */
export function getSupportedLanguages(): Array<{
  code: LanguageCode;
  name: string;
}> {
  return Object.entries(LANGUAGE_METADATA).map(([code, metadata]) => ({
    code: code as LanguageCode,
    name: metadata.name,
  }));
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(code: string): code is LanguageCode {
  return code in LANGUAGE_METADATA;
}

/**
 * Get language metadata
 */
export function getLanguageMetadata(code: LanguageCode) {
  return LANGUAGE_METADATA[code];
}
