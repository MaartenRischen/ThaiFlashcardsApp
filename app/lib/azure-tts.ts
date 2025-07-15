import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

// Azure Speech Service configuration
// IMPORTANT: Update these values with your actual Azure Speech Service credentials
// Get them from Azure Portal > Your Speech Resource > Keys and Endpoint
const AZURE_SPEECH_KEY = 'CKUt0UglFFtkn96zA1lWcG1EUTS2Y4NAS6edR0QL6tcDBuVxrdYlJQQJ99BGACqBBLyXJ3w3AAAEACOGih5x';
const AZURE_SPEECH_REGION = 'southeastasia'; // Make sure this matches your resource's region

// Thai voice options from Azure
// See: https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=tts
export const AZURE_THAI_VOICES = {
  male: {
    'Niwat': 'th-TH-NiwatNeural', // Thai male voice
    'Achara': 'th-TH-AcharaNeural', // Thai female voice (for comparison)
  },
  female: {
    'Premwadee': 'th-TH-PremwadeeNeural', // Thai female voice
    'Achara': 'th-TH-AcharaNeural', // Another Thai female voice option
  }
};

// Voice settings
const DEFAULT_VOICES = {
  male: 'th-TH-NiwatNeural',
  female: 'th-TH-PremwadeeNeural'
};

interface AzureTTSOptions {
  voiceName?: string;
  rate?: number; // -50% to +50%
  pitch?: number; // -50% to +50%
  volume?: number; // 0 to 100
}

class AzureTTS {
  private speechConfig: sdk.SpeechConfig | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Azure Speech SDK
   */
  private initialize(): void {
    console.log('Azure TTS: Starting initialization...');
    console.log('Azure TTS: Using region:', AZURE_SPEECH_REGION);
    console.log('Azure TTS: Key length:', AZURE_SPEECH_KEY ? AZURE_SPEECH_KEY.length : 0);
    
    try {
      this.speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
      
      // Set speech synthesis output format
      this.speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
      
      // Set default language
      this.speechConfig.speechSynthesisLanguage = 'th-TH';
      
      this.isInitialized = true;
      console.log('Azure TTS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure TTS:', error);
    }
  }

  /**
   * Set Azure credentials (for runtime configuration)
   */
  setCredentials(key: string, region: string): void {
    AZURE_SPEECH_KEY !== key && console.log('Updating Azure Speech key');
    AZURE_SPEECH_REGION !== region && console.log('Updating Azure Speech region');
    
    this.speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    this.speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    this.speechConfig.speechSynthesisLanguage = 'th-TH';
    this.isInitialized = true;
  }

  /**
   * Converts text to speech using Azure
   */
  async speak(
    text: string,
    options?: { voiceGender?: 'male' | 'female'; rate?: number }
  ): Promise<void> {
    console.log('Azure TTS speak called with:', { text, options });
    if (!this.isInitialized || !this.speechConfig) {
      console.error('Azure TTS not initialized, throwing error to trigger fallback');
      throw new Error('Azure TTS not initialized');
    }

    try {
      // Stop any currently playing audio
      this.stop();

      // Select voice based on gender
      const voiceName = options?.voiceGender === 'female' ? DEFAULT_VOICES.female : DEFAULT_VOICES.male;
      
      console.log('Azure TTS - Speaking:', {
        text: text.substring(0, 50) + '...',
        voiceName,
        gender: options?.voiceGender || 'male',
        rate: options?.rate
      });

      // Create SSML for advanced control
      const ssml = this.createSSML(text, voiceName, { rate: options?.rate });
      console.log('Azure TTS SSML:', ssml);
      
      // Create synthesizer with audio output
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, audioConfig);
      console.log('Azure TTS: Synthesizer created, starting speech...');

      return new Promise((resolve, reject) => {
        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            console.log('Azure TTS success result:', {
              reason: result.reason,
              reasonString: sdk.ResultReason[result.reason],
              errorDetails: result.errorDetails
            });
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              console.log('Azure TTS synthesis completed successfully');
              resolve();
            } else {
              console.error('Azure TTS synthesis failed:', {
                reason: sdk.ResultReason[result.reason],
                errorDetails: result.errorDetails
              });
              reject(new Error(result.errorDetails || 'Azure TTS synthesis failed'));
            }
            synthesizer.close();
          },
          (error) => {
            console.error('Azure TTS error callback:', error);
            synthesizer.close();
            reject(error);
          }
        );
      });

    } catch (error) {
      console.error('Azure TTS Error:', error);
      throw error;
    }
  }

  /**
   * Create SSML for speech synthesis
   */
  private createSSML(text: string, voiceName: string, options: AzureTTSOptions): string {
    const rate = options.rate !== undefined ? `${options.rate > 0 ? '+' : ''}${options.rate}%` : '+0%';
    const pitch = options.pitch !== undefined ? `${options.pitch > 0 ? '+' : ''}${options.pitch}%` : '+0%';
    const volume = options.volume !== undefined ? options.volume : 100;

    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="th-TH">
        <voice name="${voiceName}">
          <prosody rate="${rate}" pitch="${pitch}" volume="${volume}">
            ${this.escapeXML(text)}
          </prosody>
        </voice>
      </speak>
    `;
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Stops any currently playing audio
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Get list of available Thai voices
   */
  async getVoices(): Promise<string[]> {
    // Azure doesn't provide a dynamic voice list API in the SDK
    // Return our known Thai voices
    return [
      'th-TH-NiwatNeural',
      'th-TH-PremwadeeNeural', 
      'th-TH-AcharaNeural'
    ];
  }

  /**
   * Test if Azure TTS is properly configured
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.speak('ทดสอบ', { voiceGender: 'male' });
      return true;
    } catch (error) {
      console.error('Azure TTS test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const azureTTS = new AzureTTS();

// Export voice options
export { DEFAULT_VOICES }; 