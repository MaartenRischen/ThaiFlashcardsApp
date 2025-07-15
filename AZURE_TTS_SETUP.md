# Azure TTS Setup Guide

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

## Usage

Once configured, the app will automatically use Azure TTS for all voice synthesis. The service will:
- Use male voice (Niwat) when gender toggle is set to male
- Use female voice (Premwadee) when gender toggle is set to female
- Fall back to browser TTS if Azure TTS fails

## Troubleshooting

### Verifying Your Azure Credentials

If you're getting authentication errors, verify your credentials:

1. **Test your API key**:
   ```bash
   curl -X POST "https://YOUR_REGION.api.cognitive.microsoft.com/sts/v1.0/issueToken" \
     -H "Ocp-Apim-Subscription-Key: YOUR_API_KEY" \
     -H "Content-type: application/x-www-form-urlencoded" \
     -H "Content-Length: 0"
   ```
   
   Replace `YOUR_REGION` with your region (e.g., `eastus`) and `YOUR_API_KEY` with your key.
   
   If successful, you'll receive a token. If not, you'll see an error message.

2. **Common issues**:
   - **401 Error**: Invalid API key or wrong region
   - **403 Error**: Subscription expired or quota exceeded
   - **WebSocket 1006 Error**: Usually indicates authentication failure

3. **Verify your region**: Make sure the region in your code matches the region where your Azure Speech resource was created.

### Getting Your Azure Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Speech Service resource
3. Click on "Keys and Endpoint" in the left sidebar
4. You'll see:
   - **Location/Region**: This is your region (e.g., "East US" = "eastus")
   - **KEY 1** or **KEY 2**: Either key will work

Make sure to use the exact region identifier (lowercase, no spaces) that matches your resource location.

## Benefits over ElevenLabs

- **Native Thai voices**: Designed specifically for Thai language
- **Better pronunciation**: Handles Thai tones and phonemes correctly
- **No English accent**: Pure Thai pronunciation
- **Reliable**: Microsoft's infrastructure with good uptime

## Fallback

If Azure fails for any reason, the app automatically falls back to browser TTS. 