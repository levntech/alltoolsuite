// tools/faviconToolsLogic.ts
// Enhanced production-grade logic for favicon-tools category: Text to Favicon, Emoji to Favicon, Image to Favicon, Favicon Package

import { createLogger, transports, format } from 'winston';
import DOMPurify from 'dompurify';
import JSZip from 'jszip';
import { toIco } from 'icojs';

// Logger setup for client-side logging
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Custom error class for favicon tools
class FaviconToolError extends Error {
  constructor(message: string, public code: string, public suggestion?: string) {
    super(message);
    this.name = 'FaviconToolError';
  }
}

// Interface for favicon generation result
export interface FaviconResult {
  dataUrl: string; // Data URL of the favicon (e.g., "data:image/png;base64,...")
  size: number; // Size of the favicon (e.g., 32 for 32x32)
}

// Interface for favicon package (zip file)
export interface FaviconPackage {
  zipDataUrl: string; // Data URL of the zip file (e.g., "data:application/zip;base64,...")
  files: string[]; // List of files included in the zip
  previews: FaviconResult[]; // Previews of all generated favicons
}

// Interface for advanced customization options
export interface FaviconOptions {
  roundedCorners?: boolean;
  cornerRadius?: number;
  shadow?: boolean;
  border?: boolean;
  borderColor?: string;
  borderWidth?: number;
}

// Analytics tracking
const usageAnalytics: Record<string, number> = {
  textToFavicon: 0,
  emojiToFavicon: 0,
  imageToFavicon: 0,
  generateFaviconPackage: 0,
};

// Cache for generated favicons
const faviconCache: Record<string, { data: FaviconResult; expiry: number }> = {};
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { USE_PROFILES: { html: false } });
};

// Invalidate cache for a specific key
export const invalidateCache = (key: string): void => {
  delete faviconCache[key];
  logger.info(`Cache invalidated`, { key });
};

// Utility to create a canvas and draw favicon content
const createFaviconCanvas = (size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new FaviconToolError(
      'Failed to get canvas 2D context',
      'CANVAS_ERROR',
      'Please ensure your browser supports the Canvas API.'
    );
  }
  return { canvas, ctx };
};

// Utility to apply advanced customization (rounded corners, shadow, border)
const applyFaviconStyles = (
  ctx: CanvasRenderingContext2D,
  size: number,
  options: FaviconOptions,
  bgColor: string
) => {
  const { roundedCorners = false, cornerRadius = size / 4, shadow = false, border = false, borderColor = '#000000', borderWidth = 2 } = options;

  // Apply rounded corners
  if (roundedCorners) {
    ctx.beginPath();
    ctx.moveTo(cornerRadius, 0);
    ctx.lineTo(size - cornerRadius, 0);
    ctx.quadraticCurveTo(size, 0, size, cornerRadius);
    ctx.lineTo(size, size - cornerRadius);
    ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
    ctx.lineTo(cornerRadius, size);
    ctx.quadraticCurveTo(0, size, 0, size - cornerRadius);
    ctx.lineTo(0, cornerRadius);
    ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctx.closePath();
    ctx.clip();
  }

  // Draw background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Apply shadow
  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = size / 8;
    ctx.shadowOffsetX = size / 16;
    ctx.shadowOffsetY = size / 16;
  }

  // Apply border
  if (border) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, size - borderWidth, size - borderWidth);
  }

  // Reset shadow for text/image drawing
  if (shadow) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
};

// Text to Favicon: Generate a favicon from text (e.g., initials)
export const textToFavicon = (
  text: string,
  size: number = 32,
  bgColor: string = '#000000',
  textColor: string = '#ffffff',
  font: string = 'Arial',
  options: FaviconOptions = {}
): FaviconResult => {
  try {
    if (!text.trim()) {
      throw new FaviconToolError(
        'Text to Favicon: Text cannot be empty',
        'EMPTY_TEXT',
        'Please enter the text for the favicon.'
      );
    }

    const sanitizedText = sanitizeInput(text).slice(0, 2).toUpperCase(); // Take first 2 chars
    const sanitizedBgColor = sanitizeInput(bgColor);
    const sanitizedTextColor = sanitizeInput(textColor);
    const sanitizedFont = sanitizeInput(font);

    // Create cache key
    const cacheKey = `text_${sanitizedText}_${size}_${sanitizedBgColor}_${sanitizedTextColor}_${sanitizedFont}_${JSON.stringify(options)}`;
    const cached = faviconCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached favicon', { cacheKey });
      return cached.data;
    }

    const { canvas, ctx } = createFaviconCanvas(size);

    // Apply advanced styles
    applyFaviconStyles(ctx, size, options, sanitizedBgColor);

    // Draw text
    const fontSize = size * 0.6;
    ctx.font = `${fontSize}px ${sanitizedFont}`;
    ctx.fillStyle = sanitizedTextColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sanitizedText, size / 2, size / 2);

    const dataUrl = canvas.toDataURL('image/png');
    const result = { dataUrl, size };

    faviconCache[cacheKey] = { data: result, expiry: now + CACHE_DURATION_MS };
    usageAnalytics.textToFavicon++;
    logger.info('Text favicon generated', {
      text: sanitizedText,
      size,
      usageCount: usageAnalytics.textToFavicon,
    });

    return result;
  } catch (error: any) {
    logger.error('Text to Favicon failed', { error: error.message, text });
    throw new FaviconToolError(
      `Text to Favicon failed: ${error.message}`,
      'TEXT_FAVICON_ERROR',
      'Please ensure the input is valid and try again.'
    );
  }
};

// Emoji to Favicon: Generate a favicon from an emoji
export const emojiToFavicon = (
  emoji: string,
  size: number = 32,
  bgColor: string = '#ffffff',
  options: FaviconOptions = {}
): FaviconResult => {
  try {
    if (!emoji.trim()) {
      throw new FaviconToolError(
        'Emoji to Favicon: Emoji cannot be empty',
        'EMPTY_EMOJI',
        'Please enter an emoji for the favicon.'
      );
    }

    const sanitizedEmoji = sanitizeInput(emoji);
    const sanitizedBgColor = sanitizeInput(bgColor);

    // Create cache key
    const cacheKey = `emoji_${sanitizedEmoji}_${size}_${sanitizedBgColor}_${JSON.stringify(options)}`;
    const cached = faviconCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached favicon', { cacheKey });
      return cached.data;
    }

    const { canvas, ctx } = createFaviconCanvas(size);

    // Apply advanced styles
    applyFaviconStyles(ctx, size, options, sanitizedBgColor);

    // Draw emoji
    const fontSize = size * 0.8;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sanitizedEmoji, size / 2, size / 2);

    const dataUrl = canvas.toDataURL('image/png');
    const result = { dataUrl, size };

    faviconCache[cacheKey] = { data: result, expiry: now + CACHE_DURATION_MS };
    usageAnalytics.emojiToFavicon++;
    logger.info('Emoji favicon generated', {
      emoji: sanitizedEmoji,
      size,
      usageCount: usageAnalytics.emojiToFavicon,
    });

    return result;
  } catch (error: any) {
    logger.error('Emoji to Favicon failed', { error: error.message, emoji });
    throw new FaviconToolError(
      `Emoji to Favicon failed: ${error.message}`,
      'EMOJI_FAVICON_ERROR',
      'Please ensure the emoji is valid and try again.'
    );
  }
};

// Image to Favicon: Convert an uploaded image to a favicon
export const imageToFavicon = async (
  imageDataUrl: string,
  size: number = 32,
  options: FaviconOptions = {}
): Promise<FaviconResult> => {
  try {
    if (!imageDataUrl) {
      throw new FaviconToolError(
        'Image to Favicon: Image data cannot be empty',
        'EMPTY_IMAGE',
        'Please upload an image.'
      );
    }

    // Create cache key
    const cacheKey = `image_${imageDataUrl.slice(0, 50)}_${size}_${JSON.stringify(options)}`; // Use first 50 chars of data URL for cache key
    const cached = faviconCache[cacheKey];
    const now = Date.now();

    if (cached && now < cached.expiry) {
      logger.info('Using cached favicon', { cacheKey });
      return cached.data;
    }

    // Load the image
    const img = new Image();
    img.src = imageDataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () =>
        reject(
          new FaviconToolError(
            'Failed to load image',
            'IMAGE_LOAD_ERROR',
            'Please ensure the image is valid and try again.'
          )
        );
    });

    const { canvas, ctx } = createFaviconCanvas(size);

    // Apply advanced styles (background, border, etc.)
    applyFaviconStyles(ctx, size, options, 'transparent');

    // Draw the image, scaled to fit
    ctx.drawImage(img, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/png');
    const result = { dataUrl, size };

    faviconCache[cacheKey] = { data: result, expiry: now + CACHE_DURATION_MS };
    usageAnalytics.imageToFavicon++;
    logger.info('Image favicon generated', { size, usageCount: usageAnalytics.imageToFavicon });

    return result;
  } catch (error: any) {
    logger.error('Image to Favicon failed', { error: error.message });
    throw new FaviconToolError(
      `Image to Favicon failed: ${error.message}`,
      'IMAGE_FAVICON_ERROR',
      'Please ensure the image is valid and try again.'
    );
  }
};

// Generate Favicon Package: Create a zip file with favicons for multiple platforms
export const generateFaviconPackage = async (
  sourceDataUrl: string,
  options: FaviconOptions = {}
): Promise<FaviconPackage> => {
  try {
    if (!sourceDataUrl) {
      throw new FaviconToolError(
        'Generate Favicon Package: Source image cannot be empty',
        'EMPTY_SOURCE',
        'Please provide a source image or favicon.'
      );
    }

    const sizes = [
      { size: 16, name: 'favicon-16x16.png' },
      { size: 32, name: 'favicon-32x32.png' },
      { size: 64, name: 'favicon-64x64.png' },
      { size: 180, name: 'apple-touch-icon.png' }, // Apple Touch Icon
      { size: 192, name: 'android-chrome-192x192.png' }, // Android Chrome
      { size: 512, name: 'android-chrome-512x512.png' },
      { size: 144, name: 'ms-icon-144x144.png' }, // Microsoft Windows
    ];

    // Generate favicons for each size
    const faviconPromises = sizes.map(async ({ size, name }) => {
      const favicon = await imageToFavicon(sourceDataUrl, size, options);
      const base64Data = favicon.dataUrl.split(',')[1]; // Extract Base64 data
      return { name, data: base64Data, favicon };
    });

    const faviconResults = await Promise.all(faviconPromises);
    const favicons = faviconResults.map(({ name, data }) => ({ name, data }));
    const previews = faviconResults.map(({ favicon }) => favicon);

    // Generate favicon.ico using icojs
    const icoSizes = [16, 32, 64];
    const icoImages = await Promise.all(
      icoSizes.map(async (size) => {
        const favicon = await imageToFavicon(sourceDataUrl, size, options);
        const response = await fetch(favicon.dataUrl);
        const arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
      })
    );

    const faviconIco = await toIco(icoImages, { sizes: icoSizes });

    // Create a zip file
    const zip = new JSZip();
    favicons.forEach(({ name, data }) => {
      zip.file(name, data, { base64: true });
    });

    // Add favicon.ico
    zip.file('favicon.ico', faviconIco, { binary: true });

    // Generate zip file
    const zipContent = await zip.generateAsync({ type: 'base64' });
    const zipDataUrl = `data:application/zip;base64,${zipContent}`;
    const files = [...favicons.map((f) => f.name), 'favicon.ico'];

    usageAnalytics.generateFaviconPackage++;
    logger.info('Favicon package generated', {
      fileCount: files.length,
      usageCount: usageAnalytics.generateFaviconPackage,
    });

    return { zipDataUrl, files, previews };
  } catch (error: any) {
    logger.error('Generate Favicon Package failed', { error: error.message });
    throw new FaviconToolError(
      `Generate Favicon Package failed: ${error.message}`,
      'PACKAGE_ERROR',
      'Please ensure the source image is valid and try again.'
    );
  }
};

// Get usage analytics
export const getUsageAnalytics = (): Record<string, number> => {
  return { ...usageAnalytics };
};