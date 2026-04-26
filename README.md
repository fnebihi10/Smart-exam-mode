# Smart Exam Mode

Smart Exam Mode is a bilingual study platform built with Next.js, Supabase, and OpenRouter. It lets students upload lecture materials, ask AI questions about those materials, generate structured exam drafts, publish exams, and run live exam sessions with violation tracking.

## Core flow

1. Upload lecture materials in `Lectures`
2. Ask questions in `AI Chat` using uploaded context
3. Generate a structured exam draft in `Exams`
4. Edit and publish the draft
5. Run a live exam session with timer and violation tracking

## Features

- Lecture upload and storage with Supabase Storage
- PDF, DOCX, and TXT parsing for AI-ready context
- AI chat grounded in the signed-in user's uploaded materials
- Configurable exam generation by question type, difficulty, points, and lecture scope
- Draft editing before publish
- Published exams with live exam mode and basic anti-switch monitoring
- Bilingual UI support for English and Albanian

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth, Database, and Storage
- OpenRouter via the OpenAI SDK
- Tailwind CSS

## Project structure

```text
app/                   routes and API endpoints
components/            dashboard, auth, theme, and i18n UI
contexts/              auth context
docs/                  presentation/demo documentation
types/                 shared TypeScript models
utils/                 Supabase, OpenRouter, parsing, and helpers
supabase_setup.sql     database schema and RLS setup
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your real values.

3. Run the SQL in [supabase_setup.sql](/c:/Users/Bluechip/Smart-exam-mode/supabase_setup.sql) to create:
- `lecture_files`
- `exams`
- `exam_attempts`

4. Make sure the `lectures` storage bucket exists in Supabase.

5. Start the development server:

```bash
npm run dev
```

6. Open `http://localhost:3000`

## Environment variables

Use the following values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_EXAM_MODEL=openai/gpt-4o-mini
OPENROUTER_CHAT_MODEL=openai/gpt-4o-mini
APP_URL=http://localhost:3000
```

- `OPENROUTER_EXAM_MODEL` and `OPENROUTER_CHAT_MODEL` are optional overrides.
- `APP_URL` should match your deployed domain in production.

## Demo-ready checks

- `npm run build` should pass before presentation
- Verify auth flows: signup, login, reset password
- Verify upload, preview, AI chat, exam generation, publish, and live exam mode
- Keep a prepared demo account and 1-2 sample lecture files ready
- Review [docs/demo-plan.md](/c:/Users/Bluechip/Smart-exam-mode/docs/demo-plan.md) before presenting

## Live URL

https://smart-exam-mode.vercel.app/
