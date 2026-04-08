import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getLectureContext } from '@/utils/fileParsing'
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'
import {
  type ExamGenerationRequest,
  type ExamQuestion,
  type ExamQuestionType,
  type GeneratedExam,
} from '@/types/exams'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'Smart Exam Mode',
  },
})

const examModel =
  process.env.OPENROUTER_EXAM_MODEL?.trim() || 'openai/gpt-4o-mini'

const questionTypeOrder: ExamQuestionType[] = [
  'multiple_choice',
  'fill_in_blank',
  'open_ended',
]

const MAX_TITLE_CHARS = 120
const MAX_TOPIC_FOCUS_CHARS = 1200

class ExamShapeError extends Error {
  missingCounts: Partial<Record<ExamQuestionType, number>>

  constructor(message: string, missingCounts: Partial<Record<ExamQuestionType, number>>) {
    super(message)
    this.name = 'ExamShapeError'
    this.missingCounts = missingCounts
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const cleanText = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') return fallback
  const cleaned = value.trim()
  return cleaned || fallback
}

const normalizeStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback

  const cleaned = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)

  return cleaned.length ? cleaned : fallback
}

const normalizeQuestionType = (value: unknown, question?: Record<string, unknown>): ExamQuestionType => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_')

    if (
      normalized === 'multiple_choice' ||
      normalized === 'multiplechoice' ||
      normalized === 'mcq'
    ) {
      return 'multiple_choice'
    }

    if (
      normalized === 'fill_in_blank' ||
      normalized === 'fill_blank' ||
      normalized === 'fillintheblank' ||
      normalized === 'blank' ||
      normalized === 'short_answer' ||
      normalized === 'shortanswer'
    ) {
      return 'fill_in_blank'
    }

    if (
      normalized === 'open_ended' ||
      normalized === 'openended' ||
      normalized === 'essay' ||
      normalized === 'long_answer' ||
      normalized === 'longanswer'
    ) {
      return 'open_ended'
    }
  }

  if (question) {
    if (Array.isArray(question.options) && question.options.length > 0) {
      return 'multiple_choice'
    }

    if (
      'sampleAnswer' in question ||
      'gradingNotes' in question
    ) {
      return 'open_ended'
    }

    if (
      'acceptableAnswers' in question ||
      'correctAnswer' in question
    ) {
      return 'fill_in_blank'
    }
  }

  return 'multiple_choice'
}

const extractJson = (content: string) => {
  const trimmed = content.trim()

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
  }

  const match = trimmed.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('AI response did not include a JSON object.')
  }

  return match[0]
}

const sanitizeQuestion = (question: unknown, index: number, points: number): ExamQuestion => {
  const safeQuestion =
    typeof question === 'object' && question !== null ? (question as Record<string, unknown>) : {}

  const type = normalizeQuestionType(safeQuestion.type, safeQuestion)

  const prompt = cleanText(safeQuestion.prompt, `Question ${index + 1}`)
  const safePoints = clamp(Number(safeQuestion.points) || points, 1, 100)

  if (type === 'fill_in_blank') {
    const correctAnswer = cleanText(safeQuestion.correctAnswer, 'Sample answer')
    const acceptableAnswers = normalizeStringArray(safeQuestion.acceptableAnswers, [correctAnswer])

    return {
      id: crypto.randomUUID(),
      type,
      prompt,
      points: safePoints,
      correctAnswer,
      acceptableAnswers,
      explanation: cleanText(
        safeQuestion.explanation,
        'Explain why this word or phrase completes the statement.'
      ),
    }
  }

  if (type === 'open_ended') {
    return {
      id: crypto.randomUUID(),
      type,
      prompt,
      points: safePoints,
      sampleAnswer: cleanText(
        safeQuestion.sampleAnswer,
        'Provide a concise model answer aligned with the lecture material.'
      ),
      gradingNotes: normalizeStringArray(safeQuestion.gradingNotes, [
        'Reward accuracy and use of key concepts.',
        'Check whether the answer stays focused on the prompt.',
      ]),
    }
  }

  const options = normalizeStringArray(safeQuestion.options, ['Option A', 'Option B', 'Option C', 'Option D'])
  while (options.length < 4) {
    options.push(`Option ${String.fromCharCode(65 + options.length)}`)
  }

  const normalizedOptions = options.slice(0, 4)
  const correctAnswer = normalizedOptions.includes(cleanText(safeQuestion.correctAnswer, normalizedOptions[0]))
    ? cleanText(safeQuestion.correctAnswer, normalizedOptions[0])
    : normalizedOptions[0]

  return {
    id: crypto.randomUUID(),
    type: 'multiple_choice',
    prompt,
    points: safePoints,
    options: normalizedOptions,
    correctAnswer,
    explanation: cleanText(
      safeQuestion.explanation,
      'Explain briefly why the correct option is the best answer.'
    ),
  }
}

const sanitizeExam = (
  raw: unknown,
  request: ExamGenerationRequest
): GeneratedExam => {
  const safeExam = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const rawQuestions = Array.isArray(safeExam.questions) ? safeExam.questions : []
  const categoryMap = new Map(request.categories.map((category) => [category.type, category]))

  const questionsByType = new Map<ExamQuestionType, ExamQuestion[]>(
    questionTypeOrder.map((type) => [type, [] as ExamQuestion[]])
  )

  rawQuestions.forEach((question, index) => {
    const safeQuestion =
      typeof question === 'object' && question !== null ? (question as Record<string, unknown>) : {}

    const inferredType = normalizeQuestionType(safeQuestion.type, safeQuestion)

    const defaultPoints = categoryMap.get(inferredType)?.points ?? 1
    const sanitized = sanitizeQuestion(question, index, defaultPoints)
    questionsByType.get(sanitized.type)?.push(sanitized)
  })

  const finalQuestions: ExamQuestion[] = []
  const missingCounts: Partial<Record<ExamQuestionType, number>> = {}

  request.categories.forEach((category) => {
    const matchingQuestions = questionsByType.get(category.type) ?? []

    if (matchingQuestions.length < category.count) {
      missingCounts[category.type] = category.count - matchingQuestions.length
      return
    }

    matchingQuestions
      .slice(0, category.count)
      .forEach((question) => finalQuestions.push({ ...question, points: category.points }))
  })

  if (Object.keys(missingCounts).length > 0) {
    const missingSummary = questionTypeOrder
      .filter((type) => missingCounts[type])
      .map((type) => `${type}: ${missingCounts[type]} more needed`)
      .join(', ')

    throw new ExamShapeError(
      `The AI returned too few questions in some categories (${missingSummary}).`,
      missingCounts
    )
  }

  const totalPoints = finalQuestions.reduce((sum, question) => sum + question.points, 0)

  return {
    title: cleanText(safeExam.title, request.title),
    description: cleanText(
      safeExam.description,
      request.language === 'sq'
        ? 'Provim i gjeneruar nga AI bazuar ne materialet e ngarkuara dhe fokusin e zgjedhur.'
        : 'AI-generated exam based on your uploaded materials and selected focus.'
    ),
    instructions: normalizeStringArray(
      safeExam.instructions,
      request.language === 'sq'
        ? [
            'Lexo cdo pyetje me kujdes.',
            'Menaxho kohen sipas pikeve te caktuara.',
            'Per pyetjet e hapura, perdor argumente te qarta dhe terma nga materiali.',
          ]
        : [
            'Read each question carefully.',
            'Manage your time based on the point value of each question.',
            'For open-ended questions, use precise concepts from the study material.',
          ]
    ),
    topicFocus: request.topicFocus,
    difficulty: request.difficulty,
    estimatedDurationMinutes: clamp(request.estimatedDurationMinutes, 10, 240),
    totalPoints,
    questions: finalQuestions,
  }
}

const buildPrompt = (request: ExamGenerationRequest, lectureContext: string) => {
  const categorySummary = request.categories
    .map(
      (category) =>
        `- ${category.type}: ${category.count} question(s), ${category.points} point(s) each`
    )
    .join('\n')

  const languageInstruction =
    request.language === 'sq'
      ? 'Write the entire exam in Albanian.'
      : 'Write the entire exam in English.'

  return `You are an expert exam designer for a study platform.

Create a balanced exam that feels like a polished teacher-made assessment.
Use the uploaded lecture context as the primary source whenever possible.
If the lecture context is empty, use the topic focus as the fallback.

Requirements:
- Exam title: ${request.title}
- Topic focus: ${request.topicFocus || 'Use the uploaded lecture materials as the main focus.'}
- Difficulty: ${request.difficulty}
- Estimated duration: ${request.estimatedDurationMinutes} minutes
- ${languageInstruction}
- The exam must contain exactly the following categories and counts:
${categorySummary}
- Multiple choice questions must have exactly 4 options.
- Fill-in-the-blank questions must expect a short word or phrase.
- Open-ended questions must need a written response and include grading notes.
- Keep question quality high and avoid duplicates.
- Match each question's point value to the requested category settings.
- Return valid JSON only. Do not wrap it in markdown.

Return this JSON shape:
{
  "title": "string",
  "description": "string",
  "instructions": ["string", "string"],
  "questions": [
    {
      "type": "multiple_choice" | "fill_in_blank" | "open_ended",
      "prompt": "string",
      "points": number,
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string"
    },
    {
      "type": "fill_in_blank",
      "prompt": "string",
      "points": number,
      "correctAnswer": "string",
      "acceptableAnswers": ["string"],
      "explanation": "string"
    },
    {
      "type": "open_ended",
      "prompt": "string",
      "points": number,
      "sampleAnswer": "string",
      "gradingNotes": ["string", "string"]
    }
  ]
}

LECTURE CONTEXT:
${lectureContext || 'No uploaded lecture materials were found for this user.'}`
}

const buildRetryPrompt = (
  request: ExamGenerationRequest,
  lectureContext: string,
  missingCounts: Partial<Record<ExamQuestionType, number>>
) => {
  const missingSummary = questionTypeOrder
    .filter((type) => missingCounts[type])
    .map((type) => `- ${type}: ${missingCounts[type]} more required`)
    .join('\n')

  return `${buildPrompt(request, lectureContext)}

IMPORTANT CORRECTION:
Your previous answer did not include enough questions in these categories:
${missingSummary}

Return a complete exam JSON again, not just the missing questions.
Double-check that the final "questions" array contains the exact requested count for every category before responding.`
}

const generateExam = async (
  normalizedRequest: ExamGenerationRequest,
  lectureContext: string
) => {
  const systemMessage =
    'You create structured exam drafts from lecture material. Follow the requested JSON schema exactly.'

  let retryInstruction: string | null = null

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const completion = await client.chat.completions.create({
      model: examModel,
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: retryInstruction
            ? buildRetryPrompt(normalizedRequest, lectureContext, JSON.parse(retryInstruction) as Partial<Record<ExamQuestionType, number>>)
            : buildPrompt(normalizedRequest, lectureContext),
        },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    })

    const content = completion.choices[0]?.message.content

    if (!content) {
      throw new Error('The AI model returned an empty response.')
    }

    try {
      const parsed = JSON.parse(extractJson(content))
      return sanitizeExam(parsed, normalizedRequest)
    } catch (error) {
      if (attempt === 1 || !(error instanceof ExamShapeError)) {
        throw error
      }

      retryInstruction = JSON.stringify(error.missingCounts)
    }
  }

  throw new Error('Failed to generate the exam draft.')
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'Server is missing OPENROUTER_API_KEY. Please configure it in Vercel.' },
        { status: 500 }
      )
    }

    let body: Partial<ExamGenerationRequest> = {}

    try {
      body = (await request.json()) as Partial<ExamGenerationRequest>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const categories = Array.isArray(body.categories) ? body.categories : []
    const topicFocus = typeof body.topicFocus === 'string' ? body.topicFocus.trim() : ''
    const selectedLectureIds = Array.isArray(body.selectedLectureIds)
      ? body.selectedLectureIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : []

    if (!topicFocus && selectedLectureIds.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one lecture or write a topic focus before generating the exam.' },
        { status: 400 }
      )
    }

    const titleCandidate = typeof body.title === 'string' ? body.title.trim() : ''

    if (titleCandidate.length > MAX_TITLE_CHARS) {
      return NextResponse.json(
        { error: `Exam title is too long. Keep it under ${MAX_TITLE_CHARS} characters.` },
        { status: 400 }
      )
    }

    if (topicFocus.length > MAX_TOPIC_FOCUS_CHARS) {
      return NextResponse.json(
        { error: `Topic focus is too long. Keep it under ${MAX_TOPIC_FOCUS_CHARS} characters.` },
        { status: 400 }
      )
    }

    if (selectedLectureIds.length > 25) {
      return NextResponse.json(
        { error: 'Too many lectures selected. Please choose fewer sources.' },
        { status: 400 }
      )
    }

    if (selectedLectureIds.length > 0) {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized. Please sign in again.' }, { status: 401 })
      }
    }

    const normalizedRequest: ExamGenerationRequest = {
      title: cleanText(body.title, 'AI Exam Draft'),
      topicFocus,
      difficulty:
        body.difficulty === 'easy' ||
        body.difficulty === 'medium' ||
        body.difficulty === 'hard' ||
        body.difficulty === 'mixed'
          ? body.difficulty
          : 'mixed',
      language: body.language === 'sq' ? 'sq' : 'en',
      estimatedDurationMinutes: clamp(Number(body.estimatedDurationMinutes) || 60, 10, 240),
      selectedLectureIds,
      categories: categories
        .map((category) => ({
          type: questionTypeOrder.includes(category.type as ExamQuestionType)
            ? (category.type as ExamQuestionType)
            : 'multiple_choice',
          count: clamp(Number(category.count) || 0, 0, 20),
          points: clamp(Number(category.points) || 1, 1, 100),
        }))
        .filter((category) => category.count > 0),
    }

    const totalQuestions = normalizedRequest.categories.reduce(
      (sum, category) => sum + category.count,
      0
    )

    if (!normalizedRequest.categories.length || totalQuestions < 1) {
      return NextResponse.json(
        { error: 'Choose at least one question category before generating an exam.' },
        { status: 400 }
      )
    }

    if (totalQuestions > 30) {
      return NextResponse.json(
        { error: 'Keep the generated exam at 30 questions or fewer for a stable response.' },
        { status: 400 }
      )
    }

    const lectureContext = normalizedRequest.selectedLectureIds.length
      ? await getLectureContext(normalizedRequest.selectedLectureIds)
      : ''

    const exam = await generateExam(normalizedRequest, lectureContext)

    return NextResponse.json({
      exam,
      contextAvailable: Boolean(lectureContext.trim()),
    })
  } catch (error: unknown) {
    console.error('EXAM GENERATION ERROR:', error)

    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to generate the exam draft.'

    const normalized = message.toLowerCase()

    if (normalized.includes('timeout') || normalized.includes('overloaded') || normalized.includes('rate limit')) {
      return NextResponse.json({ error: message }, { status: 502 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
