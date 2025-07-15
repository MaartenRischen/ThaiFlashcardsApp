import axios from 'axios';

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = 'sk_f0ac632fde79f0d958d394e8fb21e6b9cf2f882843059fc1';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs for Thai-suitable voices
// You can explore more voices at https://elevenlabs.io/voice-library
const VOICE_IDS = {
  male: 'pNInz6obpgDQGcFmaJgB', // Adam - Deep, clear male voice
  female: '21m00Tcm4TlvDq8ikWAM', // Rachel - Clear female voice
};

// Alternative voice options (if you want to try different ones)
const ALTERNATIVE_VOICES = {
  male: {
    'Antoni': 'ErXwobaYiN019PkySvjV', // Well-rounded male voice
    'Arnold': 'VR6AewLTigWG4xSOukaG', // Strong, assertive male voice
    'Callum': 'N2lVS1w4EtoT3dr4eOWO', // Hoarse male voice
    'Charlie': 'IKne3meq5aSn9XLyUdCD', // Casual male voice
    'Clyde': '2EiwWnXFnvU5JabPnv8n', // War veteran voice
    'Daniel': 'onwK4e9ZLuTAKqWW03F9', // British-accented male
    'Dave': 'CYw3kZ02Hs0563khs1Fj', // British male voice
    'Drew': '29vD33N1CtxCmqQRPOHJ', // Well-rounded male
    'Ethan': 'g5CIjZEefAph4nQFvHAz', // American male
    'Fin': 'D38z5RcWu1voky8WS1ja', // Irish male
    'Freya': 'jsCqWAovK2LkecY7zXl4', // American female
    'George': 'JBFqnCBsd6RMkjVDRZzb', // British male
  },
  female: {
    'Bella': 'EXAVITQu4vr4xnSDxMaL', // Soft female voice
    'Dorothy': 'ThT5KcBeYPX3keUQqHPh', // British female
    'Elli': 'MF3mGyEYCl7XYWbV9V6O', // American female
    'Emily': 'LcfcDJNUP1GQjkzn1xUU', // American female
    'Glinda': 'z9fAnlkpzviPz146aGWa', // American female witch
    'Grace': 'oWAxZDx7w5VEj9dCyTzz', // American Southern female
    'Jessie': 't0jbNlBVZ17f02VDIeMI', // Raspy old female
    'Matilda': 'XrExE9yKIg1WjnnlVkGX', // American female
    'Nicole': 'piTKgcLEGmPE4e6mEKli', // Whispery female
    'Serena': 'pMsXgVXv3BLzUgSXRplE', // Middle-aged British female
  }
};

interface ElevenLabsTTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

interface Voice {
  voice_id: string;
  name: string;
  samples: null;
  category: string;
  fine_tuning: {
    model_id: string;
    is_allowed_to_fine_tune: boolean;
    fine_tuning_requested: boolean;
    finetuning_state: string;
    verification_attempts: null;
    verification_failures: string[];
    verification_attempts_count: number;
    slice_ids: null;
    manual_verification: null;
    manual_verification_requested: boolean;
  };
  labels: Record<string, string>;
  description: null;
  preview_url: string;
  available_for_tiers: string[];
  settings: null;
  sharing: null;
  high_quality_base_model_ids: string[];
}

interface SubscriptionInfo {
  tier: string;
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
  voice_limit: number;
  max_voice_add_edits: number;
  voice_add_edit_counter: number;
  professional_voice_limit: number;
  can_extend_voice_limit: boolean;
  can_use_instant_voice_cloning: boolean;
  can_use_professional_voice_cloning: boolean;
  currency: string;
  status: string;
  billing_period: string;
  character_refresh_period: string;
  next_invoice: {
    amount_due_cents: number;
    next_payment_attempt_unix: number;
  };
  has_open_invoices: boolean;
}

class ElevenLabsTTS {
  private audioQueue: HTMLAudioElement[] = [];
  private currentAudio: HTMLAudioElement | null = null;

  /**
   * Converts text to speech using ElevenLabs API
   */
  async speak(
    text: string,
    isMale: boolean = true,
    options: ElevenLabsTTSOptions = {}
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();

      // Select voice based on gender
      const voiceId = options.voiceId || (isMale ? VOICE_IDS.male : VOICE_IDS.female);

      // Make API request to ElevenLabs
      const response = await axios.post(
        `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: options.modelId || 'eleven_multilingual_v2', // Best for Thai
          voice_settings: {
            stability: options.stability ?? 0.5,
            similarity_boost: options.similarityBoost ?? 0.75,
            style: options.style ?? 0.0,
            use_speaker_boost: options.useSpeakerBoost ?? true,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          responseType: 'arraybuffer',
        }
      );

      // Convert response to audio blob
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio element
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      // Clean up URL when audio ends
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
      });

      // Play the audio
      await audio.play();

      // Return a promise that resolves when audio finishes
      return new Promise((resolve, reject) => {
        audio.addEventListener('ended', () => resolve());
        audio.addEventListener('error', (error) => reject(error));
      });

    } catch (error) {
      console.error('ElevenLabs TTS Error:', error);
      
      // Handle specific error cases
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key');
        } else if (error.response?.status === 422) {
          throw new Error('Invalid request parameters');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded');
        }
      }
      
      throw error;
    }
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
   * Gets available voices from ElevenLabs
   */
  async getVoices(): Promise<Voice[]> {
    try {
      const response = await axios.get<{ voices: Voice[] }>(`${ELEVENLABS_API_URL}/voices`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });
      return response.data.voices;
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return [];
    }
  }

  /**
   * Gets user subscription info (useful for checking limits)
   */
  async getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
    try {
      const response = await axios.get<SubscriptionInfo>(`${ELEVENLABS_API_URL}/user/subscription`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subscription info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const elevenLabsTTS = new ElevenLabsTTS();

// Export voice IDs for reference
export { VOICE_IDS, ALTERNATIVE_VOICES }; 