import { NextRequest, NextResponse } from 'next/server'
import { getLectureContext } from '@/utils/fileParsing'
import {
  createOpenAIClient,
  getOpenAIModel,
  hasOpenAIApiKey,
} from '@/utils/openai'
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'
import {
  type ExamGenerationRequest,
  type ExamQuestion,
  type ExamQuestionType,
} from '@/types/exams'

export const maxDuration = 60

const examModel = getOpenAIModel('OPENAI_EXAM_MODEL')

const questionTypeOrder: ExamQuestionType[] = [
  'multiple_choice',
  'fill_in_blank',
  'open_ended',
]

const MAX_TITLE_CHARS = 120
const MAX_TOPIC_FOCUS_CHARS = 1200
const MAX_EXAM_COMPLETION_TOKENS = 9000
const QUESTION_BATCH_SIZE = 10
const MAX_BATCH_ATTEMPTS = 3

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

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

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
  const safeQuestion = asRecord(question)

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

const questionTypeLabels: Record<ExamQuestionType, string> = {
  multiple_choice: 'multiple-choice',
  fill_in_blank: 'fill-in-the-blank',
  open_ended: 'open-ended',
}

const getQuestionJsonShape = (type: ExamQuestionType) => {
  if (type === 'fill_in_blank') {
    return `{
  "questions": [
    {
      "type": "fill_in_blank",
      "prompt": "string",
      "points": number,
      "correctAnswer": "string",
      "acceptableAnswers": ["string"],
      "explanation": "string"
    }
  ]
}`
  }

  if (type === 'open_ended') {
    return `{
  "questions": [
    {
      "type": "open_ended",
      "prompt": "string",
      "points": number,
      "sampleAnswer": "string",
      "gradingNotes": ["string", "string"]
    }
  ]
}`
  }

  return `{
  "questions": [
    {
      "type": "multiple_choice",
      "prompt": "string",
      "points": number,
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}`
}

const normalizePromptKey = (value: string) =>
  value.toLowerCase().replace(/\s+/g, ' ').trim()

const getDefaultDescription = (request: ExamGenerationRequest) =>
  request.language === 'sq'
    ? 'Provim i gjeneruar nga AI bazuar ne materialet e ngarkuara dhe fokusin e zgjedhur.'
    : 'AI-generated exam based on your uploaded materials and selected focus.'

const getDefaultInstructions = (request: ExamGenerationRequest) =>
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

const buildQuestionBatchPrompt = (
  request: ExamGenerationRequest,
  lectureContext: string,
  type: ExamQuestionType,
  count: number,
  points: number,
  startIndex: number,
  existingPrompts: string[]
) => {
  const languageInstruction =
    request.language === 'sq'
      ? 'Write every question and answer field in Albanian.'
      : 'Write every question and answer field in English.'

  const previousPrompts = existingPrompts.length
    ? existingPrompts
        .slice(-20)
        .map((prompt) => `- ${prompt}`)
        .join('\n')
    : '- None yet.'

  return `You are an expert exam designer for a study platform.

Generate exactly ${count} new ${questionTypeLabels[type]} question(s).
These are question numbers ${startIndex + 1} through ${startIndex + count} for the exam "${request.title}".

Requirements:
- Topic focus: ${request.topicFocus || 'Use the uploaded lecture materials as the main focus.'}
- Difficulty: ${request.difficulty}
- ${languageInstruction}
- Every question must have exactly ${points} point(s).
- Use the uploaded lecture context as the primary source whenever possible.
- If the lecture context is empty, use the topic focus as the fallback.
- Avoid duplicate prompts and avoid repeating these existing prompts:
${previousPrompts}
- Return valid JSON only. Do not wrap it in markdown.
- Return exactly this JSON object shape:
${getQuestionJsonShape(type)}

LECTURE CONTEXT:
${lectureContext || 'No uploaded lecture materials were found for this user.'}`
}

const readQuestionsArray = (raw: unknown) => {
  const safeValue = asRecord(raw)

  if (Array.isArray(safeValue.questions)) {
    return safeValue.questions
  }

  return []
}

const generateQuestionBatch = async (
  client: ReturnType<typeof createOpenAIClient>,
  request: ExamGenerationRequest,
  lectureContext: string,
  type: ExamQuestionType,
  count: number,
  points: number,
  startIndex: number,
  existingPrompts: string[]
) => {
  const collected: ExamQuestion[] = []
  const seenPrompts = new Set(existingPrompts.map(normalizePromptKey))

  for (let attempt = 0; attempt < MAX_BATCH_ATTEMPTS && collected.length < count; attempt += 1) {
    const remaining = count - collected.length
    const completion = await client.chat.completions.create({
      model: examModel,
      messages: [
        {
          role: 'system',
          content:
            'You create exam questions from lecture material. Follow the requested JSON schema exactly.',
        },
        {
          role: 'user',
          content: buildQuestionBatchPrompt(
            request,
            lectureContext,
            type,
            remaining,
            points,
            startIndex + collected.length,
            [...existingPrompts, ...collected.map((question) => question.prompt)]
          ),
        },
      ],
      temperature: 0.45,
      max_completion_tokens: Math.min(MAX_EXAM_COMPLETION_TOKENS, 1200 + remaining * 450),
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message.content

    if (!content) {
      throw new Error('The AI model returned an empty response.')
    }

    const parsed = JSON.parse(extractJson(content))
    const rawQuestions = readQuestionsArray(parsed)

    rawQuestions.forEach((question, index) => {
      if (collected.length >= count) {
        return
      }

      const sanitized = sanitizeQuestion(
        question,
        startIndex + collected.length + index,
        points
      )
      const promptKey = normalizePromptKey(sanitized.prompt)

      if (sanitized.type !== type || seenPrompts.has(promptKey)) {
        return
      }

      seenPrompts.add(promptKey)
      collected.push({ ...sanitized, points })
    })
  }

  if (collected.length < count) {
    throw new ExamShapeError(
      `The AI returned too few questions in some categories (${type}: ${count - collected.length} more needed).`,
      { [type]: count - collected.length }
    )
  }

  return collected
}

const generateExam = async (
  normalizedRequest: ExamGenerationRequest,
  lectureContext: string
) => {
  const client = createOpenAIClient()
  const finalQuestions: ExamQuestion[] = []

  for (const category of normalizedRequest.categories) {
    let remaining = category.count

    while (remaining > 0) {
      const batchSize = Math.min(QUESTION_BATCH_SIZE, remaining)
      const batch = await generateQuestionBatch(
        client,
        normalizedRequest,
        lectureContext,
        category.type,
        batchSize,
        category.points,
        finalQuestions.length,
        finalQuestions.map((question) => question.prompt)
      )

      finalQuestions.push(...batch)
      remaining -= batch.length
    }
  }

  const totalPoints = finalQuestions.reduce((sum, question) => sum + question.points, 0)

  return {
    title: normalizedRequest.title,
    description: getDefaultDescription(normalizedRequest),
    instructions: getDefaultInstructions(normalizedRequest),
    topicFocus: normalizedRequest.topicFocus,
    difficulty: normalizedRequest.difficulty,
    estimatedDurationMinutes: clamp(normalizedRequest.estimatedDurationMinutes, 10, 240),
    totalPoints,
    questions: finalQuestions,
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasOpenAIApiKey()) {
      return NextResponse.json(
        { error: 'Server is missing OPENAI_API_KEY. Please configure it in Vercel.' },
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
        .map((category) => {
          const safeCategory = asRecord(category)

          return {
            type: questionTypeOrder.includes(safeCategory.type as ExamQuestionType)
              ? (safeCategory.type as ExamQuestionType)
              : 'multiple_choice',
            count: clamp(Number(safeCategory.count) || 0, 0, 20),
            points: clamp(Number(safeCategory.points) || 1, 1, 100),
          }
        })
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
