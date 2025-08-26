'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { File, Download, ArrowRight, RotateCcw, Settings } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ConversionStats {
  inputSize: number; // in bytes
  outputSize: number; // in bytes
  conversionTime: number; // in milliseconds
  [key: string]: number | string; // Allow custom stats
}

interface ConversionResult {
  output: string | Blob; // Output can be text or binary (e.g., for images)
  stats?: ConversionStats;
  metadata?: Record<string, any>;
  error?: string;
}

interface FormatOption {
  value: string;
  label: string;
  mimeType: string;
}

interface ExportOption {
  format: string;
  label: string;
  mimeType: string;
}

interface ConversionOption {
  key: string;
  label: string;
  type: 'boolean' | 'select' | 'number' | 'range';
  defaultValue: any;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  step?: number;
}

interface ConvertToolTemplateProps {
  // Basic Configuration
  title: string;
  description: string;
  category?: string;
  icon?: React.ReactNode;

  // Conversion Function
  conversionFunction: (
    input: string | File,
    inputFormat: string,
    outputFormat: string,
    options?: Record<string, any>
  ) => ConversionResult | Promise<ConversionResult>;

  // Input/Output Formats
  inputFormats: FormatOption[];
  outputFormats: FormatOption[];

  // Feature Toggles
  features?: {
    showStats?: boolean;
    showLivePreview?: boolean;
    enableExport?: boolean;
    enableClear?: boolean;
    enableUndo?: boolean;
    showConversionOptions?: boolean;
    showPreview?: boolean;
  };

  // Customization
  placeholder?: string;
  maxFileSize?: number; // in bytes
  maxTextLength?: number;
  exportFormats?: ExportOption[];
  conversionOptions?: ConversionOption[];

  // Styling
  className?: string;
  theme?: 'light' | 'dark';

  // Callbacks
  onInputChange?: (input: string | File) => void;
  onResultChange?: (result: ConversionResult) => void;
  onExport?: (format: string, content: string | Blob) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculateConversionStats = (input: string | File, output: string | Blob, startTime: number): ConversionStats => {
  const inputSize = typeof input === 'string' ? new TextEncoder().encode(input).length : input.size;
  const outputSize = typeof output === 'string' ? new TextEncoder().encode(output).length : output.size;
  const conversionTime = performance.now() - startTime;
  return { inputSize, outputSize, conversionTime };
};

const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
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

const ConversionOptionControl: React.FC<{
  option: ConversionOption;
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

const PreviewPane: React.FC<{ output: string | Blob; outputFormat: string }> = ({ output, outputFormat }) => {
  if (!output) return <div className="text-gray-500">Output will appear here...</div>;

  if (typeof output === 'string') {
    return (
      <pre className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">
        {output}
      </pre>
    );
  }

  if (outputFormat.includes('image')) {
    return <img src={URL.createObjectURL(output)} alt="Converted Image" className="max-w-full h-auto" />;
  }

  return <div className="text-gray-500">Preview not available for this format</div>;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ConvertToolTemplate: React.FC<ConvertToolTemplateProps> = ({
  title,
  description,
  category = 'Converter Tools',
  icon = <ArrowRight className="w-5 h-5" />,
  conversionFunction,
  inputFormats,
  outputFormats,
  features = {},
  placeholder = 'Enter text or upload a file...',
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  maxTextLength,
  exportFormats = [
    { format: 'txt', label: 'Text File', mimeType: 'text/plain' },
    { format: 'json', label: 'JSON', mimeType: 'application/json' }
  ],
  conversionOptions = [],
  className = '',
  theme = 'light',
  onInputChange,
  onResultChange,
  onExport
}) => {
  // State Management
  const [input, setInput] = useState<string | File>('');
  const [inputFormat, setInputFormat] = useState(inputFormats[0]?.value || '');
  const [outputFormat, setOutputFormat] = useState(outputFormats[0]?.value || '');
  const [result, setResult] = useState<ConversionResult>({ output: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [optionValues, setOptionValues] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<{ input: string | File; inputFormat: string; outputFormat: string; options: Record<string, any> }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Default features
  const defaultFeatures = {
    showStats: true,
    showLivePreview: false,
    enableExport: true,
    enableClear: true,
    enableUndo: true,
    showConversionOptions: conversionOptions.length > 0,
    showPreview: true,
    ...features
  };

  // Initialize conversion options
  useEffect(() => {
    const initialOptions: Record<string, any> = {};
    conversionOptions.forEach(option => {
      initialOptions[option.key] = option.defaultValue;
    });
    setOptionValues(initialOptions);
  }, [conversionOptions]);

  // Conversion function wrapper
  const processConversion = useCallback(async () => {
    if (!input || (typeof input === 'string' && !input.trim())) {
      setResult({ output: '' });
      return;
    }

    setIsProcessing(true);
    const startTime = performance.now();
    try {
      const inputData = typeof input === 'string' ? input : await readFileAsText(input);
      const conversionResult = await conversionFunction(input, inputFormat, outputFormat, optionValues);
      conversionResult.stats = calculateConversionStats(input, conversionResult.output, startTime);
      setResult(conversionResult);
      onResultChange?.(conversionResult);
    } catch (error) {
      setResult({
        output: '',
        error: error instanceof Error ? error.message : 'Conversion failed'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [input, inputFormat, outputFormat, optionValues, conversionFunction, onResultChange]);

  const debouncedProcessConversion = useCallback(
    debounce(processConversion, 300),
    [processConversion]
  );

  // Handle input change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  if (maxTextLength && value.length > maxTextLength) return;
  setInput(value);
  addToHistory(value, inputFormat, outputFormat, optionValues);
  onInputChange?.(value);
  if (defaultFeatures.showLivePreview) debouncedProcessConversion();
};

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (
    typeof File !== "undefined" &&
    file instanceof File &&
    maxFileSize &&
    file.size > maxFileSize
  ) {
    return;
  }

  setInput(file);
  addToHistory(file, inputFormat, outputFormat, optionValues);
  onInputChange?.(file);
  if (defaultFeatures.showLivePreview) debouncedProcessConversion();
};


  // Handle conversion option change
  const handleOptionChange = (key: string, value: any) => {
    setOptionValues(prev => ({ ...prev, [key]: value }));
  };

  // Handle undo/redo
  const addToHistory = (newInput: string | File, newInputFormat: string, newOutputFormat: string, newOptions: Record<string, any>) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), { input: newInput, inputFormat: newInputFormat, outputFormat: newOutputFormat, options: newOptions }].slice(-10));
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setInput(prevState.input);
      setInputFormat(prevState.inputFormat);
      setOutputFormat(prevState.outputFormat);
      setOptionValues(prevState.options);
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setInput(nextState.input);
      setInputFormat(nextState.inputFormat);
      setOutputFormat(nextState.outputFormat);
      setOptionValues(nextState.options);
      setHistoryIndex(prev => prev + 1);
    }
  };

  // Handle clear
  const handleClear = () => {
    if (input) {
      addToHistory(input, inputFormat, outputFormat, optionValues);
    }
    setInput('');
    setResult({ output: '' });
  };

  // Handle export
  const handleExport = (format: ExportOption) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.${format.format}`;
    let content = result.output;

    if (format.format === 'json' && typeof content === 'string') {
      content = JSON.stringify({
        input: typeof input === 'string' ? input : input.name,
        output: content,
        stats: result.stats,
        metadata: result.metadata,
        timestamp: new Date().toISOString()
      }, null, 2);
    }

    downloadFile(content, filename, format.mimeType);
    onExport?.(format.format, content);
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
              {defaultFeatures.enableClear && (
                <button
                  onClick={handleClear}
                  className="text-sm text-gray-500 hover:text-gray-700 p-1"
                  title="Clear"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              {defaultFeatures.enableUndo && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 disabled:text-gray-400"
                    title="Undo"
                  >
                    Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 disabled:text-gray-400"
                    title="Redo"
                  >
                    Redo
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={inputFormat}
              onChange={(e) => {
                setInputFormat(e.target.value);
                addToHistory(input, e.target.value, outputFormat, optionValues);
              }}
              className="p-2 border rounded-lg bg-white dark:bg-gray-800"
            >
              {inputFormats.map(format => (
                <option key={format.value} value={format.value}>{format.label}</option>
              ))}
            </select>
            <ArrowRight className="w-5 h-5 text-gray-500" />
            <select
              value={outputFormat}
              onChange={(e) => {
                setOutputFormat(e.target.value);
                addToHistory(input, inputFormat, e.target.value, optionValues);
              }}
              className="p-2 border rounded-lg bg-white dark:bg-gray-800"
            >
              {outputFormats.map(format => (
                <option key={format.value} value={format.value}>{format.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <textarea
              value={typeof input === 'string' ? input : ''}
              onChange={handleTextChange}
              placeholder={placeholder}
              className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              maxLength={maxTextLength}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                onChange={handleFileChange}
                accept={inputFormats.map(f => f.mimeType).join(',')}
                className="w-full p-2 border rounded-lg"
              />
              <File className="w-4 h-4 text-gray-500" />
            </label>
          </div>

          {/* Conversion Options */}
          {defaultFeatures.showConversionOptions && conversionOptions.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
              >
                <Settings className="w-4 h-4" />
                Conversion Options
              </button>
              {showOptions && (
                <div className="space-y-3">
                  {conversionOptions.map(option => (
                    <ConversionOptionControl
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
              onClick={processConversion}
              disabled={isProcessing || !input || (typeof input === 'string' && !input.trim())}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                         text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              {isProcessing ? 'Converting...' : 'Convert'}
            </button>
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Output</h2>
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

          {defaultFeatures.showPreview && (
            <div className="h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-gray-50 dark:bg-gray-800 overflow-auto">
              {result.error ? (
                <div className="text-red-600 dark:text-red-400">{result.error}</div>
              ) : (
                <PreviewPane output={result.output} outputFormat={outputFormat} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {defaultFeatures.showStats && result.stats && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Input Size" value={`${(result.stats.inputSize / 1024).toFixed(2)} KB`} />
            <StatCard label="Output Size" value={`${(result.stats.outputSize / 1024).toFixed(2)} KB`} />
            <StatCard label="Conversion Time" value={`${result.stats.conversionTime.toFixed(2)} ms`} />
            {Object.entries(result.stats)
              .filter(([key]) => !['inputSize', 'outputSize', 'conversionTime'].includes(key))
              .map(([key, value]) => (
                <StatCard key={key} label={key} value={value as string | number} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvertToolTemplate;