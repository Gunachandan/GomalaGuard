/**
 * Banned Terms Scanner for Gomala Atlas
 * 
 * Enforces Section 2 Rule 1 of Master Prompt:
 * The words fraud, forged, illegal, grabber, encroacher, criminal, scam,
 * and their Kannada equivalents MUST NEVER appear in code identifiers,
 * stored labels, UI text, templates or logs.
 */

export interface ScanResult {
  passed: boolean;
  violationsFound: Array<{
    term: string;
    language: 'kn' | 'en';
    contextSnippet: string;
  }>;
  totalTermsScanned: number;
}

export class BannedTermsScanner {
  // Configured banned vocabulary
  public static readonly BANNED_EN = [
    'fraud',
    'forged',
    'forgery',
    'illegal',
    'illegality',
    'grabber',
    'land grab',
    'encroacher',
    'encroachment',
    'criminal',
    'scam',
    'corrupt',
    'corruption',
    'thief',
    'stealing',
    'culprit',
  ];

  public static readonly BANNED_KN = [
    'ವಂಚನೆ',
    'ನಕಲಿ',
    'ಅಕ್ರಮ',
    'ಕಬಳಿಕೆ',
    'ಕಬಳಿಕೆದಾರ',
    'ಒತ್ತುವರಿ',
    'ಒತ್ತುವರಿದಾರ',
    'ಅಪರಾಧಿ',
    'ಹಗರಣ',
    'ಭ್ರಷ್ಟ',
    'ಭ್ರಷ್ಟಾಚಾರ',
    'ಕಳ್ಳತನ',
  ];

  /**
   * Scans a string for any banned terms in English or Kannada.
   */
  public static scanText(text: string): ScanResult {
    const lower = text.toLowerCase();
    const violations: ScanResult['violationsFound'] = [];

    // Check English
    for (const term of this.BANNED_EN) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(lower)) {
        const index = lower.indexOf(term);
        const start = Math.max(0, index - 25);
        const end = Math.min(text.length, index + term.length + 25);
        violations.push({
          term,
          language: 'en',
          contextSnippet: text.substring(start, end).trim(),
        });
      }
    }

    // Check Kannada
    for (const term of this.BANNED_KN) {
      if (text.includes(term)) {
        const index = text.indexOf(term);
        const start = Math.max(0, index - 20);
        const end = Math.min(text.length, index + term.length + 20);
        violations.push({
          term,
          language: 'kn',
          contextSnippet: text.substring(start, end).trim(),
        });
      }
    }

    return {
      passed: violations.length === 0,
      violationsFound: violations,
      totalTermsScanned: this.BANNED_EN.length + this.BANNED_KN.length,
    };
  }
}
