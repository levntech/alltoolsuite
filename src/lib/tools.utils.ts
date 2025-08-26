// toolsAPI.ts
import { tools } from './config/index';
import { PublicToolConfig, InternalToolConfig, ToolLogic } from '../types/toolTypes';
import { categoryMeta, CategoryMeta } from '../types/categoryMeta';

export function toPublicToolConfig(tool: InternalToolConfig): PublicToolConfig {
  const { logicLoader, synonyms, handlerPath, analyticsKey, ...rest } = tool;
  return rest;
}

export function getPublicTools(): PublicToolConfig[] {
  return tools.map(toPublicToolConfig);
}

const _logicCache = new Map<string, ToolLogic>();
export async function loadToolLogic(tool: InternalToolConfig): Promise<ToolLogic> {
  if (_logicCache.has(tool.id)) return _logicCache.get(tool.id)!;
  const mod = await tool.logicLoader();
  const fn: ToolLogic = mod.default ?? Object.values(mod)[0];
  if (typeof fn !== 'function') throw new Error(`Tool logic not found for ${tool.id}`);
  _logicCache.set(tool.id, fn);
  return fn;
}

export async function runTool(slug: string, ...args: any[]) {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Tool not found: ${slug}`);
  const logic = await loadToolLogic(tool);
  return logic(...args);
}

export interface UICategory extends CategoryMeta {
  tools: Array<Pick<PublicToolConfig, 'id' | 'slug' | 'title' | 'shortDescription' | 'icon'>>;
}

export function buildUICategories(): UICategory[] {
  const publicTools = getPublicTools();
  return categoryMeta.map((cat) => ({
    ...cat,
    tools: publicTools
      .filter((t) => t.category === cat.key && !t.isHidden)
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        shortDescription: t.shortDescription,
        icon: t.icon,
        path: `/${t.slug}`,
      })),
  }));
}

