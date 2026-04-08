# Application Architecture & Implementation: Smart Exam Mode

Here is a summary of how we built the **Smart Exam Mode** platform. You can use this text for your submission!

## 1. Tech Stack Overview
- **Frontend/Framework:** Next.js (App Router), React, Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL), Supabase Auth, Row Level Security (RLS)
- **AI Integration:** Vercel AI SDK using OpenRouter (Google Gemini Flash)
- **File Storage:** Supabase Storage for Lecture files (PDF, DOCX, TXT)

## 2. Database & Data Persistence (Supabase)
We utilized Supabase as our BaaS (Backend as a Service) to handle user data securely.
- **Authentication:** Users log in securely, and their actions are strictly scoped to their `user_id`.
- **Row Level Security (RLS):** We configured strict RLS policies on our `tasks`, `exams`, and `lectures` tables. This ensures that users can only read, create, update, and delete their own data. If an unauthorized user or another logged-in user attempts to access someone else's materials, the database automatically rejects the query.
- **Storage:** We configured Supabase Storage buckets to persist uploaded student materials (like lecture specific PDFs).

## 3. The "Smart Exam" Generation Workflow
The core functionality relies on generating customized exams based on user materials.
1. **File Uploads & Parsing:** When a user uploads a file, we process the text content (handling PDFs, TXT, and Document formats).
2. **AI Vercel SDK:** We connected the Vercel AI SDK to our OpenRouter API key. This allowed us to invoke large language models seamlessly via an API route (`/api/chat`).
3. **Prompt Engineering:** We send the parsed context from the student's lectures to the AI model with strict prompt instructions, asking it to output an exam format structured with Multiple Choice Questions, Fill-in-the-Blanks, and Essay queries.
4. **Interactive Dashboard:** We built a modern dashboard (using Tailwind CSS and modular React components) so the user can interactively manage their files, interact with the AI chat for studying, and dynamically generate & take their custom exams.
