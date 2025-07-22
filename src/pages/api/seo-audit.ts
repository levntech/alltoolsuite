import { NextApiRequest, NextApiResponse } from 'next';
import { seoAuditTool } from '@/tools/seoTools'; // Adjust path based on your project structure
import { handleAPIRoute } from '@/utils/apiUtils'; // Adjust path based on your project structure

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await handleAPIRoute(req, res, async (body) => {
    const { url } = body;
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }
    return await seoAuditTool(url);
  }, 'SEO Audit');
}