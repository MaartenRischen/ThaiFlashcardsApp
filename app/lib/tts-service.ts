// Remove AWS imports
// import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandInput, LanguageCode, VoiceId, Engine } from "@aws-sdk/client-polly";

// Define interfaces for parameters
interface SpeakParams {
  text: string;
  genderValue: boolean; // Use boolean for gender value: true for Male, false for Female
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

// Remove AWS-related state variables
// let pollyClient: PollyClient | null = null;
// let audioContext: AudioContext | null = null;
// let currentAudioSource: AudioBufferSourceNode | null = null; // To manage playback cancellation
// let isAwsInitializedInternal = false; // Internal flag for initialization status

// Remove AWS initialization function
/*
function initAwsPollyV3(): boolean {
  // ... implementation removed ...
}
*/

// Remove AudioContext function
/*
function getAudioContext(): AudioContext | null {
    // ... implementation removed ...
}
*/

// --- Main TTS Service Object ---
export const ttsService = {
  
  // Remove initialize method
  /*
  initialize: function() {
    if (!isAwsInitializedInternal) { 
        isAwsInitializedInternal = initAwsPollyV3(); // Use V3 initializer
    }
  },
  */

  speak: async function({ text, genderValue, onStart, onEnd, onError }: SpeakParams): Promise<void> {
    // Remove initialize call
    // this.initialize(); 
    
    // Remove AudioContext logic
    // const localAudioContext = getAudioContext();
    
    // Stop any currently playing audio (from this service)
    this.stop(); 

    // Remove AudioContext resume logic
    /*
    if (localAudioContext && localAudioContext.state === 'suspended') {
        try {
            await localAudioContext.resume();
        } catch (resumeError) {
            console.error('Failed to resume AudioContext:', resumeError);
            // Proceed anyway, playback might still work or fail later
        }
    }
    */

    // Remove entire AWS Polly attempt block
    /*
    if (isAwsInitializedInternal && pollyClient && localAudioContext) {
      // ... AWS Polly try/catch block removed ...
    } else {
      // --- Browser TTS Fallback (if AWS not initialized) ---
      console.log('AWS not initialized or AudioContext not available. Using Browser TTS.');
      this._speakWithBrowserTTS({ text, genderValue, onStart, onEnd, onError });
    }
    */

    // Directly call the Browser TTS method
    console.log('Using Browser TTS.'); // Simplified log message
    this._speakWithBrowserTTS({ text, genderValue, onStart, onEnd, onError });

  },

  // --- Helper function for Browser TTS --- 
  _speakWithBrowserTTS: function({ text, genderValue, onStart, onEnd, onError }: SpeakParams): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // console.log('Using Browser TTS.'); // Log moved to parent speak function
        
        // Call onStart directly (no AWS check needed)
        // if (!isAwsInitializedInternal) { 
            onStart?.(); 
        // }

        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            console.warn("Browser voices not loaded yet, attempting to speak anyway...");
            // Consider adding a small delay and retry for voices?
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const thaiVoices = voices.filter(v => v.lang.startsWith('th'));
        let targetVoice: SpeechSynthesisVoice | undefined;
        
        // Determine if text requires male or female voice characteristics (for selection)
        if (genderValue) { // Check genderValue (true for Male)
            targetVoice = thaiVoices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('Niwat') || v.name.includes('Kritt'));
        }
        if (!targetVoice && !genderValue) { // Check genderValue (false for Female)
            targetVoice = thaiVoices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Patchara') || v.name.includes('Ayutthaya') || v.name.includes('Kanya')); // Added Kanya
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

        // *** Set pitch based on genderValue ***
        if (genderValue) { // Check genderValue (true for Male)
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
            onEnd?.(); // Call original onEnd callback
        };
        utterance.onerror = (event) => {
            console.error('Browser TTS Error:', event.error);
            onError?.(event.error); // Call original onError callback
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

  // Function to explicitly stop any ongoing playback initiated by this service
  stop: function() {
      // Remove AWS Polly stop logic
      /*
      if (currentAudioSource) {
          try {
            console.log("Attempting to stop AWS Polly playback.");
            currentAudioSource.onended = null; // Prevent onEnd callback if manually stopped
            currentAudioSource.stop();
          } catch(e) {
              // Ignore errors if already stopped or node is invalid
              // console.warn("Error stopping Polly source:", e);
          }
          currentAudioSource = null; // Clear the reference
      }
      */

      // Stop Browser TTS playback
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
           if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
               console.log("Attempting to stop Browser TTS playback.");
               window.speechSynthesis.cancel();
           }
      }
  }
}; 