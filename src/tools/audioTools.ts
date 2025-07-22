// audioToolsLogic.ts
// Production-grade logic for audio-tools category: MP3 Cutter, Audio Converter, and Noise Remover

import { createLogger, transports, format } from 'winston';
import { apiClient } from '@/utils/apiClient';

// Logger setup for client-side logging
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Custom error class for audio tools
class AudioToolError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AudioToolError';
  }
}

// Interfaces for type safety and API contracts
export interface AudioCutResult {
  blob: Blob;
  url: string;
  duration: number;
}

export interface AudioConversionResult {
  blob: Blob;
  url: string;
  format: string;
}

export interface NoiseRemovalResult {
  blob: Blob;
  url: string;
  noiseReductionLevel: number;
}

// Constants for memory limits
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Reusable Web Workers
const mp3CutterWorker = new Worker(new URL('../workers/mp3CutterWorker.ts', import.meta.url));
const noiseRemoverWorker = new Worker(new URL('../workers/noiseRemoverWorker.ts', import.meta.url));

// Utility to check browser support
const checkBrowserSupport = (toolName: string): void => {
  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    throw new AudioToolError(
      `${toolName}: Web Audio API is not supported in this browser. Falling back to server-side processing.`,
      'UNSUPPORTED_BROWSER'
    );
  }
  if (!window.Blob || !URL.createObjectURL) {
    throw new AudioToolError(
      `${toolName}: Blob or URL APIs are not supported in this browser. Falling back to server-side processing.`,
      'UNSUPPORTED_BROWSER'
    );
  }
  if (!window.FileReader) {
    throw new AudioToolError(
      `${toolName}: FileReader API is not supported in this browser. Falling back to server-side processing.`,
      'UNSUPPORTED_BROWSER'
    );
  }
  if (!window.Worker) {
    throw new AudioToolError(
      `${toolName}: Web Workers are not supported in this browser. Falling back to server-side processing.`,
      'UNSUPPORTED_BROWSER'
    );
  }
};

// Utility to check memory limits
const checkMemoryLimits = (file: File, toolName: string): void => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AudioToolError(
      `${toolName}: File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the client-side limit of ${MAX_FILE_SIZE_MB}MB. Falling back to server-side processing.`,
      'FILE_SIZE_LIMIT_EXCEEDED'
    );
  }

  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 2) {
    const estimatedMemoryUsageMB = file.size / (1024 * 1024) * 3;
    const maxSafeMemoryMB = deviceMemory * 1024 * 0.2;
    if (estimatedMemoryUsageMB > maxSafeMemoryMB) {
      throw new AudioToolError(
        `${toolName}: Estimated memory usage (${estimatedMemoryUsageMB.toFixed(2)}MB) exceeds safe limits for this device (${maxSafeMemoryMB.toFixed(2)}MB). Falling back to server-side processing.`,
        'MEMORY_LIMIT_EXCEEDED'
      );
    }
  }
};

// Utility to validate audio file type
const validateAudioFile = (file: File, toolName: string): void => {
  if (!file || !file.type.startsWith('audio/')) {
    throw new AudioToolError(`${toolName}: Input must be an audio file`, 'INVALID_FILE_TYPE');
  }
  if (!['audio/mpeg', 'audio/mp3', 'audio/wav'].includes(file.type)) {
    throw new AudioToolError(`${toolName}: Unsupported audio format. Use MP3 or WAV`, 'UNSUPPORTED_FORMAT');
  }
};

// MP3 Cutter: Trims an audio file with fallback to server-side
export const mp3Cutter = async (
  file: File,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void,
  onFallback?: () => void
): Promise<AudioCutResult> => {
  try {
    checkBrowserSupport('MP3 Cutter');
    checkMemoryLimits(file, 'MP3 Cutter');
    validateAudioFile(file, 'MP3 Cutter');

    if (typeof startTime !== 'number' || typeof endTime !== 'number' || startTime < 0 || endTime <= startTime) {
      throw new AudioToolError(
        'MP3 Cutter: Invalid startTime or endTime. Both must be numbers, startTime >= 0, and endTime > startTime',
        'INVALID_TIME_RANGE'
      );
    }

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        mp3CutterWorker.postMessage({ fileData: arrayBuffer, startTime, endTime });
      };

      reader.onerror = () => {
        reject(new AudioToolError('MP3 Cutter: Failed to read audio file', 'FILE_READ_ERROR'));
      };

      mp3CutterWorker.onmessage = (e: MessageEvent) => {
        if (e.data.error) {
          reject(new AudioToolError(e.data.error, 'WORKER_ERROR'));
        } else if (e.data.progress) {
          if (onProgress) onProgress(e.data.progress);
        } else {
          resolve(e.data);
        }
      };

      mp3CutterWorker.onerror = (err) => {
        reject(new AudioToolError(`MP3 Cutter: Worker error - ${err.message}`, 'WORKER_ERROR'));
      };

      reader.readAsArrayBuffer(file);
    });
  } catch (error: any) {
    logger.warn('MP3 Cutter client-side processing failed, attempting server-side', {
      error: error.message,
      fileSize: file.size,
      code: error.code,
    });

    if (
      error.code === 'UNSUPPORTED_BROWSER' ||
      error.code === 'FILE_SIZE_LIMIT_EXCEEDED' ||
      error.code === 'MEMORY_LIMIT_EXCEEDED'
    ) {
      if (onFallback) onFallback();

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('startTime', startTime.toString());
        formData.append('endTime', endTime.toString());

        const response = await apiClient.post<{
          blob: ArrayBuffer;
          url: string;
          duration: number;
        }>('/audio-cutter', formData);

        const result = {
          blob: new Blob([response.data.blob], { type: 'audio/wav' }),
          url: response.data.url,
          duration: response.data.duration,
        };

        logger.info('MP3 Cutter server-side processing successful', { fileSize: file.size });
        return result;
      } catch (serverError: any) {
        logger.error('MP3 Cutter server-side processing failed', {
          error: serverError.message,
          fileSize: file.size,
        });
        throw new AudioToolError(`MP3 Cutter: Server-side processing failed - ${serverError.message}`, 'SERVER_ERROR');
      }
    }

    logger.error('MP3 Cutter failed', { error: error.message, fileSize: file.size, code: error.code });
    throw error;
  }
};

// Audio Converter: Server-side only
export const audioConverter = async (
  file: File,
  targetFormat: 'mp3' | 'wav' | 'ogg'
): Promise<AudioConversionResult> => {
  try {
    validateAudioFile(file, 'Audio Converter');

    if (!['mp3', 'wav', 'ogg'].includes(targetFormat)) {
      throw new AudioToolError('Audio Converter: Unsupported target format. Use "mp3", "wav", or "ogg"', 'UNSUPPORTED_FORMAT');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetFormat', targetFormat);

    const response = await apiClient.post<{
      blob: ArrayBuffer;
      url: string;
      format: string;
    }>('/audio-converter', formData);

    const result = {
      blob: new Blob([response.data.blob], { type: `audio/${targetFormat}` }),
      url: response.data.url,
      format: response.data.format,
    };

    return result;
  } catch (error: any) {
    logger.error('Audio Converter failed', { error: error.message, fileSize: file.size, code: error.code });
    throw new AudioToolError(`Audio Converter: Failed to convert audio - ${error.message || 'Unknown error'}`, 'CONVERSION_ERROR');
  }
};

// Noise Remover: Applies noise reduction with fallback to server-side
export const noiseRemover = async (
  file: File,
  noiseReductionLevel: number = 0.5,
  onProgress?: (progress: number) => void,
  onFallback?: () => void
): Promise<NoiseRemovalResult> => {
  try {
    checkBrowserSupport('Noise Remover');
    checkMemoryLimits(file, 'Noise Remover');
    validateAudioFile(file, 'Noise Remover');

    if (typeof noiseReductionLevel !== 'number' || noiseReductionLevel < 0 || noiseReductionLevel > 1) {
      throw new AudioToolError('Noise Remover: noiseReductionLevel must be a number between 0 and 1', 'INVALID_NOISE_LEVEL');
    }

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        noiseRemoverWorker.postMessage({ fileData: arrayBuffer, noiseReductionLevel });
      };

      reader.onerror = () => {
        reject(new AudioToolError('Noise Remover: Failed to read audio file', 'FILE_READ_ERROR'));
      };

      noiseRemoverWorker.onmessage = (e: MessageEvent) => {
        if (e.data.error) {
          reject(new AudioToolError(e.data.error, 'WORKER_ERROR'));
        } else if (e.data.progress) {
          if (onProgress) onProgress(e.data.progress);
        } else {
          resolve(e.data);
        }
      };

      noiseRemoverWorker.onerror = (err) => {
        reject(new AudioToolError(`Noise Remover: Worker error - ${err.message}`, 'WORKER_ERROR'));
      };

      reader.readAsArrayBuffer(file);
    });
  } catch (error: any) {
    logger.warn('Noise Remover client-side processing failed, attempting server-side', {
      error: error.message,
      fileSize: file.size,
      code: error.code,
    });

    if (
      error.code === 'UNSUPPORTED_BROWSER' ||
      error.code === 'FILE_SIZE_LIMIT_EXCEEDED' ||
      error.code === 'MEMORY_LIMIT_EXCEEDED'
    ) {
      if (onFallback) onFallback();

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('noiseReductionLevel', noiseReductionLevel.toString());

        const response = await apiClient.post<{
          blob: ArrayBuffer;
          url: string;
          noiseReductionLevel: number;
        }>('/noise-remover', formData);

        const result = {
          blob: new Blob([response.data.blob], { type: 'audio/wav' }),
          url: response.data.url,
          noiseReductionLevel: response.data.noiseReductionLevel,
        };

        logger.info('Noise Remover server-side processing successful', { fileSize: file.size });
        return result;
      } catch (serverError: any) {
        logger.error('Noise Remover server-side processing failed', {
          error: serverError.message,
          fileSize: file.size,
        });
        throw new AudioToolError(`Noise Remover: Server-side processing failed - ${serverError.message}`, 'SERVER_ERROR');
      }
    }

    logger.error('Noise Remover failed', { error: error.message, fileSize: file.size, code: error.code });
    throw error;
  }
};

// Cleanup workers on application shutdown
export const cleanupWorkers = () => {
  mp3CutterWorker.terminate();
  noiseRemoverWorker.terminate();
};