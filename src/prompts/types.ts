import type { LanguageCode } from '../lib/dictionary';

/**
 * Grammar prompt configuration for a language
 */
export interface GrammarPromptConfig {
  /** Language code */
  language: LanguageCode;

  /** Display name of the language */
  languageName: string;

  /** System prompt for grammar checking */
  systemPrompt: string;

  /** Optional examples for few-shot learning */
  examples?: Array<{
    incorrect: string;
    correct: string;
    explanation?: string;
  }>;

  /** Optional key grammar rules to emphasize */
  keyRules?: string[];

  /** Whether this prompt uses LanguageTool-derived rules */
  hasLanguageToolRules?: boolean;
}

/**
 * Grammar prompt registry
 */
export type GrammarPromptRegistry = Map<LanguageCode, GrammarPromptConfig>;
