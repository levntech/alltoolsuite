import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { handleAPIRoute } from '@/utils/apiUtils';
import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/audio-tools.log' }),
  ],
});

const execAsync = promisify(exec);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await handleAPIRoute(req, res, async () => {
    const form = new formidable.IncomingForm({ uploadDir: '/tmp', keepExtensions: true });
    const formParse = promisify(form.parse.bind(form));

    const { fields, files } = await formParse(req);
    const file = files.file as formidable.File;
    const targetFormat = fields.targetFormat as string;

    if (!file) {
      throw new Error('Audio file is required');
    }
    if (!['mp3', 'wav', 'ogg'].includes(targetFormat)) {
      throw new Error('Unsupported target format. Use "mp3", "wav", or "ogg"');
    }

    const inputPath = file.filepath;
    const outputPath = `/tmp/output_${Date.now()}.${targetFormat}`;

    try {
      await execAsync(`ffmpeg -i "${inputPath}" -c:a ${targetFormat === 'mp3' ? 'libmp3lame' : targetFormat === 'ogg' ? 'libvorbis' : 'pcm_s16le'} "${outputPath}"`);

      const outputData = await fs.readFile(outputPath);
      const blob = new Blob([outputData], { type: `audio/${targetFormat}` });
      const url = URL.createObjectURL(blob);

      logger.info('Audio conversion successful', { fileSize: file.size, targetFormat });

      return {
        blob: outputData,
        url,
        format: targetFormat,
      };
    } catch (error: any) {
      logger.error('Audio Converter failed', { error: error.message, fileSize: file.size });
      throw error;
    } finally {
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
    }
  }, 'Audio Converter');
}