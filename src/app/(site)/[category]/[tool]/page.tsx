import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { tools } from '@/lib/tools'
import ToolLayout from '@/components/layout/ToolLayout';

// Dynamically import templates
const templateImports: { [key: string]: () => Promise<any> } = {
  TextToolTemplate: () => import('@/components/templates/TextToolTemplate'),
  FileToolTemplate: () => import('@/components/templates/FileToolTemplate'),
  // Add other templates as needed...
};

export async function generateMetadata({ params }: { params: { category: string; tool: string } }) {
  const tool = tools.find(t => t.slug === params.tool);
  if (!tool) return { title: 'Tool Not Found - AIOtoolSuite' };
  return {
    title: `${tool.title} - AIOtoolSuite`,
    description: tool.desc,
    keywords: tool.keywords.join(', '),
  };
}

export default async function ToolPage({ params }: { params: { category: string; tool: string } }) {
  const tool = tools.find(t => t.slug === params.tool);
  if (!tool) return notFound();

  // Validate that the category matches (optional, for URL consistency)
  if (tool.category !== params.category) return notFound();

  // Define a generic type for template props
  type TemplateProps = {
    title: string;
    onSubmit?: (input: any) => any;
    onProcess?: (input: any) => any;
    [key: string]: any;
  };

  // Dynamically import the template and cast to the correct type
  const Template = dynamic<TemplateProps>(
    templateImports[tool.template] || (() => Promise.resolve(() => <div>Template Not Found</div>))
  );

  // Pass the logic as onSubmit or onProcess based on the template
  const templateProps: TemplateProps = {
    title: tool.title,
    ...(tool.template === 'TextToolTemplate' ? { onSubmit: tool.logic } : {}),
    ...(tool.template === 'FileToolTemplate' ? { onProcess: tool.logic } : {}),
    ...tool.props,
  };

  return (
    <ToolLayout title={tool.title} desc={tool.desc}>
      <Template {...templateProps} />
    </ToolLayout>
  );
}