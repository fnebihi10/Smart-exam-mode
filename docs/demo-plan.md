# Demo Plan

## Project And User

Smart Exam Mode is a study platform for students who want lecture materials, AI questions, exam preparation, and live exam attempts in one focused workspace. It is especially useful when a course has many lecture files and students need a clearer path from uploaded materials to practice and official exams.

## Main Demo Flow

### 0:00-0:45 - Introduction
- Explain the problem: materials, questions, and exam preparation are usually scattered.
- Show the product value: one workspace for materials, AI chat, exam generation, and live exam mode.

### 0:45-2:00 - Lectures
- Open `Dashboard -> Lectures`.
- Upload a PDF, DOCX, or TXT lecture file.
- Show the material list, metadata, preview, and Supabase Storage persistence.

### 2:00-3:15 - AI Chat
- Return to the dashboard.
- Ask a real question about the uploaded material.
- Show that the answer is grounded in lecture context.

### 3:15-4:45 - Exam Builder
- Open `Dashboard -> Exams`.
- Choose source lectures, difficulty, duration, and question counts.
- Generate an AI exam draft.
- Show that the draft can be edited before publishing.

### 4:45-6:00 - Publish And Live Exam Mode
- Publish the exam.
- Open the live exam.
- Show the timer, question navigation, and violation tracking.
- Explain that Escape, blocked shortcuts, tab switching, and fullscreen exit count as violations.

### 6:00-7:00 - Close
- Summarize the value: materials + AI + exam workflow + focused live exam mode.
- Briefly explain the technical architecture and why this flow best demonstrates the product.

## Technical Notes

- `Next.js App Router` for frontend routes and API routes.
- `Supabase Auth` for identity and user isolation.
- `Supabase Database + RLS` for `lecture_files`, `exams`, `exam_attempts`, and `tasks`.
- `Supabase Storage` for lecture files.
- `OpenAI SDK` for AI chat, exam generation, and open-ended grading.
- PDF, DOCX, and TXT parsing before files are used as AI context.

## Demo Checklist

- `npm run build` passes.
- Signup, login, and reset password flows work.
- Upload and preview work.
- AI chat returns responses when `OPENAI_API_KEY` is configured.
- Exam generation works with uploaded materials or topic focus.
- Publishing and live exam mode work after running `supabase_setup.sql`.
- Teacher results are grouped by exam and student.

## Backup Plan

- If the live URL fails, run locally with `npm run dev`.
- If OpenAI is slow or rate-limited, show a previously generated exam draft and explain the flow.
- If Supabase has network trouble, show the database structure in `supabase_setup.sql` and prepared screenshots or video.
- Keep one test material and one prepared demo account ready before the presentation.

## Live URL

- Repository: `https://github.com/fnebihi10/Smart-exam-mode`
- Live URL: `https://smart-exam-mode.vercel.app/`

## Readiness Note

For the final presentation, use the flow `Lectures -> AI Chat -> Exam Builder -> Publish -> Live Exam`. This shows the full product value without getting lost in secondary details.
