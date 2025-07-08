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

  // Words that should be lowercase (unless at start)
  const lowercaseWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];

  // Clean and normalize the title
  const cleanTitle = title
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .toLowerCase();

  // Apply spelling corrections
  const correctedTitle = cleanTitle.split(' ').map(word => {
    return spellingCorrections[word] || word;
  }).join(' ');

  // Apply title case with special rules
  const titleCased = correctedTitle.split(' ').map((word, index) => {
    // Always capitalize first and last word
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }

    // Check for special words that should be capitalized
    const specialWords = ['thai', 'thailand', 'bangkok', 'buddhist', 'buddha'];
    if (specialWords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }

    // Keep connecting words lowercase unless they're at the start
    if (lowercaseWords.includes(word)) {
      return word;
    }

    // Capitalize other words
    const processedWord = word.charAt(0).toUpperCase() + word.slice(1);
    return processedWord;
  }).join(' ');

  // Truncate if too long (at word boundary)
  if (titleCased.length > 100) {
    const truncated = titleCased.slice(0, 97).trim();
    return truncated.slice(0, truncated.lastIndexOf(' ')) + '...';
  }

  return titleCased;
} 