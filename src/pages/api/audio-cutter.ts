import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { handleAPIRoute } from '@/utils/apiUtils';
import { createLogger, transports, format } from 'winston';

// Logger setup for server-side logging
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

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   await handleAPIRoute(req, res, async () => {
//     const form = new formidable.IncomingForm({ uploadDir: '/tmp', keepExtensions: true });
//     const formParse = promisify(form.parse.bind(form));

//     const { fields, files } = await formParse(req);
//     if (!files || !files.file) {
//       throw new Error('Audio file is required');
//     }
//     const file = files.file as formidable.File;
//     const startTime = Number(fields.startTime);
//     const endTime = Number(fields.endTime);

//     if (!file) {
//       throw new Error('Audio file is required');
//     }
//     if (typeof startTime !== 'number' || typeof endTime !== 'number' || startTime < 0 || endTime <= startTime) {
//       throw new Error('Invalid startTime or endTime. Both must be numbers, startTime >= 0, and endTime > startTime');
//     }

//     const inputPath = file.filepath;
//     const outputPath = `/tmp/trimmed_${Date.now()}.wav`;

//     try {
//       await execAsync(`ffmpeg -i "${inputPath}" -ss ${startTime} -to ${endTime} -c:a pcm_s16le "${outputPath}"`);

//       const outputData = await fs.readFile(outputPath);
//       const blob = new Blob([outputData], { type: 'audio/wav' });
//       const url = URL.createObjectURL(blob);

//       logger.info('Audio cut successfully', { fileSize: file.size, startTime, endTime });

//       return {
//         blob: outputData,
//         url,
//         duration: endTime - startTime,
//       };
//     } catch (error: any) {
//       logger.error('Audio Cutter failed', { error: error.message, fileSize: file.size });
//       throw error;
//     } finally {
//       await fs.unlink(inputPath).catch(() => {});
//       await fs.unlink(outputPath).catch(() => {});
//     }
//   }, 'Audio Cutter');
// }