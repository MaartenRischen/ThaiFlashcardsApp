export class AudioCombiner {
  /**
   * Combine multiple WAV audio buffers into a single WAV file
   * Assumes all inputs are 16kHz, 16-bit, mono WAV files
   */
  static combineWavBuffers(audioBuffers: ArrayBuffer[]): ArrayBuffer {
    const sampleRate = 16000;
    const bitsPerSample = 16;
    const numChannels = 1;
    
    // Skip WAV headers (44 bytes) and extract raw PCM data
    const pcmDataArrays: Int16Array[] = [];
    let totalSamples = 0;

    for (const buffer of audioBuffers) {
      if (buffer.byteLength === 0) continue;
      
      // Check if this is a WAV file (has RIFF header) or raw PCM
      const view = new DataView(buffer);
      let pcmData: Int16Array;
      
      if (buffer.byteLength > 44 && 
          view.getUint32(0, false) === 0x52494646 && // "RIFF"
          view.getUint32(8, false) === 0x57415645) { // "WAVE"
        // This is a WAV file, skip header
        pcmData = new Int16Array(buffer, 44);
      } else {
        // This is raw PCM data (like our silence buffers)
        pcmData = new Int16Array(buffer);
      }
      
      pcmDataArrays.push(pcmData);
      totalSamples += pcmData.length;
    }

    // Create combined PCM data
    const combinedPcm = new Int16Array(totalSamples);
    let offset = 0;
    
    for (const pcmData of pcmDataArrays) {
      combinedPcm.set(pcmData, offset);
      offset += pcmData.length;
    }

    // Create WAV file with proper header
    const wavBuffer = this.createWavFile(combinedPcm, sampleRate, bitsPerSample, numChannels);
    return wavBuffer;
  }

  /**
   * Create a WAV file from PCM data
   */
  private static createWavFile(
    pcmData: Int16Array,
    sampleRate: number,
    bitsPerSample: number,
    numChannels: number
  ): ArrayBuffer {
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.length * bytesPerSample;
    const fileSize = 44 + dataSize; // 44 bytes for WAV header

    // Create buffer for complete WAV file
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // Write WAV header
    let offset = 0;

    // "RIFF" chunk descriptor
    view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
    view.setUint32(offset, fileSize - 8, true); offset += 4; // File size - 8
    view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"

    // "fmt " sub-chunk
    view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
    view.setUint32(offset, 16, true); offset += 4; // Subchunk size
    view.setUint16(offset, 1, true); offset += 2; // Audio format (1 = PCM)
    view.setUint16(offset, numChannels, true); offset += 2; // Number of channels
    view.setUint32(offset, sampleRate, true); offset += 4; // Sample rate
    view.setUint32(offset, byteRate, true); offset += 4; // Byte rate
    view.setUint16(offset, blockAlign, true); offset += 2; // Block align
    view.setUint16(offset, bitsPerSample, true); offset += 2; // Bits per sample

    // "data" sub-chunk
    view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
    view.setUint32(offset, dataSize, true); offset += 4; // Data size

    // Write PCM data
    const pcmView = new Int16Array(buffer, offset);
    pcmView.set(pcmData);

    return buffer;
  }
} 