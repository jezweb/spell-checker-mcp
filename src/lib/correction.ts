import type { SpellingError, SpellCheckResult } from './spellcheck';
import type { GrammarError, GrammarCheckResult } from './grammar';

export interface CorrectionChange {
  type: 'spelling' | 'grammar';
  original: string;
  corrected: string;
  position: number;
  length: number;
  line?: number;
  column?: number;
  ruleId?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CorrectionResult {
  originalText: string;
  correctedText: string;
  changes: CorrectionChange[];
  changeCount: number;
  conflictsResolved: number;
  strategy: 'spelling-only' | 'grammar-only' | 'both' | 'first-suggestion';
}

export interface CorrectionOptions {
  mode?: 'spelling' | 'grammar' | 'both';
  strategy?: 'first-suggestion' | 'auto-select';
  applyGrammar?: boolean;
  applySpelling?: boolean;
}

/**
 * Apply spelling corrections to text
 * Uses first suggestion by default
 */
export function applySpellingCorrections(
  text: string,
  spellCheckResult: SpellCheckResult,
  options: CorrectionOptions = {}
): CorrectionResult {
  const changes: CorrectionChange[] = [];
  let correctedText = text;
  let offset = 0; // Track position shift as we make replacements

  // Sort errors by position (process from start to end)
  const sortedErrors = [...spellCheckResult.errors].sort(
    (a, b) => a.position - b.position
  );

  for (const error of sortedErrors) {
    // Skip if no suggestions available
    if (error.suggestions.length === 0) {
      continue;
    }

    // Use first suggestion (most confident)
    const suggestion = error.suggestions[0];
    const actualPosition = error.position + offset;

    // Extract original word from current text
    const before = correctedText.substring(0, actualPosition);
    const after = correctedText.substring(actualPosition + error.word.length);

    // Apply correction
    correctedText = before + suggestion + after;

    // Track the change
    changes.push({
      type: 'spelling',
      original: error.word,
      corrected: suggestion,
      position: error.position, // Original position
      length: error.word.length,
      line: error.line,
      column: error.column,
      confidence: error.suggestions.length >= 2 ? 'high' : 'medium',
    });

    // Update offset for next iteration
    offset += suggestion.length - error.word.length;
  }

  return {
    originalText: text,
    correctedText,
    changes,
    changeCount: changes.length,
    conflictsResolved: 0,
    strategy: 'first-suggestion',
  };
}

/**
 * Apply grammar corrections to text
 * Uses first suggestion by default
 */
export function applyGrammarCorrections(
  text: string,
  grammarCheckResult: GrammarCheckResult,
  options: CorrectionOptions = {}
): CorrectionResult {
  const changes: CorrectionChange[] = [];
  let correctedText = text;
  let offset = 0;

  // Sort errors by position (process from start to end)
  const sortedErrors = [...grammarCheckResult.errors].sort(
    (a, b) => a.offset - b.offset
  );

  for (const error of sortedErrors) {
    // Skip if no suggestions available
    if (error.suggestions.length === 0) {
      continue;
    }

    // Use first suggestion
    const suggestion = error.suggestions[0];
    const actualPosition = error.offset + offset;

    // Extract original text at this position (before correction)
    const originalText = correctedText.substring(
      actualPosition,
      actualPosition + error.length
    );

    // Extract and replace
    const before = correctedText.substring(0, actualPosition);
    const after = correctedText.substring(actualPosition + error.length);

    correctedText = before + suggestion + after;

    // Track the change
    changes.push({
      type: 'grammar',
      original: originalText,
      corrected: suggestion,
      position: error.offset,
      length: error.length,
      ruleId: error.ruleId,
      confidence: error.suggestions.length >= 2 ? 'high' : 'medium',
    });

    // Update offset
    offset += suggestion.length - error.length;
  }

  return {
    originalText: text,
    correctedText,
    changes,
    changeCount: changes.length,
    conflictsResolved: 0,
    strategy: 'first-suggestion',
  };
}

/**
 * Apply both spelling and grammar corrections
 * Handles conflicts by applying spelling first, then grammar
 */
export function applyCombinedCorrections(
  text: string,
  spellCheckResult: SpellCheckResult,
  grammarCheckResult: GrammarCheckResult,
  options: CorrectionOptions = {}
): CorrectionResult {
  // Apply spelling corrections first
  const spellingResult = applySpellingCorrections(text, spellCheckResult, options);

  // Apply grammar corrections to the spelling-corrected text
  const grammarResult = applyGrammarCorrections(
    spellingResult.correctedText,
    grammarCheckResult,
    options
  );

  // Combine changes
  const allChanges = [...spellingResult.changes, ...grammarResult.changes];

  return {
    originalText: text,
    correctedText: grammarResult.correctedText,
    changes: allChanges,
    changeCount: allChanges.length,
    conflictsResolved: 0, // Could be enhanced to detect overlaps
    strategy: 'both',
  };
}

/**
 * Detect potential conflicts between spelling and grammar corrections
 * Returns true if corrections overlap
 */
export function detectConflicts(
  spellingErrors: SpellingError[],
  grammarErrors: GrammarError[]
): boolean {
  for (const spellErr of spellingErrors) {
    for (const gramErr of grammarErrors) {
      const spellStart = spellErr.position;
      const spellEnd = spellErr.position + spellErr.word.length;
      const gramStart = gramErr.offset;
      const gramEnd = gramErr.offset + gramErr.length;

      // Check for overlap
      if (
        (spellStart >= gramStart && spellStart < gramEnd) ||
        (spellEnd > gramStart && spellEnd <= gramEnd) ||
        (gramStart >= spellStart && gramStart < spellEnd)
      ) {
        return true;
      }
    }
  }
  return false;
}
