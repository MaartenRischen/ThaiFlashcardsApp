import { azureTTS } from './azure-tts';

// Define interfaces for parameters
interface SpeakParams {
  text: string;
  genderValue: boolean; // Use boolean for gender value: true for Male, false for Female
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

// --- Main TTS Service Object ---
export const ttsService = {
  
  speak: async function({ text, genderValue, onStart, onEnd, onError }: SpeakParams): Promise<void> {
    // Stop any currently playing audio
    this.stop(); 

    try {
      // Call onStart callback
      onStart?.();
      
      // Use Azure TTS
      const voiceGender = genderValue ? 'male' : 'female';
      console.log('Using Azure TTS with', voiceGender, 'voice');
      await azureTTS.speak(text, { voiceGender });
      
      // Call onEnd callback
      onEnd?.();
    } catch (error) {
      console.error('Azure TTS Error:', error);
      
      // Fallback to browser TTS if Azure fails
      console.log('Falling back to Browser TTS due to Azure error');
      this._speakWithBrowserTTS({ text, genderValue, onStart: undefined, onEnd, onError });
    }
  },

  // --- Helper function for Browser TTS (fallback) --- 
  _speakWithBrowserTTS: function({ text, genderValue, onStart: _onStart, onEnd, onError }: SpeakParams): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        console.log('Using Browser TTS');
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            console.warn("Browser voices not loaded yet, attempting to speak anyway...");
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const thaiVoices = voices.filter(v => v.lang.startsWith('th'));
        let targetVoice: SpeechSynthesisVoice | undefined;
        
        // Determine if text requires male or female voice characteristics (for selection)
        if (genderValue) { // Check genderValue (true for Male)
            targetVoice = thaiVoices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('Niwat') || v.name.includes('Kritt'));
        }
        if (!targetVoice && !genderValue) { // Check genderValue (false for Female)
            targetVoice = thaiVoices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Patchara') || v.name.includes('Ayutthaya') || v.name.includes('Kanya'));
        }
        if (!targetVoice && thaiVoices.length > 0) { 
            console.warn('Specific gender voice not found, using first available Thai voice.');
            targetVoice = thaiVoices[0];
        }

        if (targetVoice) {
            utterance.voice = targetVoice;
            console.log('Using browser voice:', targetVoice.name);
        } else {
             // Fallback if no Thai voices found at all
             console.warn('No Thai voices found for browser TTS. Using default lang=th-TH.');
             utterance.lang = 'th-TH'; 
        }

        // Set pitch based on genderValue (for browser TTS fallback)
        if (genderValue) { // Male voice
            utterance.pitch = 0.25; // Two octaves lower
            utterance.rate = 0.95;
            console.log(`Applied pitch: ${utterance.pitch.toFixed(2)}, rate: ${utterance.rate.toFixed(2)} for male voice.`);
        } else { // Female voice
            utterance.pitch = 1.0; // Default pitch
            utterance.rate = 1.0;
            console.log(`Applied pitch: ${utterance.pitch.toFixed(2)}, rate: ${utterance.rate.toFixed(2)} for female voice.`);
        }
        
        utterance.onend = () => {
            console.log('Browser TTS playback finished.');
            onEnd?.();
        };
        utterance.onerror = (event) => {
            console.error('Browser TTS Error:', event.error);
            onError?.(event.error);
        };

        // Cancel any previous speech and speak the new utterance
        window.speechSynthesis.cancel(); 
        window.speechSynthesis.speak(utterance);

    } else {
      // If browser TTS is not supported at all
      const errorMsg = 'TTS not supported (No browser speechSynthesis available)';
      console.error(errorMsg);
      onError?.(new Error(errorMsg));
    }
  },

  // Function to explicitly stop any ongoing playback
  stop: function() {
      // Stop Azure TTS
      azureTTS.stop();

      // Stop Browser TTS playback
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
           if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
               console.log("Attempting to stop Browser TTS playback.");
               window.speechSynthesis.cancel();
           }
      }
  },
  
  // Method to set Azure credentials
  setAzureCredentials: function(key: string, region: string) {
    azureTTS.setCredentials(key, region);
  }
}; 