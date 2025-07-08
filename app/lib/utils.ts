import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge class names with Tailwind classes
 * Combines clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility to check if we're in a browser environment
export function isBrowser() {
  return typeof window !== 'undefined'
}

/**
 * Returns a descriptive label for a given tone level (1-10).
 * @param value The numeric tone level (1-10).
 * @returns The descriptive string label.
 */
export const getToneLabel = (value: number | null | undefined): string => {
  const numValue = value ?? 1; // Default to 1 if null/undefined
  switch (numValue) {
    case 1: return 'Textbook realism';
    case 2: return 'Serious & practical';
    case 3: return 'Sorta funny, but like your \'funny\' uncle';
    case 4: return 'Actually funny';
    case 5: return 'A little too much maybe';
    case 6: return 'Definitely too much';
    case 7: return 'Woah now';
    case 8: return 'Ehrm..';
    case 9: return 'You sure about this?';
    case 10: return '̷̛̤̖̯͕̭͙̏̀̏̑̔̆͝Ǫ̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎H̶̼̹͓̩̥͈̞̫̯͋̓̄́̓̽̈́̈́̈́͛̎͒̿͜H̴̘͎̗̮̱̗̰̱͓̪̘͛̅̅̐͌̑͆̆̐͐̈́͌̚O̴̖̥̺͎̰̰̠͙̹̔̑̆͆͋̀̐̄̈́͝ͅI̴̢̛̩͔̺͓̯̯̟̱͎͓̾̃̅̈́̍͋̒̔̚͜͠͠͝͝Ḋ̵̻͓̹̼̳̻̼̼̥̳͍͛̈́̑̆̈́̈́̅͜͝͝͠͝Ǫ̶͔̯̟͙̪͗̆͛̍̓̒̔̒̎̄̈́̅͜͝͠N̵̢̢̩̫͚̪̦̥̳̯͚̺̍̏͂͗̌̍̿̾̿́̓͌͛͝K̷̨̨̟̺͔̻̮̯̰̤̬͇̟̙̆͆͗̀̈́̔̅͒͛͊͘͝͠I̶̡̢̡̛͔͎͍̤̤̪͍͙̜͚̓̀͋́̈́̈́̿͂̈́̐͘͘͜E';
    default: return 'Serious & practical'; // Default to a reasonable middle ground
  }
};

/**
 * Formats a set title by:
 * 1. Trimming whitespace
 * 2. Capitalizing first letter of each word
 * 3. Ensuring proper capitalization of common words (e.g., "and", "in", "the")
 * 4. Truncating to reasonable length
 * 5. Fixing common spelling mistakes
 * 6. Ensuring proper spacing and punctuation
 */
export function formatSetTitle(title: string): string {
  if (!title?.trim()) return 'Untitled Set';

  // Common spelling corrections
  const spellingCorrections: Record<string, string> = {
    'thailend': 'Thailand',
    'bangok': 'Bangkok',
    'budist': 'Buddhist',
    'budha': 'Buddha',
    'tempel': 'temple',
    'restrant': 'restaurant',
    'resturant': 'restaurant',
    'grammer': 'grammar',
  };

  // Words that should be lowercase (unless at start of title)
  const lowercaseWords = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in',
    'of', 'on', 'or', 'the', 'to', 'with'
  ]);

  // Words that should always be capitalized
  const alwaysCapitalize = new Set([
    'thai', 'thailand', 'bangkok', 'buddhist', 'buddha', 'english',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december'
  ]);

  // Clean up the title
  let cleanTitle = title
    .trim()
    // Replace multiple spaces/newlines with single space
    .replace(/\s+/g, ' ')
    // Remove any double punctuation
    .replace(/[.!?]+(?=[.!?])/g, '')
    // Ensure proper spacing after punctuation
    .replace(/([.!?,])(\w)/g, '$1 $2')
    // Remove any trailing punctuation
    .replace(/[.!?,]+$/, '')
    // Truncate to 100 characters if too long (at word boundary)
    .replace(/^(.{100}[^\s]*).*/, '$1');

  // Split into words and process each
  let words = cleanTitle.toLowerCase().split(' ');
  words = words.map((word, index) => {
    // Check for spelling corrections first
    let processedWord = word.toLowerCase();
    if (spellingCorrections[processedWord]) {
      return spellingCorrections[processedWord];
    }

    // Always capitalize certain words
    if (alwaysCapitalize.has(processedWord)) {
      return processedWord.charAt(0).toUpperCase() + processedWord.slice(1);
    }

    // For other words, follow title case rules
    if (index === 0 || !lowercaseWords.has(processedWord)) {
      return processedWord.charAt(0).toUpperCase() + processedWord.slice(1);
    }

    return processedWord;
  });

  return words.join(' ');
} 