# SFH Routine Video Builder — Frontend

Web app for Senior Fitness Hub. Browse 279 exercise videos, build custom routine playlists, preview branded video storyboards, and generate follow-along MP4 workout videos.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** with custom SFH brand tokens
- **Supabase** — database (exercises, saved routines, video jobs) + storage
- **Railway** — backend video processing server (separate repo)
- **Vercel** — frontend hosting

## Features

- **Exercise Library** — 279 exercises with images, coaching cues, bilateral support
- **Code Prefix Filters** — Filter by exercise code (A, B, CA, HF, etc.)
- **Playlist Builder** — Drag to reorder, search, add/remove exercises
- **Template System** — Paste pre-filled templates with custom coaching cues per routine
- **Storyboard Preview** — Preview all video slides before generating
- **Video Generation** — Send to Railway backend, poll progress, download MP4
- **Saved Routines** — Save and re-export playlists

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/sfh-video-frontend.git
cd sfh-video-frontend
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RAILWAY_URL=https://your-railway-url.railway.app
```

### 3. Run locally

```bash
npm run dev
```

Opens at `http://localhost:5173`

### 4. Build for production

```bash
npm run build
```

Output goes to `dist/` folder.

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select this repo
3. Add the 3 environment variables above
4. Click Deploy — Vercel auto-detects Vite and builds

## Supabase Database

The app requires 3 tables. Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  vimeo_id TEXT,
  download_url TEXT,
  bilateral TEXT DEFAULT 'no',
  duration_minutes FLOAT DEFAULT 1,
  time_display TEXT,
  coaching_cue TEXT,
  full_instruction TEXT,
  category TEXT,
  position_type TEXT,
  main_image_url TEXT,
  left_image_url TEXT,
  right_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  exercise_ids UUID[] NOT NULL,
  total_exercises INT DEFAULT 0,
  estimated_minutes FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE video_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT DEFAULT 'pending',
  routine_label TEXT,
  exercise_ids JSONB,
  resolution TEXT DEFAULT '720p',
  current_step TEXT,
  progress_percentage INT DEFAULT 0,
  output_url TEXT,
  file_size_mb FLOAT,
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Public manage saved_routines" ON saved_routines FOR ALL USING (true);
CREATE POLICY "Public manage video_jobs" ON video_jobs FOR ALL USING (true);
```

Then import the exercise CSV (279 rows) via Table Editor → Import CSV.

## Project Structure

```
sfh-video-frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── .env.example
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── lib/
    │   ├── supabase.ts          # Database client + API functions
    │   └── templateParser.ts    # Template parse/merge/export
    ├── components/
    │   ├── Header.tsx
    │   ├── ExerciseCard.tsx
    │   ├── PlaylistItem.tsx
    │   ├── TemplateModal.tsx
    │   └── storyboard/
    │       ├── SlideRenderer.tsx     # Video slide preview designs
    │       └── VideoStoryboard.tsx   # Full storyboard preview
    └── pages/
        ├── Builder.tsx              # Main page — library + playlist + generation
        ├── SavedRoutines.tsx        # Saved playlists
        └── StoryboardPreview.tsx    # Sample storyboard demo
```

## Brand

| Token | Value |
|-------|-------|
| Navy | #0C115B |
| Crimson | #A61E51 |
| Teal | #0F766E |
| Cream | #FFFBF7 |
| Header Font | Petrona (serif) |
| Body Font | Quicksand (sans-serif) |

## Related Repos

- **sfh-video-server** — Railway backend for video processing (ffmpeg + Puppeteer)

## License

Private — Senior Fitness Hub © 2026
