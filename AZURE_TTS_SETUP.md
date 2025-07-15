# Azure Text-to-Speech Setup Guide

## Quick Setup

1. **Get your Azure credentials** (from the Azure Portal):
   - API Key: Your Speech Service Key 1
   - Region: Your Speech Service region (e.g., "southeastasia")

2. **Update the credentials in the code**:
   
   Edit `app/lib/azure-tts.ts` and replace:
   ```typescript
   const AZURE_SPEECH_KEY = 'YOUR_AZURE_SPEECH_KEY_HERE';
   const AZURE_SPEECH_REGION = 'YOUR_AZURE_REGION_HERE';
   ```
   
   With your actual credentials:
   ```typescript
   const AZURE_SPEECH_KEY = 'your-actual-key-here';
   const AZURE_SPEECH_REGION = 'southeastasia'; // or your region
   ```

3. **Test it**:
   - Run `npm run dev`
   - Open your app
   - Try playing any Thai phrase

## Thai Voices

Azure provides these native Thai voices:
- **Male**: Niwat (th-TH-NiwatNeural) - Natural Thai male voice
- **Female**: Premwadee (th-TH-PremwadeeNeural) - Natural Thai female voice
- **Alternative**: Achara (th-TH-AcharaNeural) - Another Thai female voice

## Troubleshooting

If voices don't work:
1. Check the browser console for errors
2. Verify your API key and region are correct
3. Make sure your Azure Speech Service is active
4. Check if you have quota remaining

## Benefits over ElevenLabs

- **Native Thai voices**: Designed specifically for Thai language
- **Better pronunciation**: Handles Thai tones and phonemes correctly
- **No English accent**: Pure Thai pronunciation
- **Reliable**: Microsoft's infrastructure with good uptime

## Fallback

If Azure fails for any reason, the app automatically falls back to browser TTS. 