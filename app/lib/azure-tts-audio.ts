import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

// Azure Speech Service configuration (same as azure-tts.ts)
const AZURE_SPEECH_KEY = 'CKUt0UglFFtkn96zA1lWcG1EUTS2Y4NAS6edR0QL6tcDBuVxrdYlJQQJ99BGACqBBLyXJ3w3AAAEACOGih5x';
const AZURE_SPEECH_REGION = 'southeastasia';

// Voice configurations
const THAI_VOICES = {
  male: 'th-TH-NiwatNeural',
  female: 'th-TH-PremwadeeNeural'
};

const ENGLISH_VOICES = {
  male: 'en-US-GuyNeural',
  female: 'en-US-JennyNeural'
};

export class AzureTTSAudio {
  private speechConfig: sdk.SpeechConfig;

  constructor() {
    this.speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
    this.speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;
  }

  /**
   * Synthesize speech and return audio data as ArrayBuffer
   */
  async synthesizeToBuffer(
    text: string,
    language: 'thai' | 'english',
    voiceGender: 'male' | 'female',
    speed: number = 1.0  // Add speed parameter (0.5 = half speed, 1 = normal, 2 = double speed)
  ): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      // Select appropriate voice
      let voiceName: string;
      if (language === 'thai') {
        voiceName = voiceGender === 'male' ? THAI_VOICES.male : THAI_VOICES.female;
      } else {
        voiceName = voiceGender === 'male' ? ENGLISH_VOICES.male : ENGLISH_VOICES.female;
      }

      // Convert speed to percentage format for SSML (1.0 = 100%)
      const speedPercent = Math.round(speed * 100);

      // Create SSML with prosody element for speed control
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language === 'thai' ? 'th-TH' : 'en-US'}">
          <voice name="${voiceName}">
            <prosody rate="${speedPercent}%">
              ${this.escapeXml(text)}
            </prosody>
          </voice>
        </speak>
      `;

      console.log(`Synthesizing ${language} audio with ${voiceGender} voice at ${speedPercent}% speed:`, text.substring(0, 50) + '...');

      // Create synthesizer with no audio output (we'll get the data directly)
      const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, null);

      synthesizer.speakSsmlAsync(
        ssml,
        result => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // Get audio data
            const audioData = result.audioData;
            console.log(`Audio synthesized successfully: ${audioData.byteLength} bytes`);
            
            // Convert to ArrayBuffer
            const arrayBuffer = new ArrayBuffer(audioData.byteLength);
            const view = new Uint8Array(arrayBuffer);
            view.set(new Uint8Array(audioData));
            
            synthesizer.close();
            resolve(arrayBuffer);
          } else {
            console.error('Speech synthesis failed:', result.errorDetails);
            synthesizer.close();
            reject(new Error(result.errorDetails || 'Speech synthesis failed'));
          }
        },
        error => {
          console.error('Speech synthesis error:', error);
          synthesizer.close();
          reject(error);
        }
      );
    });
  }

  /**
   * Create silence audio data
   */
  createSilence(durationMs: number, sampleRate: number = 16000): ArrayBuffer {
    const numSamples = Math.floor((durationMs / 1000) * sampleRate);
    const buffer = new ArrayBuffer(numSamples * 2); // 16-bit samples
    // Buffer is already filled with zeros (silence)
    return buffer;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
} 