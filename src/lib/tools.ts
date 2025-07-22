import {caseConverter} from '../tools/textTools';
import {metaTagGenerator} from '../tools/seoTools';
import {keywordDensity} from '../tools/seoTools';


export const templates = {
  TextToolTemplate: 'TextToolTemplate',
  FileToolTemplate: 'FileToolTemplate',
  ImageToolTemplate: 'ImageToolTemplate',
  ConverterToolTemplate: 'ConverterToolTemplate',
  GeneratorToolTemplate: 'GeneratorToolTemplate',
  AnalyzerToolTemplate: 'AnalyzerToolTemplate',
  InteractiveToolTemplate: 'InteractiveToolTemplate',
};

// Tool Config Interface
export interface ToolConfig {
  category: string;
  slug: string;
  title: string;
  desc: string;
  icon: string;
  template: string;
  logic: (...args: any[]) => any;
  props?: Record<string, any>;
  keywords: string[];
}

export const tools: ToolConfig[] = [
    {
            category: 'text-tools',
            slug: 'case-converter',
            title: 'Case Converter',
            desc: 'Convert text between upper/lower/camel case.',
            icon: 'FaFont',
            template: templates.TextToolTemplate,
            logic: caseConverter,
            props: { resultType: 'text' },
            keywords: ['text tools', 'convert case', 'upper lower camel'],
          },

          {
                category: 'seo-tools',
                slug: 'meta-tag-generator',
                title: 'Meta Tag Generator',
                desc: 'Generate SEO-optimized meta tags.',
                icon: 'FaSearch',
                template: templates.TextToolTemplate,
                logic: metaTagGenerator,
                props: { resultType: 'text' },
                keywords: ['meta tags', 'seo', 'generator'],
              },
              {
                category: 'seo-tools',
                slug: 'keyword-density',
                title: 'Keyword Density',
                desc: 'Analyze keyword frequency in your text.',
                icon: 'FaChartBar',
                template: templates.TextToolTemplate,
                logic: keywordDensity,
                props: { resultType: 'table' },
                keywords: ['keyword density', 'seo', 'text analysis'],
              },
]
