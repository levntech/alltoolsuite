'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Download, FileText, RotateCcw, Settings } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingTime: number; // in minutes
}

interface ProcessingResult {
  output: string;
  stats?: TextStats;
  metadata?: Record<string, any>;
  error?: string;
}

interface ExportOption {
  format: string;
  label: string;
  mimeType: string;
}

interface TextToolTemplateProps {
  // Basic Configuration
  title: string;
  description: string;
  category?: string;
  icon?: React.ReactNode;
  
  // Processing Function
  processingFunction: (input: string, options?: Record<string, any>) => ProcessingResult | Promise<ProcessingResult>;
  
  // Feature Toggles
  features?: {
    showStats?: boolean;
    showLivePreview?: boolean;
    showWordCount?: boolean;
    enableExport?: boolean;
    enableCopy?: boolean;
    enableClear?: boolean;
    enableUndo?: boolean;
    showProcessingOptions?: boolean;
  };
  
  // Customization
  placeholder?: string;
  maxLength?: number;
  exportFormats?: ExportOption[];
  processingOptions?: ProcessingOption[];
  
  // Styling
  className?: string;
  theme?: 'light' | 'dark';
  
  // Callbacks
  onInputChange?: (input: string) => void;
  onResultChange?: (result: ProcessingResult) => void;
  onExport?: (format: string, content: string) => void;
}

interface ProcessingOption {
  key: string;
  label: string;
  type: 'boolean' | 'select' | 'number' | 'range';
  defaultValue: any;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  step?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculateTextStats = (text: string): TextStats => {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
  const readingTime = Math.ceil(words / 200); // Average reading speed

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    readingTime
  };
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const StatCard: React.FC<{ label: string; value: string | number; icon?: React.ReactNode }> = ({ 
  label, 
  value, 
  icon 
}) => (
  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
    <div className="flex items-center gap-2 mb-1">
      {icon && <span className="text-gray-500 text-sm">{icon}</span>}
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    </div>
    <span className="text-lg font-semibold text-gray-900 dark:text-white">{value}</span>
  </div>
);

const ProcessingOptionControl: React.FC<{
  option: ProcessingOption;
  value: any;
  onChange: (key: string, value: any) => void;
}> = ({ option, value, onChange }) => {
  switch (option.type) {
    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(option.key, e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
        </label>
      );
    
    case 'select':
      return (
        <div className="space-y-1">
          <label className="text-sm text-gray-700 dark:text-gray-300">{option.label}</label>
          <select
            value={value}
            onChange={(e) => onChange(option.key, e.target.value)}
            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
          >
            {option.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    
    case 'number':
    case 'range':
      return (
        <div className="space-y-1">
          <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
            {option.label}
            <span className="font-mono">{value}</span>
          </label>
          <input
            type={option.type}
            value={value}
            onChange={(e) => onChange(option.key, Number(e.target.value))}
            min={option.min}
            max={option.max}
            step={option.step}
            className="w-full"
          />
        </div>
      );
    
    default:
      return null;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TextToolTemplate: React.FC<TextToolTemplateProps> = ({
  title,
  description,
  category = 'Text Tools',
  icon = <FileText className="w-5 h-5" />,
  processingFunction,
  features = {},
  placeholder = 'Enter your text here...',
  maxLength,
  exportFormats = [
    { format: 'txt', label: 'Text File', mimeType: 'text/plain' },
    { format: 'json', label: 'JSON', mimeType: 'application/json' }
  ],
  processingOptions = [],
  className = '',
  theme = 'light',
  onInputChange,
  onResultChange,
  onExport
}) => {
  // State Management
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ProcessingResult>({ output: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [optionValues, setOptionValues] = useState<Record<string, any>>({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [inputHistory, setInputHistory] = useState<string[]>([]);

  // Default features
  const defaultFeatures = {
    showStats: true,
    showLivePreview: false,
    showWordCount: true,
    enableExport: true,
    enableCopy: true,
    enableClear: true,
    enableUndo: false,
    showProcessingOptions: processingOptions.length > 0,
    ...features
  };

  // Initialize processing options
  useEffect(() => {
    const initialOptions: Record<string, any> = {};
    processingOptions.forEach(option => {
      initialOptions[option.key] = option.defaultValue;
    });
    setOptionValues(initialOptions);
  }, [processingOptions]);

  // Text statistics
  const textStats = calculateTextStats(input);

  // Processing function wrapper
  const processText = useCallback(async () => {
    if (!input.trim()) {
      setResult({ output: '' });
      return;
    }

    setIsProcessing(true);
    try {
      const processResult = await processingFunction(input, optionValues);
      setResult(processResult);
      onResultChange?.(processResult);
    } catch (error) {
      setResult({ 
        output: '', 
        error: error instanceof Error ? error.message : 'Processing failed' 
      });
    } finally {
      setIsProcessing(false);
    }
  }, [input, optionValues, processingFunction, onResultChange]);

  // Handle input change
  const handleInputChange = (value: string) => {
    if (maxLength && value.length > maxLength) return;
    
    setInput(value);
    onInputChange?.(value);
    
    if (defaultFeatures.showLivePreview) {
      processText();
    }
  };

  // Handle processing option change
  const handleOptionChange = (key: string, value: any) => {
    setOptionValues(prev => ({ ...prev, [key]: value }));
  };

  // Handle copy
  const handleCopy = async () => {
    const success = await copyToClipboard(result.output);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Handle export
  const handleExport = (format: ExportOption) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.${format.format}`;
    
    let content = result.output;
    if (format.format === 'json') {
      content = JSON.stringify({
        input,
        output: result.output,
        stats: result.stats,
        metadata: result.metadata,
        timestamp: new Date().toISOString()
      }, null, 2);
    }
    
    downloadFile(content, filename, format.mimeType);
    onExport?.(format.format, content);
  };

  // Handle clear
  const handleClear = () => {
    if (input) {
      setInputHistory(prev => [...prev.slice(-9), input]); // Keep last 10
    }
    setInput('');
    setResult({ output: '' });
  };

  // Handle undo
  const handleUndo = () => {
    if (inputHistory.length > 0) {
      const lastInput = inputHistory[inputHistory.length - 1];
      setInput(lastInput);
      setInputHistory(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${theme === 'dark' ? 'dark' : ''} ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
        <div className="text-sm text-gray-500 mt-1">{category}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Input</h2>
            <div className="flex items-center gap-2">
              {defaultFeatures.showWordCount && (
                <span className="text-sm text-gray-500">
                  {textStats.words} words, {textStats.characters} chars
                  {maxLength && ` / ${maxLength}`}
                </span>
              )}
              
              {defaultFeatures.enableClear && (
                <button
                  onClick={handleClear}
                  className="text-sm text-gray-500 hover:text-gray-700 p-1"
                  title="Clear"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              
              {defaultFeatures.enableUndo && inputHistory.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                  title="Undo"
                >
                  Undo
                </button>
              )}
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            maxLength={maxLength}
          />

          {/* Processing Options */}
          {defaultFeatures.showProcessingOptions && processingOptions.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
              >
                <Settings className="w-4 h-4" />
                Processing Options
              </button>
              
              {showOptions && (
                <div className="space-y-3">
                  {processingOptions.map(option => (
                    <ProcessingOptionControl
                      key={option.key}
                      option={option}
                      value={optionValues[option.key]}
                      onChange={handleOptionChange}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!defaultFeatures.showLivePreview && (
            <button
              onClick={processText}
              disabled={isProcessing || !input.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                       text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Process Text'}
            </button>
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Output</h2>
            <div className="flex items-center gap-2">
              {defaultFeatures.enableCopy && result.output && (
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                    copySuccess 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              )}

              {defaultFeatures.enableExport && result.output && (
                <div className="relative group">
                  <button className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    {exportFormats.map(format => (
                      <button
                        key={format.format}
                        onClick={() => handleExport(format)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                      >
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                        bg-gray-50 dark:bg-gray-800 overflow-auto">
            {result.error ? (
              <div className="text-red-600 dark:text-red-400">{result.error}</div>
            ) : (
              <pre className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">
                {result.output || (input ? 'Click "Process Text" to see results' : 'Output will appear here...')}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      {defaultFeatures.showStats && (result.stats || input) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard label="Characters" value={textStats.characters} />
            <StatCard label="Words" value={textStats.words} />
            <StatCard label="Sentences" value={textStats.sentences} />
            <StatCard label="Paragraphs" value={textStats.paragraphs} />
            <StatCard label="No Spaces" value={textStats.charactersNoSpaces} />
            <StatCard label="Reading Time" value={`${textStats.readingTime} min`} />
            {result.stats && Object.entries(result.stats).map(([key, value]) => (
              <StatCard key={key} label={key} value={value as string | number} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToolTemplate;