
import { InternalToolConfig } from '../../types/toolTypes';
import { categories } from '../../types/categories';
import { templates } from './templates';

export const textTools: InternalToolConfig[] = [
    {
            category: categories.TEXT,
            slug: 'case-converter',
            title: 'Case Converter',
            shortDescription: 'Convert text between upper/lower/camel case.',
            icon: 'FaFont',
            template: templates.TextToolTemplate,
            logicLoader: () => import('../../tools/textTools').then(m => ({ default: m.caseConverterLogic })),
            props: { resultType: 'text' },
            keywords: ['text tools', 'convert case', 'upper lower camel'],
            id: 'tool-case-converter',
            longDescription: 'The Case Converter tool allows you to quickly change the case of your text. Whether you need to convert to uppercase for emphasis, lowercase for consistency, or camel case for programming, this tool has you covered. Simply paste your text, select the desired case format, and get instant results.',
            tags: ['text', 'conversion', 'case'],
            isHidden: false,
            isExperimental: false,
            handlerPath: 'src/components/tools/CaseConverterTool.tsx',
          },
            {
                    category: categories.TEXT,
                    slug: 'text-summarizer',
                    title: 'Text Summarizer',
                    shortDescription: 'Generate concise summaries of long text.',
                    icon: 'FaAlignJustify',
                    template: templates.TextToolTemplate,
                    logicLoader: () => import('../../tools/textTools').then(m => ({ default: m.textSummarizer })),
                    props: { resultType: 'text' },
                    keywords: ['text summarization', 'summary', 'condense text'],
                    id: 'tool-text-summarizer',
                    longDescription: 'The Text Summarizer tool helps you create concise and coherent summaries of lengthy articles, documents, or any block of text. By leveraging advanced algorithms, this tool extracts the most important information, allowing you to quickly grasp the main points without reading the entire content. Perfect for students, professionals, and anyone looking to save time.',
                    tags: ['text', 'summarization', 'summary'],
                    isHidden: false,
                    isExperimental: false,
                    handlerPath: 'src/components/tools/TextSummarizerTool.tsx',
                }

]