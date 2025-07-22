// tools/fileToolsLogic.ts
// Production-grade logic for file-tools category: File Metadata, PDF to Text, Image to Base64, File Download, Zip/Unzip, File Renamer, File Splitter

import { createLogger, transports, format } from 'winston';
import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// Logger setup for client-side logging
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Custom error class for file tools
class FileToolError extends Error {
  constructor(message: string, public code: string, public suggestion?: string) {
    super(message);
    this.name = 'FileToolError';
  }
}

// Interface for file metadata
export interface FileMetadata {
  name: string;
  size: number; // Size in bytes
  type: string;
  lastModified: string; // Formatted date
}

// Interface for PDF to text result
export interface PdfTextResult {
  text: string;
  pageCount: number;
}

// Interface for image to base64 result
export interface ImageBase64Result {
  base64: string;
  mimeType: string;
}

// Interface for unzipped file
export interface UnzippedFile {
  name: string;
  content: Blob;
}

// Interface for split file parts
export interface SplitFilePart {
  name: string;
  partNumber: number;
  content: Blob;
  totalParts: number;
}

// Analytics tracking
const usageAnalytics: Record<string, number> = {
  getFileMetadata: 0,
  pdfToText: 0,
  imageToBase64: 0,
  generateTextFile: 0,
  zipFiles: 0,
  unzipFiles: 0,
  renameFile: 0,
  splitFile: 0,
};

// Cache for processed files
const fileCache: Record<string, { data: any; expiry: number }> = {};
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Invalidate cache for a specific key
export const invalidateCache = (key: string): void => {
  delete fileCache[key];
  logger.info(`Cache invalidated`, { key });
};

// Utility to generate a cache key from file properties
const generateCacheKey = (file: File, operation: string): string => {
  return `${operation}_${file.name}_${file.size}_${file.lastModified}`;
};

// Get File Metadata: Extract metadata from a file
export const getFileMetadata = (file: File): FileMetadata => {
  try {
    if (!file) {
      throw new FileToolError(
        'Get File Metadata: No file provided',
        'NO_FILE',
        'Please upload a file to extract metadata.'
      );
    }

    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type || 'Unknown',
      lastModified: new Date(file.lastModified).toLocaleString(),
    };

    usageAnalytics.getFileMetadata++;
    logger.info('File metadata extracted', {
      fileName: file.name,
      usageCount: usageAnalytics.getFileMetadata,
    });

    return metadata;
  } catch (error: any) {
    logger.error('Get File Metadata failed', { error: error.message, fileName: file?.name });
    throw new FileToolError(
      `Get File Metadata failed: ${error.message}`,
      'METADATA_ERROR',
      'Please ensure the file is valid and try again.'
    );
  }
};

// PDF to Text: Extract text from a PDF file
export const pdfToText = async (file: File): Promise<PdfTextResult> => {
  try {
    if (!file) {
      throw new FileToolError(
        'PDF to Text: No file provided',
        'NO_FILE',
        'Please upload a PDF file to extract text.'
      );
    }

    if (!file.type.includes('pdf')) {
      throw new FileToolError(
        'PDF to Text: Invalid file type',
        'INVALID_TYPE',
        'Please upload a PDF file.'
      );
    }

    // Check cache
    const cacheKey = generateCacheKey(file, 'pdfToText');
    const cached = fileCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached PDF text', { cacheKey });
      return cached.data;
    }

    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = '';
    const pageCount = pdf.numPages;

    // Extract text from each page
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      text += `Page ${i}:\n${pageText}\n\n`;
    }

    const result: PdfTextResult = { text, pageCount };

    fileCache[cacheKey] = { data: result, expiry: now + CACHE_DURATION_MS };
    usageAnalytics.pdfToText++;
    logger.info('PDF text extracted', {
      fileName: file.name,
      pageCount,
      usageCount: usageAnalytics.pdfToText,
    });

    return result;
  } catch (error: any) {
    logger.error('PDF to Text failed', { error: error.message, fileName: file?.name });
    throw new FileToolError(
      `PDF to Text failed: ${error.message}`,
      'PDF_TEXT_ERROR',
      'Please ensure the PDF file is valid and not password-protected.'
    );
  }
};

// Image to Base64: Convert an image file to base64
export const imageToBase64 = async (file: File): Promise<ImageBase64Result> => {
  try {
    if (!file) {
      throw new FileToolError(
        'Image to Base64: No file provided',
        'NO_FILE',
        'Please upload an image file to convert.'
      );
    }

    if (!file.type.startsWith('image/')) {
      throw new FileToolError(
        'Image to Base64: Invalid file type',
        'INVALID_TYPE',
        'Please upload an image file (e.g., PNG, JPEG).'
      );
    }

    // Check cache
    const cacheKey = generateCacheKey(file, 'imageToBase64');
    const cached = fileCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached base64', { cacheKey });
      return cached.data;
    }

    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(
          new FileToolError(
            'Failed to read image file',
            'READ_ERROR',
            'Please ensure the image file is valid and try again.'
          )
        );
      reader.readAsDataURL(file);
    });

    const base64 = await base64Promise;
    const result: ImageBase64Result = {
      base64,
      mimeType: file.type,
    };

    fileCache[cacheKey] = { data: result, expiry: now + CACHE_DURATION_MS };
    usageAnalytics.imageToBase64++;
    logger.info('Image converted to base64', {
      fileName: file.name,
      usageCount: usageAnalytics.imageToBase64,
    });

    return result;
  } catch (error: any) {
    logger.error('Image to Base64 failed', { error: error.message, fileName: file?.name });
    throw new FileToolError(
      `Image to Base64 failed: ${error.message}`,
      'BASE64_ERROR',
      'Please ensure the image file is valid and try again.'
    );
  }
};

// Generate Text File: Create and download a text file from user input
export const generateTextFile = (content: string, fileName: string = 'output.txt'): void => {
  try {
    if (!content.trim()) {
      throw new FileToolError(
        'Generate Text File: Content cannot be empty',
        'EMPTY_CONTENT',
        'Please enter some text to generate the file.'
      );
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, fileName);

    usageAnalytics.generateTextFile++;
    logger.info('Text file generated', {
      fileName,
      usageCount: usageAnalytics.generateTextFile,
    });
  } catch (error: any) {
    logger.error('Generate Text File failed', { error: error.message, fileName });
    throw new FileToolError(
      `Generate Text File failed: ${error.message}`,
      'TEXT_FILE_ERROR',
      'Please ensure the content is valid and try again.'
    );
  }
};

// Zip Files: Create a ZIP file from multiple files
export const zipFiles = async (files: File[], zipName: string = 'archive.zip'): Promise<void> => {
  try {
    if (!files || files.length === 0) {
      throw new FileToolError(
        'Zip Files: No files provided',
        'NO_FILES',
        'Please upload at least one file to create a ZIP.'
      );
    }

    const zip = new JSZip();
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      zip.file(file.name, arrayBuffer);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, zipName);

    usageAnalytics.zipFiles++;
    logger.info('ZIP file created', {
      zipName,
      fileCount: files.length,
      usageCount: usageAnalytics.zipFiles,
    });
  } catch (error: any) {
    logger.error('Zip Files failed', { error: error.message, zipName });
    throw new FileToolError(
      `Zip Files failed: ${error.message}`,
      'ZIP_ERROR',
      'Please ensure all files are valid and try again.'
    );
  }
};

// Unzip Files: Extract files from a ZIP archive
export const unzipFiles = async (zipFile: File): Promise<UnzippedFile[]> => {
  try {
    if (!zipFile) {
      throw new FileToolError(
        'Unzip Files: No file provided',
        'NO_FILE',
        'Please upload a ZIP file to extract.'
      );
    }

    if (!zipFile.type.includes('zip')) {
      throw new FileToolError(
        'Unzip Files: Invalid file type',
        'INVALID_TYPE',
        'Please upload a ZIP file.'
      );
    }

    // Check cache
    const cacheKey = generateCacheKey(zipFile, 'unzipFiles');
    const cached = fileCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached unzipped files', { cacheKey });
      return cached.data;
    }

    const zip = new JSZip();
    const arrayBuffer = await zipFile.arrayBuffer();
    const unzipped = await zip.loadAsync(arrayBuffer);

    const result: UnzippedFile[] = [];
    for (const [fileName, fileData] of Object.entries(unzipped.files)) {
      if (!fileData.dir) {
        const content = await fileData.async('blob');
        result.push({ name: fileName, content });
      }
    }

    fileCache[cacheKey] = { data: result, expiry: now + CACHE_DURATION_MS };
    usageAnalytics.unzipFiles++;
    logger.info('ZIP file extracted', {
      fileName: zipFile.name,
      fileCount: result.length,
      usageCount: usageAnalytics.unzipFiles,
    });

    return result;
  } catch (error: any) {
    logger.error('Unzip Files failed', { error: error.message, fileName: zipFile?.name });
    throw new FileToolError(
      `Unzip Files failed: ${error.message}`,
      'UNZIP_ERROR',
      'Please ensure the ZIP file is valid and not password-protected.'
    );
  }
};

// Rename File: Rename a single file (client-side)
export const renameFile = (file: File, newName: string): File => {
  try {
    if (!file) {
      throw new FileToolError(
        'Rename File: No file provided',
        'NO_FILE',
        'Please upload a file to rename.'
      );
    }

    if (!newName.trim()) {
      throw new FileToolError(
        'Rename File: New name cannot be empty',
        'EMPTY_NAME',
        'Please provide a valid new name for the file.'
      );
    }

    const renamedFile = new File([file], newName, {
      type: file.type,
      lastModified: file.lastModified,
    });

    usageAnalytics.renameFile++;
    logger.info('File renamed', {
      originalName: file.name,
      newName,
      usageCount: usageAnalytics.renameFile,
    });

    return renamedFile;
  } catch (error: any) {
    logger.error('Rename File failed', { error: error.message, fileName: file?.name });
    throw new FileToolError(
      `Rename File failed: ${error.message}`,
      'RENAME_ERROR',
      'Please ensure the file and new name are valid.'
    );
  }
};

// Split File: Split a file into smaller parts
export const splitFile = async (file: File, maxSize: number): Promise<SplitFilePart[]> => {
  try {
    if (!file) {
      throw new FileToolError(
        'Split File: No file provided',
        'NO_FILE',
        'Please upload a file to split.'
      );
    }

    if (maxSize <= 0) {
      throw new FileToolError(
        'Split File: Invalid split size',
        'INVALID_SIZE',
        'Please provide a positive split size in bytes.'
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const totalSize = arrayBuffer.byteLength;
    const totalParts = Math.ceil(totalSize / maxSize);
    const result: SplitFilePart[] = [];

    for (let i = 0; i < totalParts; i++) {
      const start = i * maxSize;
      const end = Math.min(start + maxSize, totalSize);
      const partBuffer = arrayBuffer.slice(start, end);
      const partBlob = new Blob([partBuffer], { type: file.type });
      const partName = `${file.name}.part${String(i + 1).padStart(3, '0')}`;
      result.push({
        name: partName,
        partNumber: i + 1,
        content: partBlob,
        totalParts,
      });
    }

    usageAnalytics.splitFile++;
    logger.info('File split', {
      fileName: file.name,
      partCount: totalParts,
      usageCount: usageAnalytics.splitFile,
    });

    return result;
  } catch (error: any) {
    logger.error('Split File failed', { error: error.message, fileName: file?.name });
    throw new FileToolError(
      `Split File failed: ${error.message}`,
      'SPLIT_ERROR',
      'Please ensure the file is valid and the split size is appropriate.'
    );
  }
};

// Get usage analytics
export const getUsageAnalytics = (): Record<string, number> => {
  return { ...usageAnalytics };
};