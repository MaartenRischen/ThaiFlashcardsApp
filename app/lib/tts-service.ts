import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandInput, LanguageCode, VoiceId, Engine } from "@aws-sdk/client-polly";

// Define interfaces for parameters
interface SpeakParams {
  text: string;
  isMale: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

// Module-level variables for state
let pollyClient: PollyClient | null = null;
let audioContext: AudioContext | null = null;
let currentAudioSource: AudioBufferSourceNode | null = null; // To manage playback cancellation
let isAwsInitializedInternal = false; // Internal flag for initialization status

// Function to initialize AWS Polly client (V3) if credentials are available
function initAwsPollyV3(): boolean {
  // Prevent execution on server side
  if (typeof window === 'undefined') {
      return false;
  }

  const accessKeyId = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;
  const region = process.env.NEXT_PUBLIC_AWS_REGION;

  if (accessKeyId && secretAccessKey && region) {
    try {
      // V3 uses credential object directly in client config
      pollyClient = new PollyClient({
        region: region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        }
      });
      console.log('AWS SDK V3 PollyClient Initialized. Region:', region);
      return true; // Indicate success
    } catch (error) {
      console.error("Failed to initialize AWS SDK V3 PollyClient:", error);
      pollyClient = null; // Ensure client is null on failure
      return false; // Indicate failure
    }
  } else {
    console.log('AWS Polly credentials not found. Falling back to browser TTS.');
    pollyClient = null;
    return false; // Indicate AWS is not initialized
  }
}

// Function to lazily initialize and get the AudioContext
function getAudioContext(): AudioContext | null {
    // Prevent execution on server side and ensure AudioContext is available
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("AudioContext not supported:", e);
                return null;
            }
        }
        // Resume context if suspended (required after user interaction in some browsers)
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(err => console.error('Failed to resume AudioContext:', err));
        }
        return audioContext;
    } else {
        console.error('AudioContext not supported or not in browser environment.');
        return null;
    }
}

// --- Main TTS Service Object ---
export const ttsService = {
  
  // Call this once from the client-side, e.g., in a top-level component's useEffect
  initialize: function() {
    if (!isAwsInitializedInternal) { 
        isAwsInitializedInternal = initAwsPollyV3(); // Use V3 initializer
    }
  },

  speak: async function({ text, isMale, onStart, onEnd, onError }: SpeakParams): Promise<void> {
    this.initialize(); 
    
    // ********************************************************************
    // NOTE: After extensive testing, AWS Polly access for Thai language and
    // Thai voices (Niwat, Patchara) appears to be limited on this account.
    // Therefore, we're defaulting to browser TTS for Thai text. To enable
    // AWS Polly for Thai in the future, you would need to:
    // 1. Verify your AWS account has access to Thai voices
    // 2. Check AWS Service Quotas for Polly
    // 3. Contact AWS Support if needed
    // ********************************************************************
    
    // Get AudioContext ready (might be needed for future non-Thai Polly use)
    const localAudioContext = getAudioContext();
    
    // Stop any currently playing audio
    this.stop(); 

    // Try to resume AudioContext in case needed for future use
    if (localAudioContext && localAudioContext.state === 'suspended') {
        try {
            await localAudioContext.resume();
        } catch (resumeError) {
            console.error('Failed to resume AudioContext:', resumeError);
        }
    }

    // --- AWS Polly Path (V3) for non-Thai languages (disabled for Thai) ---
    // The commented code below could be reactivated for non-Thai languages
    // or if AWS Polly access to Thai voices is enabled on the account
    /*
    if (isAwsInitializedInternal && pollyClient && localAudioContext) {
      // AWS Polly implementation (currently disabled for Thai)
      // See previous code for full implementation
    }
    else 
    */
    
    // --- Browser TTS Fallback (currently used as primary for Thai) ---
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        console.log('Using Browser TTS for Thai text.');
        onStart?.();

        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            console.warn("Browser voices not loaded yet, attempting to speak anyway...");
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const thaiVoices = voices.filter(v => v.lang.startsWith('th'));
        let targetVoice: SpeechSynthesisVoice | undefined;

        if (isMale) {
            // Look for male name clues (no reliable gender property)
            targetVoice = thaiVoices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('Niwat'));
        }
        if (!targetVoice && !isMale) { // If male not found OR we want female
            targetVoice = thaiVoices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Patchara'));
        }
        if (!targetVoice && thaiVoices.length > 0) { // Fallback to first available Thai voice
            targetVoice = thaiVoices[0];
        }

        if (targetVoice) {
            utterance.voice = targetVoice;
            console.log('Using browser voice:', targetVoice.name);
        } else {
             console.warn('No specific Thai voice found for browser TTS. Using default for th-TH.');
             utterance.lang = 'th-TH';
        }

        utterance.onend = () => {
            console.log('Browser TTS playback finished.');
            onEnd?.();
        };
        utterance.onerror = (event) => {
            console.error('Browser TTS Error:', event.error);
            onError?.(event.error);
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);

    } else {
      const errorMsg = 'TTS not supported (No browser speechSynthesis available)';
      console.error(errorMsg);
      onError?.(new Error(errorMsg));
    }
  },

  // Function to explicitly stop any ongoing playback initiated by this service
  stop: function() {
      // Stop AWS Polly playback (kept for potential future use)
      if (currentAudioSource) {
          try {
            console.log("Attempting to stop AWS Polly playback.");
            currentAudioSource.onended = null; 
            currentAudioSource.stop();
          } catch(e) {
              // Ignore errors if already stopped
          }
          currentAudioSource = null;
      }
      // Stop Browser TTS playback
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
           if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
               console.log("Attempting to stop Browser TTS playback.");
               window.speechSynthesis.cancel();
           }
      }
  }
}; 