# Smart Exam Mode

Smart Exam Mode is a bilingual study platform built with Next.js, Supabase, and OpenRouter. It lets students upload lecture materials, ask AI questions about those materials, generate structured exam drafts, publish exams, and run live exam sessions with violation tracking.

## What the project does

- Uploads and stores lecture files in Supabase Storage
- Extracts lecture text from PDF, DOCX, and TXT files
- Uses AI to answer questions from uploaded materials
- Generates editable exam drafts from topic focus plus lecture context
- Publishes exams and launches a live exam mode with timer and anti-switch warnings

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root.

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Required environment variables

Add these values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_EXAM_MODEL=openai/gpt-4o-mini
OPENROUTER_CHAT_MODEL=openai/gpt-4o-mini
```

Notes:

- `OPENROUTER_EXAM_MODEL` and `OPENROUTER_CHAT_MODEL` are optional overrides.
- Run the SQL in [supabase_setup.sql](/c:/Users/Bluechip/Smart-exam-mode/supabase_setup.sql) to create the required tables and policies.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth, Database, and Storage
- OpenRouter / OpenAI SDK
- Tailwind CSS

## Live link

No production deployment URL is configured in this repository yet.
