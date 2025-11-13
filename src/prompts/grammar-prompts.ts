import type { LanguageCode } from '../lib/dictionary';
import type { GrammarPromptConfig, GrammarPromptRegistry } from './types';

/**
 * Base template for generic multi-language grammar checking
 */
function createGenericPrompt(languageCode: LanguageCode, languageName: string): string {
  return `You are an expert ${languageName} grammar checker and style advisor. Your role is to identify grammar, punctuation, and style issues in ${languageName} text while following standard ${languageName} conventions.

GRAMMAR RULES TO CHECK:
1. Subject-verb agreement
2. Verb tense consistency
3. Pronoun-antecedent agreement
4. Misplaced or dangling modifiers
5. Run-on sentences and fragments
6. Comma splices
7. Incorrect use of apostrophes
8. Commonly confused words
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
- Do NOT flag correct ${languageName} spellings as errors
- Do NOT include explanatory text outside the JSON array
- Do NOT add markdown code fences
- Return ONLY the JSON array
- If the text is grammatically correct, return []`;
}

/**
 * Enhanced prompt for English (Australian)
 * Based on LanguageTool rules + Australian English conventions
 */
const englishAUPrompt = `You are an expert Australian English grammar checker and style advisor. Your role is to identify grammar, punctuation, and style issues in text while respecting Australian English conventions.

AUSTRALIAN ENGLISH CONVENTIONS:
- Spelling: colour, honour, organise, realise, centre, theatre
- Date format: DD/MM/YYYY (e.g., 25/12/2023)
- Quotation marks: Single quotes for primary quotations, double for nested
- Collective nouns: Can be singular or plural (e.g., "the team is" OR "the team are")
- -ise vs -ize: Prefer -ise endings (organise, realise, recognise)

GRAMMAR RULES TO CHECK:
1. Subject-verb agreement (e.g., "The team are ready" is acceptable in AU English)
2. Verb tense consistency
3. Pronoun-antecedent agreement
4. Misplaced or dangling modifiers
5. Run-on sentences and fragments
6. Comma splices
7. Incorrect use of apostrophes (its vs it's, your vs you're, their vs they're vs there)
8. Commonly confused words (affect/effect, principal/principle, complement/compliment)
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
 * Registry of all grammar prompts for 53 languages
 */
export const grammarPrompts: GrammarPromptRegistry = new Map<LanguageCode, GrammarPromptConfig>([
  // ENGLISH VARIANTS (Enhanced with LanguageTool-derived rules)
  ['en-au', {
    language: 'en-au',
    languageName: 'English (Australian)',
    systemPrompt: englishAUPrompt,
    hasLanguageToolRules: true,
    keyRules: [
      'Subject-verb agreement',
      "its/it's, your/you're, their/they're/there",
      'Date format: DD/MM/YYYY',
      'Prefer -ise endings (organise, realise)'
    ]
  }],

  ['en-gb', {
    language: 'en-gb',
    languageName: 'English (British)',
    systemPrompt: englishAUPrompt.replace(/Australian/g, 'British').replace(/AU English/g, 'British English'),
    hasLanguageToolRules: true,
    keyRules: [
      'Subject-verb agreement',
      "its/it's, your/you're, their/they're/there",
      'Date format: DD/MM/YYYY',
      'Prefer -ise endings (organise, realise)'
    ]
  }],

  ['en-us', {
    language: 'en-us',
    languageName: 'English (American)',
    systemPrompt: `You are an expert American English grammar checker and style advisor. Your role is to identify grammar, punctuation, and style issues in text while respecting American English conventions.

AMERICAN ENGLISH CONVENTIONS:
- Spelling: color, honor, organize, realize, center, theater
- Date format: MM/DD/YYYY (e.g., 12/25/2023)
- Quotation marks: Double quotes for primary quotations, single for nested
- Collective nouns: Usually singular (e.g., "the team is ready")
- -ize vs -ise: Prefer -ize endings (organize, realize, recognize)

GRAMMAR RULES TO CHECK:
1. Subject-verb agreement
2. Verb tense consistency
3. Pronoun-antecedent agreement
4. Misplaced or dangling modifiers
5. Run-on sentences and fragments
6. Comma splices
7. Incorrect use of apostrophes (its vs it's, your vs you're, their vs they're vs there)
8. Commonly confused words
9. Passive voice overuse (flag but don't always suggest changing)
10. Wordiness and redundancy

OUTPUT FORMAT:
Return ONLY a valid JSON array of grammar errors with structure: [{"message", "context", "offset", "length", "suggestions", "ruleId", "category"}]
If NO errors, return []`,
    hasLanguageToolRules: true,
    keyRules: [
      'Subject-verb agreement',
      "its/it's, your/you're, their/they're/there",
      'Date format: MM/DD/YYYY',
      'Prefer -ize endings (organize, realize)'
    ]
  }],

  ['en-ca', {
    language: 'en-ca',
    languageName: 'English (Canadian)',
    systemPrompt: createGenericPrompt('en-ca', 'Canadian English') + '\n\nCANADIAN SPECIFICS: Mix of British and American conventions. Prefer -our endings (colour, honour) but -ize verbs (organize). Date: YYYY-MM-DD or DD/MM/YYYY.',
    hasLanguageToolRules: true
  }],

  ['en-za', {
    language: 'en-za',
    languageName: 'English (South African)',
    systemPrompt: createGenericPrompt('en-za', 'South African English') + '\n\nSOUTH AFRICAN SPECIFICS: Similar to British English. Prefer -ise endings (organise). Date format: YYYY/MM/DD.',
    hasLanguageToolRules: true
  }],

  ['en', {
    language: 'en',
    languageName: 'English',
    systemPrompt: createGenericPrompt('en', 'English'),
    hasLanguageToolRules: true
  }],

  // MAJOR EUROPEAN LANGUAGES (LanguageTool coverage)
  ['es', {
    language: 'es',
    languageName: 'Spanish',
    systemPrompt: createGenericPrompt('es', 'Spanish') + `

SPANISH-SPECIFIC RULES:
- Gender agreement between nouns and adjectives
- Correct use of ser vs estar
- Subjunctive mood usage
- Accent marks (tildes) on stressed syllables
- Question marks at beginning (¿) and end (?)
- Exclamation marks at beginning (¡) and end (!)`,
    hasLanguageToolRules: true
  }],

  ['fr', {
    language: 'fr',
    languageName: 'French',
    systemPrompt: createGenericPrompt('fr', 'French') + `

FRENCH-SPECIFIC RULES:
- Gender agreement (nouns, adjectives, articles)
- Verb conjugation and tense agreement
- Correct use of articles (le/la/les/un/une/des)
- Accent marks (é, è, ê, à, ç, etc.)
- Liaison and elision rules
- Formal vs informal (tu/vous)`,
    hasLanguageToolRules: true
  }],

  ['de', {
    language: 'de',
    languageName: 'German',
    systemPrompt: createGenericPrompt('de', 'German') + `

GERMAN-SPECIFIC RULES:
- Noun capitalization (all nouns start with capital letter)
- Gender agreement (der/die/das articles)
- Case system (nominative, accusative, dative, genitive)
- Compound nouns formation
- Word order (verb-second rule in main clauses)
- Umlaut usage (ä, ö, ü, ß)`,
    hasLanguageToolRules: true
  }],

  ['it', {
    language: 'it',
    languageName: 'Italian',
    systemPrompt: createGenericPrompt('it', 'Italian') + `

ITALIAN-SPECIFIC RULES:
- Gender agreement (masculine/feminine)
- Verb conjugation consistency
- Correct use of articles (il/lo/la/i/gli/le)
- Accent marks on final vowels
- Double consonants (important for meaning)`,
    hasLanguageToolRules: true
  }],

  ['nl', {
    language: 'nl',
    languageName: 'Dutch',
    systemPrompt: createGenericPrompt('nl', 'Dutch') + `

DUTCH-SPECIFIC RULES:
- Gender agreement (de/het articles)
- Verb conjugation and word order
- Compound words formation
- Spelling consistency (old vs new spelling)`,
    hasLanguageToolRules: true
  }],

  ['pt', {
    language: 'pt',
    languageName: 'Portuguese',
    systemPrompt: createGenericPrompt('pt', 'Portuguese') + `

PORTUGUESE-SPECIFIC RULES:
- Gender agreement (o/a articles)
- Verb conjugation and subjunctive mood
- Accent marks (á, â, ã, à, é, ê, í, ó, ô, õ, ú, ç)
- Formal vs informal (você/tu)`,
    hasLanguageToolRules: true
  }],

  ['ru', {
    language: 'ru',
    languageName: 'Russian',
    systemPrompt: createGenericPrompt('ru', 'Russian') + `

RUSSIAN-SPECIFIC RULES:
- Case system (6 cases: nominative, genitive, dative, accusative, instrumental, prepositional)
- Gender agreement
- Aspect (perfective vs imperfective verbs)
- Word order flexibility`,
    hasLanguageToolRules: true
  }],

  ['pl', {
    language: 'pl',
    languageName: 'Polish',
    systemPrompt: createGenericPrompt('pl', 'Polish') + `

POLISH-SPECIFIC RULES:
- Case system (7 cases)
- Gender agreement (masculine personal vs non-personal)
- Verb aspects (perfective/imperfective)
- Diacritical marks (ą, ć, ę, ł, ń, ó, ś, ź, ż)`,
    hasLanguageToolRules: true
  }],

  ['ca', {
    language: 'ca',
    languageName: 'Catalan',
    systemPrompt: createGenericPrompt('ca', 'Catalan') + `

CATALAN-SPECIFIC RULES:
- Gender agreement
- Definite articles (el/la/els/les)
- Verb conjugation
- Accent marks (à, è, é, í, ò, ó, ú, ç)`,
    hasLanguageToolRules: true
  }],

  ['ga', {
    language: 'ga',
    languageName: 'Irish',
    systemPrompt: createGenericPrompt('ga', 'Irish') + `

IRISH-SPECIFIC RULES:
- Initial mutations (lenition, eclipsis)
- Prepositional pronouns
- Verb-subject-object word order
- Broad vs slender consonants`,
    hasLanguageToolRules: true
  }],

  ['br', {
    language: 'br',
    languageName: 'Breton',
    systemPrompt: createGenericPrompt('br', 'Breton') + `

BRETON-SPECIFIC RULES:
- Initial mutations
- Gender agreement
- Verb conjugation`,
    hasLanguageToolRules: true
  }],

  // ADDITIONAL EUROPEAN LANGUAGES
  ['cs', {
    language: 'cs',
    languageName: 'Czech',
    systemPrompt: createGenericPrompt('cs', 'Czech')
  }],

  ['ro', {
    language: 'ro',
    languageName: 'Romanian',
    systemPrompt: createGenericPrompt('ro', 'Romanian')
  }],

  ['sv', {
    language: 'sv',
    languageName: 'Swedish',
    systemPrompt: createGenericPrompt('sv', 'Swedish')
  }],

  ['da', {
    language: 'da',
    languageName: 'Danish',
    systemPrompt: createGenericPrompt('da', 'Danish')
  }],

  ['nb', {
    language: 'nb',
    languageName: 'Norwegian (Bokmål)',
    systemPrompt: createGenericPrompt('nb', 'Norwegian Bokmål')
  }],

  ['nn', {
    language: 'nn',
    languageName: 'Norwegian (Nynorsk)',
    systemPrompt: createGenericPrompt('nn', 'Norwegian Nynorsk')
  }],

  ['bg', {
    language: 'bg',
    languageName: 'Bulgarian',
    systemPrompt: createGenericPrompt('bg', 'Bulgarian')
  }],

  ['cy', {
    language: 'cy',
    languageName: 'Welsh',
    systemPrompt: createGenericPrompt('cy', 'Welsh')
  }],

  ['el', {
    language: 'el',
    languageName: 'Greek',
    systemPrompt: createGenericPrompt('el', 'Greek')
  }],

  ['eo', {
    language: 'eo',
    languageName: 'Esperanto',
    systemPrompt: createGenericPrompt('eo', 'Esperanto')
  }],

  ['et', {
    language: 'et',
    languageName: 'Estonian',
    systemPrompt: createGenericPrompt('et', 'Estonian')
  }],

  ['eu', {
    language: 'eu',
    languageName: 'Basque',
    systemPrompt: createGenericPrompt('eu', 'Basque')
  }],

  ['fo', {
    language: 'fo',
    languageName: 'Faroese',
    systemPrompt: createGenericPrompt('fo', 'Faroese')
  }],

  ['fur', {
    language: 'fur',
    languageName: 'Friulian',
    systemPrompt: createGenericPrompt('fur', 'Friulian')
  }],

  ['fy', {
    language: 'fy',
    languageName: 'Frisian',
    systemPrompt: createGenericPrompt('fy', 'Frisian')
  }],

  ['gd', {
    language: 'gd',
    languageName: 'Scottish Gaelic',
    systemPrompt: createGenericPrompt('gd', 'Scottish Gaelic')
  }],

  ['gl', {
    language: 'gl',
    languageName: 'Galician',
    systemPrompt: createGenericPrompt('gl', 'Galician')
  }],

  ['he', {
    language: 'he',
    languageName: 'Hebrew',
    systemPrompt: createGenericPrompt('he', 'Hebrew')
  }],

  ['hr', {
    language: 'hr',
    languageName: 'Croatian',
    systemPrompt: createGenericPrompt('hr', 'Croatian')
  }],

  ['hu', {
    language: 'hu',
    languageName: 'Hungarian',
    systemPrompt: createGenericPrompt('hu', 'Hungarian')
  }],

  ['hy', {
    language: 'hy',
    languageName: 'Armenian',
    systemPrompt: createGenericPrompt('hy', 'Armenian')
  }],

  ['is', {
    language: 'is',
    languageName: 'Icelandic',
    systemPrompt: createGenericPrompt('is', 'Icelandic')
  }],

  ['ka', {
    language: 'ka',
    languageName: 'Georgian',
    systemPrompt: createGenericPrompt('ka', 'Georgian')
  }],

  ['ko', {
    language: 'ko',
    languageName: 'Korean',
    systemPrompt: createGenericPrompt('ko', 'Korean')
  }],

  ['lt', {
    language: 'lt',
    languageName: 'Lithuanian',
    systemPrompt: createGenericPrompt('lt', 'Lithuanian')
  }],

  ['lv', {
    language: 'lv',
    languageName: 'Latvian',
    systemPrompt: createGenericPrompt('lv', 'Latvian')
  }],

  ['mk', {
    language: 'mk',
    languageName: 'Macedonian',
    systemPrompt: createGenericPrompt('mk', 'Macedonian')
  }],

  ['mn', {
    language: 'mn',
    languageName: 'Mongolian',
    systemPrompt: createGenericPrompt('mn', 'Mongolian')
  }],

  ['fa', {
    language: 'fa',
    languageName: 'Persian',
    systemPrompt: createGenericPrompt('fa', 'Persian')
  }],

  ['la', {
    language: 'la',
    languageName: 'Latin',
    systemPrompt: createGenericPrompt('la', 'Latin')
  }],

  ['sk', {
    language: 'sk',
    languageName: 'Slovak',
    systemPrompt: createGenericPrompt('sk', 'Slovak')
  }],

  ['sl', {
    language: 'sl',
    languageName: 'Slovenian',
    systemPrompt: createGenericPrompt('sl', 'Slovenian')
  }],

  ['sr', {
    language: 'sr',
    languageName: 'Serbian',
    systemPrompt: createGenericPrompt('sr', 'Serbian')
  }],

  ['tr', {
    language: 'tr',
    languageName: 'Turkish',
    systemPrompt: createGenericPrompt('tr', 'Turkish')
  }],

  ['uk', {
    language: 'uk',
    languageName: 'Ukrainian',
    systemPrompt: createGenericPrompt('uk', 'Ukrainian')
  }],

  ['vi', {
    language: 'vi',
    languageName: 'Vietnamese',
    systemPrompt: createGenericPrompt('vi', 'Vietnamese')
  }],
]);

/**
 * Get grammar prompt configuration for a language
 */
export function getGrammarPrompt(language: LanguageCode): GrammarPromptConfig {
  const prompt = grammarPrompts.get(language);

  if (!prompt) {
    // Fallback: use generic English prompt
    return grammarPrompts.get('en-au')!;
  }

  return prompt;
}
