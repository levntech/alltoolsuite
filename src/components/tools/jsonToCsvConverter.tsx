'use client';
import ConvertToolTemplate from '../templates/ConvertToolTemplate';

const jsonToCsvConverter = async (
  input: string | File,
  inputFormat: string,
  outputFormat: string,
  options?: Record<string, any>
) => {
  const inputText = typeof input === 'string' ? input : await readFileAsText(input);
  let output = '';
  try {
    const json = JSON.parse(inputText);
    if (!Array.isArray(json)) throw new Error('Input must be an array of objects');
    
    const headers = Object.keys(json[0]);
    const csvRows = [headers.join(',')];
    json.forEach(obj => {
      const row = headers.map(key => `"${String(obj[key]).replace(/"/g, '""')}"`).join(',');
      csvRows.push(row);
    });
    output = csvRows.join('\n');
  } catch (error) {
    return { output: '', error: error instanceof Error ? error.message : 'Invalid JSON' };
  }
  return { output, metadata: { rowCount: output.split('\n').length - 1 } };
};

export const JsontoCsv:React.FC = () => (
  <ConvertToolTemplate
    title="JSON to CSV Converter"
    description="Convert JSON data to CSV format"
    conversionFunction={jsonToCsvConverter}
    inputFormats={[
      { value: 'json', label: 'JSON', mimeType: 'application/json' }
    ]}
    outputFormats={[
      { value: 'csv', label: 'CSV', mimeType: 'text/csv' }
    ]}
    features={{
      showStats: true,
      showLivePreview: true,
      enableExport: true,
      enableClear: true,
      enableUndo: true,
      showConversionOptions: true,
      showPreview: true
    }}
    conversionOptions={[
      {
        key: 'delimiter',
        label: 'CSV Delimiter',
        type: 'select',
        defaultValue: ',',
        options: [
          { value: ',', label: 'Comma' },
          { value: ';', label: 'Semicolon' },
          { value: '\t', label: 'Tab' }
        ]
      }
    ]}
    exportFormats={[
      { format: 'csv', label: 'CSV', mimeType: 'text/csv' },
      { format: 'json', label: 'JSON', mimeType: 'application/json' }
    ]}
    maxTextLength={100000}
    maxFileSize={10 * 1024 * 1024} // 10MB
    placeholder="Paste JSON or upload a JSON file..."
  />
);

function readFileAsText(input: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(input);
  });
}
