/* mp3CutterWorker.ts */
/* Web Worker for offloading MP3 cutting to a separate thread */

// Utility to convert AudioBuffer to WAV format
import { audioBufferToWav } from '../utils/audioUtils';

  // Worker message handler
  self.onmessage = async (e: MessageEvent) => {
    const { fileData, startTime, endTime } = e.data;

    try {
      const context = new AudioContext();
      const audioBuffer = await context.decodeAudioData(fileData);

      const duration = audioBuffer.duration;
      if (startTime >= duration || endTime > duration) {
        throw new Error(`MP3 Cutter: Start time (${startTime}s) or end time (${endTime}s) exceeds audio duration (${duration}s)`);
      }

      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const newLength = endSample - startSample;

      const newBuffer = context.createBuffer(
        audioBuffer.numberOfChannels,
        newLength,
        sampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const newChannelData = newBuffer.getChannelData(channel);
        for (let i = 0; i < newLength; i++) {
          newChannelData[i] = channelData[startSample + i];
          if (i % 100000 === 0) {
            self.postMessage({ progress: (i / newLength) * 100 });
          }
        }
      }

      const wavBuffer = audioBufferToWav(newBuffer);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      self.postMessage({
        blob,
        url,
        duration: endTime - startTime,
      });

      await context.close();
    } catch (error: any) {
      self.postMessage({ error: error.message });
    }
  };