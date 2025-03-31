import { isBrowser } from './utils';

// Interface for TTS options
export interface TTSOptions {
  text: string;
  voice?: string;
  isMale: boolean;
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

// Interface for TTS providers
export interface TTSProvider {
  speak(options: TTSOptions): Promise<void>;
  cancel(): void;
  getVoices(): Promise<string[]>;
}

// Default browser-based TTS provider
class BrowserTTSProvider implements TTSProvider {
  private speaking = false;
  
  async speak(options: TTSOptions): Promise<void> {
    if (!isBrowser()) return;
    
    const { text, isMale, onStart, onEnd, onError } = options;
    
    try {
      // iOS requires cancelling any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      
      // Get Thai voice if available
      const voices = window.speechSynthesis.getVoices();
      console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
      
      // Try to get gender-specific Thai voice first
      let thaiVoice = null;
      
      // Look for gender-specific voices
      if (isMale) {
        // Try to find a male Thai voice
        thaiVoice = voices.find(voice => 
          voice.lang.includes('th') && 
          (voice.name.toLowerCase().includes('male') || 
           voice.name.toLowerCase().includes('man') ||
           voice.name.toLowerCase().includes('พ') || // Thai male char
           voice.name.toLowerCase().includes('krittin'))
        );
        console.log("Searching for male Thai voice. Found:", thaiVoice ? thaiVoice.name : "None");
      } else {
        // Try to find a female Thai voice
        thaiVoice = voices.find(voice => 
          voice.lang.includes('th') && 
          (voice.name.toLowerCase().includes('female') || 
           voice.name.toLowerCase().includes('woman') ||
           voice.name.toLowerCase().includes('ห') || // Thai female char
           voice.name.toLowerCase().includes('kanya'))
        );
        console.log("Searching for female Thai voice. Found:", thaiVoice ? thaiVoice.name : "None");
      }
      
      // If no gender-specific voice found, fall back to any Thai voice
      if (!thaiVoice) {
        thaiVoice = voices.find(voice => voice.lang.includes('th'));
        console.log("Falling back to default Thai voice. Found:", thaiVoice ? thaiVoice.name : "None");
      }
      
      if (thaiVoice) {
        utterance.voice = thaiVoice;
        console.log("Using voice:", thaiVoice.name);
      } else {
        console.log("No Thai voice found for speaking.");
      }

      // Set up callbacks
      if (onStart) utterance.onstart = onStart;
      
      utterance.onend = () => {
        this.speaking = false;
        if (onEnd) onEnd();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.speaking = false;
        if (onError) onError(event);
      };

      // iOS Safari sometimes needs a delay after cancel
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.speaking = true;
      window.speechSynthesis.speak(utterance);
      
      // iOS Safari sometimes needs a kick to start
      setTimeout(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Speech playback error:', error);
      this.speaking = false;
      if (onError) onError(error);
    }
  }
  
  cancel(): void {
    if (isBrowser()) {
      window.speechSynthesis.cancel();
      this.speaking = false;
    }
  }
  
  async getVoices(): Promise<string[]> {
    if (!isBrowser()) return [];
    
    const voices = window.speechSynthesis.getVoices();
    return voices
      .filter(voice => voice.lang.includes('th'))
      .map(voice => voice.name);
  }
}

// Google Cloud TTS provider (to be implemented with API key)
class GoogleCloudTTSProvider implements TTSProvider {
  private apiKey: string;
  private apiEndpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';
  private audioContext: AudioContext | null = null;
  private audioSource: AudioBufferSourceNode | null = null;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (isBrowser()) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  
  async speak(options: TTSOptions): Promise<void> {
    if (!isBrowser() || !this.audioContext) return;
    
    const { text, isMale, onStart, onEnd, onError } = options;
    
    try {
      // Cancel any current audio
      this.cancel();
      
      // Default to a male voice for Thai if isMale is true, otherwise female
      const voiceName = isMale ? 'th-TH-Standard-B' : 'th-TH-Standard-A';
      
      // Prepare the request body
      const requestBody = {
        input: { text },
        voice: { 
          languageCode: 'th-TH',
          name: voiceName,
          ssmlGender: isMale ? 'MALE' : 'FEMALE'
        },
        audioConfig: { audioEncoding: 'MP3' }
      };
      
      if (onStart) onStart();
      
      // Make the API request
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Google TTS API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Decode the base64 audio content
      const audioContent = responseData.audioContent;
      const audioData = atob(audioContent);
      
      // Convert to ArrayBuffer
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      // Decode the audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Create and play the source
      this.audioSource = this.audioContext.createBufferSource();
      this.audioSource.buffer = audioBuffer;
      this.audioSource.connect(this.audioContext.destination);
      
      // Set up callbacks
      if (onEnd) {
        this.audioSource.onended = onEnd;
      }
      
      this.audioSource.start(0);
      
    } catch (error) {
      console.error('Google Cloud TTS error:', error);
      if (onError) onError(error);
    }
  }
  
  cancel(): void {
    if (this.audioSource) {
      try {
        this.audioSource.stop();
        this.audioSource.disconnect();
        this.audioSource = null;
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  }
  
  async getVoices(): Promise<string[]> {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${this.apiKey}`);
      if (!response.ok) {
        throw new Error(`Failed to get voices: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.voices
        .filter((voice: any) => voice.languageCodes.includes('th-TH'))
        .map((voice: any) => voice.name);
    } catch (error) {
      console.error('Error getting Google TTS voices:', error);
      return [];
    }
  }
}

// Main TTS Service that manages providers
class TTSService {
  private providers: { [key: string]: TTSProvider } = {};
  private currentProvider: string = 'browser';
  
  constructor() {
    // Always initialize the browser provider as fallback
    this.providers.browser = new BrowserTTSProvider();
  }
  
  // Initialize Google Cloud provider with API key
  initGoogleCloudTTS(apiKey: string): void {
    this.providers.googleCloud = new GoogleCloudTTSProvider(apiKey);
  }
  
  // Set the current provider to use
  useProvider(providerName: string): void {
    if (this.providers[providerName]) {
      this.currentProvider = providerName;
    } else {
      console.error(`Provider ${providerName} not initialized`);
    }
  }
  
  // Get the current provider
  getProvider(): TTSProvider {
    return this.providers[this.currentProvider] || this.providers.browser;
  }
  
  // Convenience methods that delegate to the current provider
  async speak(options: TTSOptions): Promise<void> {
    return this.getProvider().speak(options);
  }
  
  cancel(): void {
    this.getProvider().cancel();
  }
  
  async getVoices(): Promise<string[]> {
    return this.getProvider().getVoices();
  }
}

// Export singleton instance
export const ttsService = new TTSService();

// Export function to initialize the service with API key
export function initTTSService(googleCloudApiKey?: string): void {
  if (googleCloudApiKey) {
    ttsService.initGoogleCloudTTS(googleCloudApiKey);
    ttsService.useProvider('googleCloud');
  }
} 