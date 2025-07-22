import { NextApiRequest, NextApiResponse } from 'next';
import { textSummarizer } from '@/tools/textTools'; // Adjust path based on your project structure
import { handleAPIRoute } from '@/utils/apiUtils'; // Adjust path based on your project structure

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await handleAPIRoute(req, res, async (body) => {
    const { text, maxSentences } = body;
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }
    if (maxSentences && (typeof maxSentences !== 'number' || maxSentences <= 0)) {
      throw new Error('maxSentences must be a positive number');
    }
    return await textSummarizer(text, maxSentences);
  }, 'Text Summarizer');
}