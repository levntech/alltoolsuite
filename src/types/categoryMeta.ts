// categoryMeta.ts
import { categories, Category } from './categories';

export interface CategoryMeta {
  key: Category;
  title: string;
  desc: string;
  icon: string;
  path: string;
  color: string;
}

export const categoryMeta: CategoryMeta[] = [
  {
    key: categories.TEXT,
    title: 'Text Tools',
    desc: 'Utilities to transform and analyze text.',
    icon: 'FaFont',
    path: '/text-tools',
    color: 'text-blue-500',
  },
  {
    key: categories.SEO,
    title: 'SEO Tools',
    desc: 'Optimize your content for search engines.',
    icon: 'FaSearch',
    path: '/seo-tools',
    color: 'text-green-500',
  },
  {
    key: categories.IMAGE,
    title: 'Image Tools',
    desc: 'Edit, optimize, and convert images easily.',
    icon: 'FaImage',
    path: '/image-tools',
    color: 'text-yellow-500',
  },
  {
    key: categories.VIDEO,
    title: 'Video Tools',
    desc: 'Trim, compress, and convert videos.',
    icon: 'FaVideo',
    path: '/video-tools',
    color: 'text-red-500',
  },
  {
    key: categories.PDF,
    title: 'PDF Tools',
    desc: 'Split, merge, and convert PDF files.',
    icon: 'FaFilePdf',
    path: '/pdf-tools',
    color: 'text-pink-500',
  },
  {
    key: categories.AUDIO,
    title: 'Audio Tools',
    desc: 'Edit, compress, and convert audio files.',
    icon: 'FaMusic',
    path: '/audio-tools',
    color: 'text-indigo-500',
  },
  {
    key: categories.DEVELOPER,
    title: 'Developer Tools',
    desc: 'Handy utilities for developers and coders.',
    icon: 'FaCode',
    path: '/developer-tools',
    color: 'text-gray-600',
  },
  {
    key: categories.SOCIAL,
    title: 'Social Tools',
    desc: 'Tools for social media optimization.',
    icon: 'FaShareAlt',
    path: '/social-tools',
    color: 'text-pink-400',
  },
  {
    key: categories.COLOR,
    title: 'Color Tools',
    desc: 'Pick, convert, and generate colors.',
    icon: 'FaPalette',
    path: '/color-tools',
    color: 'text-amber-500',
  },
  {
    key: categories.SECURITY,
    title: 'Security Tools',
    desc: 'Check, secure, and analyze your data.',
    icon: 'FaShieldAlt',
    path: '/security-tools',
    color: 'text-red-600',
  },
  {
    key: categories.MARKDOWN,
    title: 'Markdown Tools',
    desc: 'Convert and preview markdown content.',
    icon: 'FaMarkdown',
    path: '/markdown-tools',
    color: 'text-gray-800',
  },
  {
    key: categories.ENCRYPTION,
    title: 'Encryption Tools',
    desc: 'Encrypt and decrypt your sensitive data.',
    icon: 'FaLock',
    path: '/encryption-tools',
    color: 'text-purple-700',
  },
  {
    key: categories.FILE,
    title: 'File Tools',
    desc: 'Manage and convert various file types.',
    icon: 'FaFile',
    path: '/file-tools',
    color: 'text-purple-500',
  },
  {
    key: categories.QRCODE,
    title: 'QR Code Tools',
    desc: 'Generate and scan QR codes easily.',
    icon: 'FaQrcode',
    path: '/qr-code-tools',
    color: 'text-green-600',
  },
  {
    key: categories.BARCODE,
    title: 'Barcode Tools',
    desc: 'Generate and read barcodes quickly.',
    icon: 'FaBarcode',
    path: '/barcode-tools',
    color: 'text-gray-700',
  },
  {
    key: categories.UNIT_CONVERTER,
    title: 'Unit Converter',
    desc: 'Convert units across categories instantly.',
    icon: 'FaBalanceScale',
    path: '/unit-converter',
    color: 'text-blue-600',
  },
  {
    key: categories.CURRENCY,
    title: 'Currency Tools',
    desc: 'Convert currencies with real-time rates.',
    icon: 'FaDollarSign',
    path: '/currency-tools',
    color: 'text-green-700',
  },
  {
    key: categories.TIMESTAMP,
    title: 'Timestamp Tools',
    desc: 'Convert and format timestamps.',
    icon: 'FaClock',
    path: '/timestamp-tools',
    color: 'text-orange-600',
  },
  {
    key: categories.AI,
    title: 'AI Tools',
    desc: 'AI-powered tools and generators.',
    icon: 'FaRobot',
    path: '/ai-tools',
    color: 'text-sky-500',
  },
  {
    key: categories.UX,
    title: 'UX Tools',
    desc: 'User experience design utilities.',
    icon: 'FaDraftingCompass',
    path: '/ux-tools',
    color: 'text-teal-600',
  },
  {
    key: categories.HTML,
    title: 'HTML Tools',
    desc: 'Validate, format, and edit HTML code.',
    icon: 'FaHtml5',
    path: '/html-tools',
    color: 'text-orange-500',
  },
  {
    key: categories.EMAIL,
    title: 'Email Tools',
    desc: 'Validate and generate emails.',
    icon: 'FaEnvelope',
    path: '/email-tools',
    color: 'text-blue-400',
  },
  {
    key: categories.FAVICON,
    title: 'Favicon Tools',
    desc: 'Generate and manage favicons.',
    icon: 'FaIcons',
    path: '/favicon-tools',
    color: 'text-violet-500',
  },
  {
    key: categories.JSON,
    title: 'JSON Tools',
    desc: 'Format, validate, and edit JSON data.',
    icon: 'FaBracketsCurly',
    path: '/json-tools',
    color: 'text-gray-900',
  },
  {
    key: categories.GIF,
    title: 'GIF Tools',
    desc: 'Create and optimize GIF animations.',
    icon: 'FaFileImage',
    path: '/gif-tools',
    color: 'text-pink-600',
  },
];

// 🚀 O(1) lookup map
export const categoryMetaMap: Record<Category, CategoryMeta> = Object.fromEntries(
  categoryMeta.map((meta) => [meta.key, meta])
) as Record<Category, CategoryMeta>;
