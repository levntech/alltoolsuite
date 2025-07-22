// tools/encryptionToolsLogic.ts
// Production-grade logic for encryption-tools category: AES Encryption/Decryption, RSA Key Pair Generation, RSA Encryption/Decryption

import { createLogger, transports, format } from 'winston';
import DOMPurify from 'dompurify';

// Logger setup for client-side logging
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Custom error class for encryption tools
class EncryptionToolError extends Error {
  constructor(message: string, public code: string, public suggestion?: string) {
    super(message);
    this.name = 'EncryptionToolError';
  }
}

// Interface for AES encryption result
export interface AESEncryptionResult {
  encryptedData: string; // Base64-encoded ciphertext
  iv: string; // Base64-encoded initialization vector
  key: string; // Base64-encoded key (if generated)
}

// Interface for AES decryption result
export interface AESDecryptionResult {
  decryptedData: string;
}

// Interface for RSA key pair
export interface RSAKeyPair {
  publicKey: string; // Base64-encoded public key
  privateKey: string; // Base64-encoded private key
}

// Interface for RSA encryption/decryption result
export interface RSAEncryptionResult {
  encryptedData: string; // Base64-encoded ciphertext
}

export interface RSADecryptionResult {
  decryptedData: string;
}

// Analytics tracking
const usageAnalytics: Record<string, number> = {
  aesEncrypt: 0,
  aesDecrypt: 0,
  rsaGenerateKeyPair: 0,
  rsaEncrypt: 0,
  rsaDecrypt: 0,
};

// Cache for RSA key pairs
const keyPairCache: Record<string, { data: RSAKeyPair; expiry: number }> = {};
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { USE_PROFILES: { html: false } });
};

// Utility to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Utility to convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Utility to convert CryptoKey to Base64
const cryptoKeyToBase64 = async (key: CryptoKey): Promise<string> => {
  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
};

// Utility to convert Base64 to CryptoKey (for AES)
const base64ToCryptoKey = async (base64: string): Promise<CryptoKey> => {
  const keyBuffer = base64ToArrayBuffer(base64);
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
};

// Utility to export RSA key to Base64
const exportRSAKey = async (key: CryptoKey): Promise<string> => {
  const format = key.type === 'public' ? 'spki' : 'pkcs8';
  const exported = await crypto.subtle.exportKey(format, key);
  return arrayBufferToBase64(exported);
};

// Utility to import RSA key from Base64
const importRSAKey = async (base64: string, type: 'public' | 'private'): Promise<CryptoKey> => {
  const keyBuffer = base64ToArrayBuffer(base64);
  const format = type === 'public' ? 'spki' : 'pkcs8';
  const usage = type === 'public' ? ['encrypt'] : ['decrypt'];
  return crypto.subtle.importKey(
    format,
    keyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    usage as KeyUsage[]
  );
};

// Invalidate cache for a specific key
export const invalidateCache = (key: string): void => {
  delete keyPairCache[key];
  logger.info(`Cache invalidated`, { key });
};

// AES Encryption: Encrypt text using AES-GCM
export const aesEncrypt = async (
  text: string,
  keyBase64?: string // Optional: Provide a Base64-encoded AES key
): Promise<AESEncryptionResult> => {
  try {
    if (!text.trim()) {
      throw new EncryptionToolError(
        'AES Encryption: Text cannot be empty',
        'EMPTY_TEXT',
        'Please enter the text to encrypt.'
      );
    }

    const sanitizedText = sanitizeInput(text);

    // Generate or use the provided key
    let key: CryptoKey;
    let keyBase64ToReturn = keyBase64;
    if (!keyBase64) {
      const rawKey = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
      key = await crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );
      keyBase64ToReturn = arrayBufferToBase64(rawKey);
    } else {
      key = await base64ToCryptoKey(keyBase64);
    }

    // Generate initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encodedText = new TextEncoder().encode(sanitizedText);

    // Encrypt the text
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );

    const encryptedData = arrayBufferToBase64(encrypted);
    const ivBase64 = arrayBufferToBase64(iv.buffer);

    usageAnalytics.aesEncrypt++;
    logger.info('AES encryption completed', { textLength: sanitizedText.length, usageCount: usageAnalytics.aesEncrypt });
    return { encryptedData, iv: ivBase64, key: keyBase64ToReturn! };
  } catch (error: any) {
    logger.error('AES Encryption failed', { error: error.message });
    throw new EncryptionToolError(
      `AES Encryption failed: ${error.message}`,
      'AES_ENCRYPTION_ERROR',
      'Please ensure the input is valid and try again.'
    );
  }
};

// AES Decryption: Decrypt text using AES-GCM
export const aesDecrypt = async (
  encryptedData: string,
  iv: string,
  key: string
): Promise<AESDecryptionResult> => {
  try {
    if (!encryptedData.trim() || !iv.trim() || !key.trim()) {
      throw new EncryptionToolError(
        'AES Decryption: All fields are required',
        'MISSING_FIELDS',
        'Please provide the encrypted data, IV, and key.'
      );
    }

    const sanitizedEncryptedData = sanitizeInput(encryptedData);
    const sanitizedIv = sanitizeInput(iv);
    const sanitizedKey = sanitizeInput(key);

    // Convert inputs to required formats
    const encryptedBuffer = base64ToArrayBuffer(sanitizedEncryptedData);
    const ivBuffer = base64ToArrayBuffer(sanitizedIv);
    const cryptoKey = await base64ToCryptoKey(sanitizedKey);

    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      cryptoKey,
      encryptedBuffer
    );

    const decryptedData = new TextDecoder().decode(decrypted);

    usageAnalytics.aesDecrypt++;
    logger.info('AES decryption completed', { usageCount: usageAnalytics.aesDecrypt });
    return { decryptedData };
  } catch (error: any) {
    logger.error('AES Decryption failed', { error: error.message });
    throw new EncryptionToolError(
      `AES Decryption failed: ${error.message}`,
      'AES_DECRYPTION_ERROR',
      'Please ensure the encrypted data, IV, and key are correct.'
    );
  }
};

// RSA Key Pair Generation: Generate an RSA key pair
export const rsaGenerateKeyPair = async (cacheKey: string = 'default'): Promise<RSAKeyPair> => {
  try {
    // Check cache first
    const cached = keyPairCache[cacheKey];
    const now = Date.now();
    if (cached && now < cached.expiry) {
      logger.info('Using cached RSA key pair', { cacheKey });
      return cached.data;
    }

    // Generate RSA key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Export keys to Base64
    const publicKey = await exportRSAKey(keyPair.publicKey);
    const privateKey = await exportRSAKey(keyPair.privateKey);

    const result = { publicKey, privateKey };
    keyPairCache[cacheKey] = { data: result, expiry: now + CACHE_DURATION_MS };

    usageAnalytics.rsaGenerateKeyPair++;
    logger.info('RSA key pair generated', { cacheKey, usageCount: usageAnalytics.rsaGenerateKeyPair });
    return result;
  } catch (error: any) {
    logger.error('RSA Key Pair Generation failed', { error: error.message });
    throw new EncryptionToolError(
      `RSA Key Pair Generation failed: ${error.message}`,
      'RSA_KEYGEN_ERROR',
      'Please try again.'
    );
  }
};

// RSA Encryption: Encrypt text using RSA public key
export const rsaEncrypt = async (text: string, publicKeyBase64: string): Promise<RSAEncryptionResult> => {
  try {
    if (!text.trim() || !publicKeyBase64.trim()) {
      throw new EncryptionToolError(
        'RSA Encryption: Text and public key are required',
        'MISSING_FIELDS',
        'Please provide the text and public key.'
      );
    }

    const sanitizedText = sanitizeInput(text);
    const sanitizedPublicKey = sanitizeInput(publicKeyBase64);

    // Import the public key
    const publicKey = await importRSAKey(sanitizedPublicKey, 'public');

    // Encrypt the text
    const encodedText = new TextEncoder().encode(sanitizedText);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      encodedText
    );

    const encryptedData = arrayBufferToBase64(encrypted);

    usageAnalytics.rsaEncrypt++;
    logger.info('RSA encryption completed', { textLength: sanitizedText.length, usageCount: usageAnalytics.rsaEncrypt });
    return { encryptedData };
  } catch (error: any) {
    logger.error('RSA Encryption failed', { error: error.message });
    throw new EncryptionToolError(
      `RSA Encryption failed: ${error.message}`,
      'RSA_ENCRYPTION_ERROR',
      'Please ensure the text and public key are valid.'
    );
  }
};

// RSA Decryption: Decrypt text using RSA private key
export const rsaDecrypt = async (encryptedData: string, privateKeyBase64: string): Promise<RSADecryptionResult> => {
  try {
    if (!encryptedData.trim() || !privateKeyBase64.trim()) {
      throw new EncryptionToolError(
        'RSA Decryption: Encrypted data and private key are required',
        'MISSING_FIELDS',
        'Please provide the encrypted data and private key.'
      );
    }

    const sanitizedEncryptedData = sanitizeInput(encryptedData);
    const sanitizedPrivateKey = sanitizeInput(privateKeyBase64);

    // Import the private key
    const privateKey = await importRSAKey(sanitizedPrivateKey, 'private');

    // Decrypt the data
    const encryptedBuffer = base64ToArrayBuffer(sanitizedEncryptedData);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedBuffer
    );

    const decryptedData = new TextDecoder().decode(decrypted);

    usageAnalytics.rsaDecrypt++;
    logger.info('RSA decryption completed', { usageCount: usageAnalytics.rsaDecrypt });
    return { decryptedData };
  } catch (error: any) {
    logger.error('RSA Decryption failed', { error: error.message });
    throw new EncryptionToolError(
      `RSA Decryption failed: ${error.message}`,
      'RSA_DECRYPTION_ERROR',
      'Please ensure the encrypted data and private key are correct.'
    );
  }
};

// Get usage analytics
export const getUsageAnalytics = (): Record<string, number> => {
  return { ...usageAnalytics };
};