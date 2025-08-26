import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tools } from '../src/lib/config/index';


type ToolPublic = {
  id: string;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  tags: string[];
};

const publicIndex: ToolPublic[] = tools
  .filter(t => !t.isHidden) // hide internal/experimental
  .map(t => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    category: t.category,
    shortDescription: t.shortDescription,
    tags: t.tags,
  }));

const out = join(process.cwd(), 'public', 'tools-public.json');
writeFileSync(out, JSON.stringify(publicIndex), 'utf-8');
console.log(`Wrote ${publicIndex.length} tools → ${out}`);
