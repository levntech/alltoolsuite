

'use client';
import React from 'react';
import { Hash, Type, FileText, Calculator } from 'lucide-react';
import TextToolTemplate from '../templates/TextToolTemplate';

// ============================================================================
// EXAMPLE 1: WORD COUNTER TOOL
// ============================================================================

const WordCounterTool: React.FC = () => {
  const processWordCount = (input: string) => {
    const words = input.trim() ? input.trim().split(/\s+/) : [];
    const uniqueWords = Array.from(new Set(words.map(w => w.toLowerCase())));
    const avgWordsPerSentence = input.split(/[.!?]+/).filter(s => s.trim()).length > 0 
      ? Math.round(words.length / input.split(/[.!?]+/).filter(s => s.trim()).length)
      : 0;

    return {
  output: `Word Count Analysis:\n\nTotal Words: ${words.length}\nUnique Words: ${uniqueWords.length}\nAverage Words per Sentence: ${avgWordsPerSentence}\n\nWord Frequency:\n${
    Object.entries(
      words.reduce((acc: Record<string, number>, word) => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        if (cleanWord) {
          acc[cleanWord] = (acc[cleanWord] || 0) + 1;
        }
        return acc;
      }, {})
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => `${word}: ${count}`)
      .join('\n')
  }`,
  stats: {
    'Total Words': words.length,
    'Unique Words': uniqueWords.length,
    'Avg per Sentence': avgWordsPerSentence
  }
};

  };

  return (
    <TextToolTemplate
      title="Word Counter"
      description="Count words, characters, sentences and analyze text statistics"
      category="Text Analysis"
      icon={<Calculator className="w-5 h-5" />}
      processingFunction={processWordCount}
      placeholder="Paste your text here to analyze word count and statistics..."
      features={{
        showStats: true,
        showLivePreview: true,
        enableExport: true,
        enableCopy: true
      }}
      exportFormats={[
        { format: 'txt', label: 'Text Report', mimeType: 'text/plain' },
        { format: 'json', label: 'JSON Data', mimeType: 'application/json' },
        { format: 'csv', label: 'CSV Data', mimeType: 'text/csv' }
      ]}
    />
  );
};

export default WordCounterTool;