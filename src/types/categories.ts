// categories.ts
export const categories = {
  SEO: 'seo-tools',
  IMAGE: 'image-tools',
  VIDEO: 'video-tools',
  PDF: 'pdf-tools',
  TEXT: 'text-tools',
  AUDIO: 'audio-tools',
  DEVELOPER: 'developer-tools',
  SOCIAL: 'social-tools',
  COLOR: 'color-tools',
  SECURITY: 'security-tools',
  MARKDOWN: 'markdown-tools',
  ENCRYPTION: 'encryption-tools',
  FILE: 'file-tools',
  QRCODE: 'qr-code-tools',
  BARCODE: 'barcode-tools',
  UNIT_CONVERTER: 'unit-converter',
  CURRENCY: 'currency-tools',
  TIMESTAMP: 'timestamp-tools',
  AI: 'ai-tools',
  UX: 'ux-tools',
  HTML: 'html-tools',
  EMAIL: 'email-tools',
  FAVICON: 'favicon-tools',
  JSON: 'json-tools',
  GIF: 'gif-tools',
} as const;


export type Category = typeof categories[keyof typeof categories];
