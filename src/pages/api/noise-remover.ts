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

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   await handleAPIRoute(req, res, async () => {
//     const form = new formidable.IncomingForm({ uploadDir: '/tmp', keepExtensions: true });
//     const formParse = promisify(form.parse.bind(form));

//     const { fields, files } = await formParse(req);
//     const file = files.file as formidable.File;
//     const noiseReductionLevel = Number(fields.noiseReductionLevel);

//     if (!file) {
//       throw new Error('Audio file is required');
//     }
//     if (typeof noiseReductionLevel !== 'number' || noiseReductionLevel < 0 || noiseReductionLevel > 1) {
//       throw new Error('noiseReductionLevel must be a number between 0 and 1');
//     }

//     const inputPath = file.filepath;
//     const noiseProfilePath = `/tmp/noise-profile_${Date.now()}.prof`;
//     const outputPath = `/tmp/denoised_${Date.now()}.wav`;

//     try {
//       await execAsync(`ffmpeg -i "${inputPath}" -vn -ss 0 -t 1 -ac 1 -ar 16000 "${noiseProfilePath}.wav"`);
//       await execAsync(`sox "${noiseProfilePath}.wav" -n noiseprof "${noiseProfilePath}"`);

//       const noiseReductionAmount = noiseReductionLevel * 0.5;
//       await execAsync(`sox "${inputPath}" "${outputPath}" noisered "${noiseProfilePath}" ${noiseReductionAmount}`);

//       const outputData = await fs.readFile(outputPath);
//       const blob = new Blob([outputData], { type: 'audio/wav' });
//       const url = URL.createObjectURL(blob);

//       logger.info('Noise removal successful', { fileSize: file.size, noiseReductionLevel });

//       return {
//         blob: outputData,
//         url,
//         noiseReductionLevel,
//       };
//     } catch (error: any) {
//       logger.error('Noise Remover failed', { error: error.message, fileSize: file.size });
//       throw error;
//     } finally {
//       await fs.unlink(inputPath).catch(() => {});
//       await fs.unlink(noiseProfilePath).catch(() => {});
//       await fs.unlink(`${noiseProfilePath}.wav`).catch(() => {});
//       await fs.unlink(outputPath).catch(() => {});
//     }
//   }, 'Noise Remover');
// }