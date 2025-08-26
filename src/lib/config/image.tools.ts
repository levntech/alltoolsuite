import { InternalToolConfig } from "@/types/toolTypes";
import { categories } from '../../types/categories';
import { templates } from './templates';

export const securityTools: InternalToolConfig[] = [
  {
                  category: categories.IMAGE,
                  slug: 'meta-tag-generator',
                  title: 'Meta Tag Generator',
                  shortDescription: 'Generate SEO-optimized meta tags.',
                  icon: 'FaSearch',
                  template: templates.TextToolTemplate,
                  logicLoader: () => import('../../tools/seoTools').then(m => ({ default: m.metaTagGenerator })),
                  props: { resultType: 'text' },
                  keywords: ['meta tags', 'seo', 'generator'],
                  id: 'tool-meta-tag-generator',
                  longDescription: 'The Meta Tag Generator tool helps you create effective meta titles and descriptions that improve your website\'s SEO. By providing a few keywords and a brief description of your page, this tool generates optimized meta tags that can enhance your search engine rankings and attract more visitors.',
                  tags: ['seo', 'meta tags', 'optimization'],
                  isHidden: false,
                  isExperimental: false,
                  handlerPath: 'src/components/tools/MetaTagGeneratorTool.tsx',
                },


]