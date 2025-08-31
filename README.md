## Funny Loading Videos (Donkey + Bridge)

The app can show short funny videos during preload. Videos are fetched from a Supabase public bucket (`funny-videos`). A local fallback is included.

Endpoints:

- `GET /api/funny-videos/random` — return a random video URL from the bucket or fallback.
- `POST /api/funny-videos/generate` — store a remote MP4 in the bucket.
- `POST /api/funny-videos/cron` — secured by `Authorization: Bearer <CRON_SECRET_KEY>`, generates 1–2 new videos via OpenRouter and stores them.

Environment variables required:

- `OPENROUTER_API_KEY` — OpenRouter API key
- `OPENROUTER_BASE_URL` — optional, defaults to `https://openrouter.ai/api/v1`
- `OPENROUTER_VIDEO_MODEL` — optional, defaults to `luma/dream-machine`
- `CRON_SECRET_KEY` — token to authorize scheduled cron calls
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — for Supabase storage
- `FUNNY_VIDEOS_BUCKET` — optional, defaults to `funny-videos`

Railway cron example (weekly):

```
curl -X POST https://<domain>/api/funny-videos/cron \
  -H "Authorization: Bearer $CRON_SECRET_KEY"
```

# Thai Flashcards App

A modern web application for learning Thai vocabulary through flashcards.

Last updated: 2025-07-09 06:45 UTC

## Features

- Interactive flashcard learning system
- Spaced repetition algorithm
- Beautiful neumorphic design
- Mobile-responsive interface
- AI-powered set generation
- Custom placeholder images
- Progress tracking
