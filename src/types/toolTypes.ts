// toolTypes.ts
import { Category } from './categories';

export interface PublicToolConfig {
  category: Category;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  template: string;
  keywords: string[];
  id: string;
  tags: string[];
  isHidden: boolean;
  isExperimental: boolean;
  minPlan?: 'free' | 'pro' | 'enterprise';
  weight?: number;
  props?: {
    inputType?: 'text' | 'file' | 'image' | 'json';
    resultType?: 'text' | 'table' | 'image' | 'json';
    [k: string]: any;
  };
  analyticsKey?: string;
  handlerPath?: string;
  [k: string]: any;

}

export type ToolLogic = (...args: any[]) => any | Promise<any>;

export interface InternalToolConfig extends PublicToolConfig {
  logicLoader: () => Promise<any>;
  synonyms?: string[];
  handlerPath?: string;
  analyticsKey?: string;
}
