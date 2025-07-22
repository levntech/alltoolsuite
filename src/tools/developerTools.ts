// tools/developerToolsLogic.ts
// Production-grade logic for developer-tools category: JSON Formatter, Base64 Encoder/Decoder, Code Minifier, UUID Generator, Hash Generator, Regex Tester

import { createLogger, transports, format } from 'winston';
import { minify } from 'terser';
import { v4 as uuidv4 } from 'uuid';
import * as CryptoJS from 'crypto-js';

// Logger setup for client-side logging
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Custom error class for developer tools
class DeveloperToolError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DeveloperToolError';
  }
}

// Interface for minification result
export interface MinificationResult {
  originalSize: number;
  minifiedSize: number;
  minifiedCode: string;
}

// Interface for regex test result
export interface RegexTestResult {
  matches: string[];
  groups: string[][];
}

// Cache for minified code and hashes
const minifyCache: Record<string, { data: MinificationResult; expiry: number }> = {};
const hashCache: Record<string, { data: { md5: string; sha256: string }; expiry: number }> = {};
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// JSON Formatter: Format and validate JSON strings
export const formatJson = (jsonString: string): { formatted: string; error: string | null } => {
  try {
    if (!jsonString.trim()) {
      throw new DeveloperToolError('JSON Formatter: Input cannot be empty', 'EMPTY_INPUT');
    }

    const parsed = JSON.parse(jsonString);
    const formatted = JSON.stringify(parsed, null, 2);

    logger.info('JSON formatting successful', { inputLength: jsonString.length });
    return { formatted, error: null };
  } catch (error: any) {
    logger.error('JSON Formatter failed', { error: error.message, input: jsonString });
    return { formatted: '', error: error.message };
  }
};

// Base64 Encoder/Decoder: Encode or decode Base64 strings
export const base64Encode = (input: string): string => {
  try {
    if (!input.trim()) {
      throw new DeveloperToolError('Base64 Encoder: Input cannot be empty', 'EMPTY_INPUT');
    }

    const encoded = btoa(input);
    logger.info('Base64 encoding successful', { inputLength: input.length });
    return encoded;
  } catch (error: any) {
    logger.error('Base64 Encoder failed', { error: error.message, input });
    throw new DeveloperToolError(`Base64 Encoder failed: ${error.message}`, 'ENCODE_ERROR');
  }
};

export const base64Decode = (input: string): string => {
  try {
    if (!input.trim()) {
      throw new DeveloperToolError('Base64 Decoder: Input cannot be empty', 'EMPTY_INPUT');
    }

    const decoded = atob(input);
    logger.info('Base64 decoding successful', { inputLength: input.length });
    return decoded;
  } catch (error: any) {
    logger.error('Base64 Decoder failed', { error: error.message, input });
    throw new DeveloperToolError(`Base64 Decoder failed: ${error.message}`, 'DECODE_ERROR');
  }
};

// Code Minifier: Minify JavaScript code with caching
export const minifyCode = async (code: string): Promise<MinificationResult> => {
  try {
    if (!code.trim()) {
      throw new DeveloperToolError('Code Minifier: Input cannot be empty', 'EMPTY_INPUT');
    }

    // Check cache
    const cacheKey = `minify_${code}`;
    const cached = minifyCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached minified code', { cacheKey });
      return cached.data;
    }

    let result;
    try {
      result = await minify(code, {
        compress: true,
        mangle: true,
        sourceMap: false,
      });
    } catch (minifyError: any) {
      throw new DeveloperToolError(`Code Minifier: ${minifyError.message}`, 'MINIFY_ERROR');
    }

    const minifiedCode = result.code || '';
    const originalSize = new TextEncoder().encode(code).length;
    const minifiedSize = new TextEncoder().encode(minifiedCode).length;

    const minificationResult: MinificationResult = {
      originalSize,
      minifiedSize,
      minifiedCode,
    };

    minifyCache[cacheKey] = { data: minificationResult, expiry: now + CACHE_DURATION_MS };
    logger.info('Code minification successful', { originalSize, minifiedSize });

    return minificationResult;
  } catch (error: any) {
    logger.error('Code Minifier failed', { error: error.message, input: code });
    throw new DeveloperToolError(`Code Minifier failed: ${error.message}`, 'MINIFY_ERROR');
  }
};

// UUID Generator: Generate a version 4 UUID
export const generateUuid = (): string => {
  try {
    const uuid = uuidv4();
    logger.info('UUID generated', { uuid });
    return uuid;
  } catch (error: any) {
    logger.error('UUID Generator failed', { error: error.message });
    throw new DeveloperToolError(`UUID Generator failed: ${error.message}`, 'UUID_ERROR');
  }
};

// Hash Generator: Compute MD5 and SHA-256 hashes with caching
export const generateHash = (input: string): { md5: string; sha256: string } => {
  try {
    if (!input.trim()) {
      throw new DeveloperToolError('Hash Generator: Input cannot be empty', 'EMPTY_INPUT');
    }

    // Check cache
    const cacheKey = `hash_${input}`;
    const cached = hashCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached hash', { cacheKey });
      return cached.data;
    }

    const md5 = CryptoJS.MD5(input).toString();
    const sha256 = CryptoJS.SHA256(input).toString();

    const hashResult = { md5, sha256 };
    hashCache[cacheKey] = { data: hashResult, expiry: now + CACHE_DURATION_MS };
    logger.info('Hash generated', { inputLength: input.length });

    return hashResult;
  } catch (error: any) {
    logger.error('Hash Generator failed', { error: error.message, input });
    throw new DeveloperToolError(`Hash Generator failed: ${error.message}`, 'HASH_ERROR');
  }
};

// Regex Tester: Test a regex pattern against input text
export const testRegex = (pattern: string, input: string): RegexTestResult => {
  try {
    if (!pattern.trim()) {
      throw new DeveloperToolError('Regex Tester: Pattern cannot be empty', 'EMPTY_PATTERN');
    }
    if (!input.trim()) {
      throw new DeveloperToolError('Regex Tester: Input cannot be empty', 'EMPTY_INPUT');
    }

    const regex = new RegExp(pattern, 'g');
    const matches: string[] = [];
    const groups: string[][] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(input)) !== null) {
      matches.push(match[0]);
      const matchGroups = match.slice(1).filter((g) => g !== undefined);
      if (matchGroups.length > 0) {
        groups.push(matchGroups);
      }
    }

    logger.info('Regex test successful', { pattern, inputLength: input.length, matchCount: matches.length });
    return { matches, groups };
  } catch (error: any) {
    logger.error('Regex Tester failed', { error: error.message, pattern, input });
    throw new DeveloperToolError(`Regex Tester failed: ${error.message}`, 'REGEX_ERROR');
  }
};