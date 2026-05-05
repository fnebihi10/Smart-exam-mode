import { NextRequest, NextResponse } from 'next/server'
import {
  createOpenAIClient,
  getOpenAIModel,
  hasOpenAIApiKey,
} from '@/utils/openai'
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'

export const maxDuration = 60

const gradeModel = getOpenAIModel('OPENAI_EXAM_MODEL')
const MAX_OPEN_ENDED_GRADES = 20

type GradeRequestItem = {
  questionId: string
  prompt: string
  points: number
  sampleAnswer: string
  gradingNotes: string[]
  userAnswer: string
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

const cleanText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const normalizeQuestion = (value: unknown): GradeRequestItem | null => {
  const safeValue = asRecord(value)
  const questionId = cleanText(safeValue.questionId)
  const prompt = cleanText(safeValue.prompt)
  const points = clamp(Number(safeValue.points) || 0, 0, 100)
  const userAnswer = cleanText(safeValue.userAnswer)

  if (!questionId || !prompt || points <= 0) {
    return null
  }

  return {
    questionId,
    prompt,
    points,
    sampleAnswer: cleanText(safeValue.sampleAnswer),
    gradingNotes: Array.isArray(safeValue.gradingNotes)
      ? safeValue.gradingNotes
          .filter((entry): entry is string => typeof entry === 'string')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [],
    userAnswer,
  }
}

const buildGradePrompt = (questions: GradeRequestItem[], language: 'en' | 'sq') => {
  const languageInstruction =
    language === 'sq'
      ? 'Write feedback in Albanian.'
      : 'Write feedback in English.'

  return `You are grading open-ended exam answers for a study platform.

Grade each answer fairly using the prompt, point value, sample answer, and grading notes.
Award partial credit when the answer is partly correct.
Award 0 if the answer is empty, unrelated, or clearly wrong.
${languageInstruction}

Return valid JSON only with this shape:
{
  "grades": [
    {
      "questionId": "string",
      "earnedPoints": number,
      "feedback": "short explanation"
    }
  ]
}

Questions to grade:
${JSON.stringify(questions, null, 2)}`
}

export async function POST(request: NextRequest) {
  try {
    if (!hasOpenAIApiKey()) {
      return NextResponse.json(
        { error: 'Server is missing OPENAI_API_KEY.' },
        { status: 500 }
      )
    }

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in again.' }, { status: 401 })
    }

    let body: { questions?: unknown[]; language?: string } = {}

    try {
      body = (await request.json()) as { questions?: unknown[]; language?: string }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const questions = Array.isArray(body.questions)
      ? body.questions
          .map(normalizeQuestion)
          .filter((question): question is GradeRequestItem => Boolean(question))
          .slice(0, MAX_OPEN_ENDED_GRADES)
      : []

    if (!questions.length) {
      return NextResponse.json({ grades: [] })
    }

    const client = createOpenAIClient()
    const completion = await client.chat.completions.create({
      model: gradeModel,
      messages: [
        {
          role: 'system',
          content:
            'You grade open-ended exam answers. Be fair, concise, and return only valid JSON.',
        },
        {
          role: 'user',
          content: buildGradePrompt(questions, body.language === 'sq' ? 'sq' : 'en'),
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 2200,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message.content
    if (!content) {
      throw new Error('The AI grader returned an empty response.')
    }

    const parsed = JSON.parse(content) as { grades?: unknown[] }
    const byQuestion = new Map(questions.map((question) => [question.questionId, question]))
    const grades = Array.isArray(parsed.grades)
      ? parsed.grades
          .map((grade) => {
            const safeGrade = asRecord(grade)
            const questionId = cleanText(safeGrade.questionId)
            const question = byQuestion.get(questionId)

            if (!question) {
              return null
            }

            return {
              questionId,
              earnedPoints: clamp(Number(safeGrade.earnedPoints) || 0, 0, question.points),
              feedback:
                cleanText(safeGrade.feedback) ||
                'The answer was graded against the sample answer and grading notes.',
            }
          })
          .filter((grade): grade is { questionId: string; earnedPoints: number; feedback: string } =>
            Boolean(grade)
          )
      : []

    return NextResponse.json({ grades })
  } catch (error: unknown) {
    console.error('OPEN-ENDED GRADING ERROR:', error)

    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to grade open-ended answers.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
