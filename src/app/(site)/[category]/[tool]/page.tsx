// app/[category]/[tool]/page.tsx
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { tools } from "@/lib/config/index";
import ToolLayout from "@/components/layout/ToolLayout";
import CaseConverterTool from "@/components/tools/CaseConverterTool";

// // Map templates to dynamic client imports
// const clientTemplateImports: { [key: string]: () => Promise<any> } = {
//   TextToolTemplate: () => import('@/components/templates/TextToolTemplate'),
//   FileToolTemplate: () => import('@/components/templates/ConvertToolTemplate'),
//   // Add other templates here as needed
// };

// export async function generateMetadata({ params }: { params: { category: string; tool: string } }) {
//   const tool = tools.find(t => t.slug === params.tool);
//   if (!tool) return { title: 'Tool Not Found - AIOtoolSuite' };

//   return {
//     title: `${tool.title} - AIOtoolSuite`,
//     description: tool.shortDescription,
//     keywords: tool.keywords.join(', '),
//     openGraph: {
//       title: `${tool.title} - AIOtoolSuite`,
//       description: tool.shortDescription,
//       url: `https://aiotoolsuite.com/${tool.category}/${tool.slug}`,
//       siteName: 'AIOtoolSuite',
//       images: [
//         {
//           url: `https://aiotoolsuite.com/og-images/${tool.slug}.png`,
//           width: 1200,
//           height: 630,
//           alt: tool.title,
//         },
//       ],
//       locale: 'en_US',
//       type: 'website',
//     },
//     twitter: {
//       card: 'summary_large_image',
//       title: `${tool.title} - AIOtoolSuite`,
//       description: tool.shortDescription,
//       images: [`https://aiotoolsuite.com/og-images/${tool.slug}.png`],
//     },
//     metadataBase: new URL('https://aiotoolsuite.com'),
//     alternates: { canonical: `/${tool.category}/${tool.slug}`

//   }

// }
// }

// export default async function ToolPage({ params }: { params: { category: string; tool: string } }) {
//   const tool = tools.find(t => t.slug === params.tool);
//   if (!tool) return notFound();

//   if (tool.category !== params.category) return notFound();

//   // Dynamically import template as a Client Component
//   const Template = dynamic(
//     clientTemplateImports[tool.template] || (() => Promise.resolve(() => <div>Template Not Found</div>)),
//     { ssr: false } // ensures this component runs in browser only
//   );

//   // Prepare props for the template
//   const templateProps: Record<string, any> = {
//     title: tool.title,
//     ...(tool.template === 'TextToolTemplate' ? { onSubmit: tool.logicLoader } : {}),
//     ...(tool.template === 'FileToolTemplate' ? { onProcess: tool.logicLoader } : {}),
//     ...tool.props,
//   };

//   return (

//     <ToolLayout title={tool.title} desc={tool.shortDescription} tool={tool}>
//       <Template {...templateProps} />

//     </ToolLayout>
//   );
// }

export default function ToolPage() {
  return <CaseConverterTool />;
}
