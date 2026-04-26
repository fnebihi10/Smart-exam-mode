# AI Smoke Test Notes

Use this as a quick manual checklist after setting `OPENAI_API_KEY` locally or in Vercel.

## Chat

Ask the AI chat a short question about an uploaded lecture and confirm:

- The answer is grounded in the uploaded material.
- The answer is concise.
- Empty messages return a validation error instead of calling the model.

## Exam Generation

Generate an exam with 20 questions split across the available question types and confirm:

- The returned draft contains exactly the requested number of questions.
- Multiple-choice questions have 4 options.
- Fill-in-the-blank and open-ended questions include the expected answer fields.
- The UI can publish the generated draft without manual JSON cleanup.

## Suggested Defaults

```env
OPENAI_EXAM_MODEL=gpt-4o-mini
OPENAI_CHAT_MODEL=gpt-4o-mini
```
