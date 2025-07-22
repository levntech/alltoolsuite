// textToolsLogic.ts
// Contains production-grade logic for text-tools category: Case Converter, Word Counter, Text Summarizer, Text Diff Checker, and Spell Checker

// Interfaces for type safety and API contracts
export interface WordCountResult {
    words: number;
    characters: number;
    charactersNoSpaces: number;
    sentences: number;
    paragraphs: number;
    readingTimeMinutes: number;
  }

  export interface TextDiffResult {
    added: string[];
    removed: string[];
    unchanged: string[];
  }

  export interface SpellCheckResult {
    word: string;
    suggestions: string[];
    position: { start: number; end: number };
  }

  // Utility to validate non-empty strings
  const validateTextInput = (text: string, toolName: string): void => {
    if (!text || typeof text !== 'string') {
      throw new Error(`${toolName}: Input text must be a non-empty string`);
    }
  };

  // Case Converter: Efficiently converts text to different cases
  export const caseConverter = (
    text: string,
    caseType: 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'snake'
  ): string => {
    // Input validation
    validateTextInput(text, 'Case Converter');

    // Use a switch for clear, maintainable case handling
    switch (caseType) {
      case 'upper':
        return text.toUpperCase();
      case 'lower':
        return text.toLowerCase();
      case 'title':
        return text
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean) // Remove empty strings from multiple spaces
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      case 'sentence':
        return text
          .toLowerCase()
          .replace(/(^\w|\.\s+\w)/g, char => char.toUpperCase());
      case 'camel':
        return text
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
          )
          .join('');
      case 'snake':
        return text
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .join('_');
      default:
        throw new Error('Case Converter: Invalid case type');
    }
  };

  // Word Counter: Counts words, characters, sentences, paragraphs, and estimates reading time
  export const wordCounter = (text: string): WordCountResult => {
    // Handle empty input gracefully
    if (!text || typeof text !== 'string') {
      return {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        readingTimeMinutes: 0,
      };
    }

    // Efficient regex-based counting
    const words = text.match(/\b\w+\b/g) || [];
    const sentences = text.match(/[.!?]+/g) || [];
    const paragraphs = text.split(/\n+/).filter(Boolean);
    const charactersNoSpaces = text.replace(/\s/g, '').length;

    // Estimate reading time (average reading speed: 200 words per minute)
    const readingTimeMinutes = words.length / 200;

    return {
      words: words.length,
      characters: text.length,
      charactersNoSpaces,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      readingTimeMinutes: Math.round(readingTimeMinutes * 100) / 100, // Round to 2 decimal places
    };
  };

  // Text Summarizer: Summarizes text (placeholder for NLP-based solution)
  export const textSummarizer = async (text: string, maxSentences: number = 3): Promise<string> => {
    validateTextInput(text, 'Text Summarizer');

    // Basic implementation: Take the first few sentences
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const summarySentences = sentences.slice(0, Math.min(maxSentences, sentences.length));

    // Reconstruct the summary with proper punctuation
    let summary = summarySentences.join('. ');
    if (summary && !/[.!?]$/.test(summary)) {
      summary += '.';
    }

    // Add ellipsis if the summary is shorter than the original text
    if (sentences.length > maxSentences) {
      summary += '..';
    }

    return summary;

    // Production-grade implementation:
    // Use an NLP library like Hugging Face's Transformers via an API
    // Example (commented out - requires axios and API integration):
    /*
    try {
      const response = await axios.post('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
        inputs: text,
        parameters: { max_length: 100 },
      }, {
        headers: { Authorization: `Bearer YOUR_HF_API_KEY` },
      });
      return response.data[0].summary_text;
    } catch (error) {
      throw new Error('Text Summarizer: Failed to summarize text - ' + error.message);
    }
    */
  };

  // Text Diff Checker: Compares two texts and highlights differences
  export const textDiffChecker = (text1: string, text2: string): TextDiffResult => {
    // Validate inputs
    if (typeof text1 !== 'string' || typeof text2 !== 'string') {
      throw new Error('Text Diff Checker: Both inputs must be strings');
    }

    // Split into words for comparison
    const words1 = (text1 || '').split(/\s+/).filter(Boolean);
    const words2 = (text2 || '').split(/\s+/).filter(Boolean);

    // Efficient comparison using Sets for O(1) lookups
    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const added = words2.filter(word => !set1.has(word));
    const removed = words1.filter(word => !set2.has(word));
    const unchanged = words1.filter(word => set2.has(word));

    return {
      added: Array.from(new Set(added)), // Remove duplicates
      removed: Array.from(new Set(removed)),
      unchanged: Array.from(new Set(unchanged)),
    };
  };

  // Spell Checker: Checks spelling in text (placeholder for real spell-checking solution)
  export const spellChecker = async (text: string): Promise<SpellCheckResult[]> => {
    validateTextInput(text, 'Spell Checker');

    // Placeholder implementation
    // In a real app, use a spell-checking library like nspell or an API like LanguageTool
    const mockMisspellings: SpellCheckResult[] = [];

    // Simulate finding a misspelling
    const words = text.split(/\s+/);
    words.forEach((word, index) => {
      if (word.toLowerCase() === 'teh') {
        const start = text.indexOf(word, index > 0 ? text.indexOf(words[index - 1]) + words[index - 1].length : 0);
        mockMisspellings.push({
          word: 'teh',
          suggestions: ['the'],
          position: { start, end: start + word.length },
        });
      }
    });

    return mockMisspellings;

    // Production-grade implementation:
    // Use LanguageTool API for spell checking
    // Example (commented out - requires axios):
    /*
    try {
      const response = await axios.post('https://api.languagetool.org/v2/check', {
        text,
        language: 'en-US',
      });
      const matches = response.data.matches || [];
      return matches.map((match: any) => ({
        word: text.slice(match.offset, match.offset + match.length),
        suggestions: match.replacements.map((r: any) => r.value),
        position: { start: match.offset, end: match.offset + match.length },
      }));
    } catch (error) {
      throw new Error('Spell Checker: Failed to check spelling - ' + error.message);
    }
    */
  };