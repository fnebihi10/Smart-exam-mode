'use client'

import Link from 'next/link'
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  PencilLine,
  Play,
  Plus,
  Radio,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppLocale } from '@/components/i18n/useAppLocale'
import {
  EXAM_BUILDER_LECTURE_COLUMNS,
  listLectureFiles,
  type LectureFileListItem,
} from '@/utils/lectureFiles'
import {
  DEFAULT_EXAM_SETTINGS,
  EXAM_CATEGORY_META,
  type ExamDifficulty,
  type ExamGenerationRequest,
  type ExamKind,
  type ExamQuestion,
  type ExamQuestionType,
  type GeneratedExam,
  type StoredExamAttemptRecord,
  type StoredExamRecord,
} from '@/types/exams'
import type { UserProfile } from '@/types/roles'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'

type ExamsView = 'builder' | 'library' | 'results'
type ResultKindFilter = 'all' | 'official' | 'practice'

const copy = {
  en: {
    back: 'Back to dashboard',
    adminBadge: 'Preview-only access',
    adminTitle: 'Admins control roles and preview exams without creating or starting them.',
    adminBody: 'Open the admin area to manage teacher/student roles and inspect official exams.',
    adminCta: 'Open admin',
    teacherBadge: 'Official exam studio',
    teacherTitle: 'Build official exams from lectures, review the draft, then publish live.',
    teacherBody:
      'Generated exams are saved as drafts first. Edit the questions, preview the paper, and publish only when it is ready for students.',
    studentBadge: 'Private practice',
    studentTitle: 'Create practice exams from your lectures that only you can take.',
    studentBody:
      'Practice exams stay private to your account. Teachers and admins do not use this area for official results.',
    setupTitle: 'Exam setup',
    setupBody: 'Choose lecture sources, duration, difficulty, and the exact question mix.',
    examTitle: 'Exam title',
    topicFocus: 'Topic focus',
    topicPlaceholder: 'Example: Chapters 2 to 5, networking fundamentals, or uploaded lecture materials.',
    difficulty: 'Difficulty',
    duration: 'Duration',
    minutes: 'minutes',
    lectureScopeTitle: 'Lecture source',
    lectureScopeBody: 'Choose which uploaded lectures should be used as the source for this exam.',
    lectureLoading: 'Loading lecture files...',
    lectureEmpty: 'No lecture files found yet. Upload materials first or use topic focus only.',
    lectureLoadError: 'Lecture sources could not be loaded right now. You can still use topic focus or try again.',
    retryLectures: 'Retry lecture loading',
    selectAllLectures: 'Use all lectures',
    clearLectures: 'Clear selection',
    selectedLectures: 'Selected lectures',
    lectureRequired: 'Select at least one lecture or write a topic focus before generating the exam.',
    categoriesTitle: 'Question categories',
    categoriesBody: 'Choose how many questions and points each category should carry.',
    count: 'Questions',
    points: 'Points each',
    totalQuestions: 'Total questions',
    totalPoints: 'Total points',
    totalDuration: 'Duration',
    generateTeacher: 'Generate draft',
    generateStudent: 'Generate practice exam',
    generating: 'Generating exam...',
    draftReady: 'Draft saved. Preview, edit, then publish it when ready.',
    practiceReady: 'Practice exam saved and ready to start.',
    noContext: 'Exam generated from topic focus only.',
    savedTitleTeacher: 'Official exams',
    savedTitleStudent: 'Private practice exams',
    savedBodyTeacher: 'Drafts can be edited before publishing. Published official exams stay live only until their selected time ends.',
    savedBodyStudent: 'Only you can see and take these practice exams.',
    emptySavedTeacher: 'No official exams yet.',
    emptySavedStudent: 'No practice exams yet.',
    loadError: 'Failed to load exams.',
    setupNotice: 'The exams table needs the updated role workflow SQL.',
    setupHint: 'Run the latest supabase_setup.sql so draft, official, practice, and live window columns exist.',
    publishedOn: 'Published',
    draftedOn: 'Drafted',
    liveUntil: 'Live until',
    expired: 'Expired',
    draft: 'Draft',
    live: 'Live',
    practice: 'Practice',
    startExam: 'Start practice',
    preview: 'Preview',
    hidePreview: 'Hide preview',
    editDraft: 'Edit questions',
    saveDraft: 'Save draft',
    cancelEdit: 'Cancel',
    publishLive: 'Publish live',
    publishConfirm: 'Publish this exam live for the selected duration?',
    publishSuccess: 'Official exam is live for students.',
    publishError: 'Publishing failed.',
    deleteExam: 'Delete exam',
    deleteExamConfirm: 'Do you want to delete this exam?',
    deleteSuccess: 'Exam deleted successfully.',
    deleteError: 'Deleting the exam failed.',
    invalidDraftJson: 'The draft needs complete question text, answers, points, and at least two options for every multiple-choice question.',
    draftSaved: 'Draft updated.',
    draftSaveError: 'Saving the draft failed.',
    editorQuestions: 'Questions',
    questionPrompt: 'Question text',
    pointsLabel: 'Points',
    answerText: 'Answer',
    addOption: 'Add option',
    removeOption: 'Remove option',
    acceptedAnswers: 'Accepted answers',
    addAcceptedAnswer: 'Add answer',
    sampleAnswer: 'Sample answer',
    gradingNotes: 'Grading notes',
    addGradingNote: 'Add note',
    removeQuestion: 'Remove question',
    builderTab: 'Builder',
    libraryTab: 'Library',
    resultsTab: 'Results',
    resultsTitleTeacher: 'Official exam results',
    resultsTitleStudent: 'Exam results',
    resultsBodyTeacher: 'Choose an exam, then review each student submission for that exam.',
    resultsBodyStudent: 'Review your official exam attempts and private practice attempts.',
    allResults: 'All results',
    officialResults: 'Official',
    practiceResults: 'Practice',
    officialExam: 'Official exam',
    practiceExam: 'Practice exam',
    resultExamPicker: 'Choose exam',
    resultExamPickerBody: 'Each official exam shows the number of submissions, students, and latest activity.',
    resultStudents: 'Students',
    resultAttempts: 'Attempts',
    resultAverageScore: 'Average score',
    resultLatestSubmission: 'Latest submission',
    noExamResults: 'No official exams with student results yet.',
    noStudentResults: 'No student submissions for this exam yet.',
    viewExamResults: 'View results',
    selectedExam: 'Selected exam',
    studentResult: 'Student result',
    studentNameFallback: 'Unnamed student',
    studentEmailMissing: 'No email available',
    userIdLabel: 'User ID',
    attemptLabel: 'Attempt',
    noAttempts: 'No attempts yet.',
    attemptScore: 'Score',
    attemptStatus: 'Status',
    attemptViolations: 'Violations',
    attemptSubmitted: 'Submitted',
    answersSubmitted: 'Answers',
    deleteResult: 'Delete result',
    deleteResultConfirm: 'Do you want to delete this result?',
    deleteResultSuccess: 'Result deleted successfully.',
    deleteResultError: 'Deleting the result failed.',
    openBuilder: 'Open builder',
    mixed: 'Mixed',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    sessionExpired: 'Your session expired. Please sign in again.',
    titleRequired: 'Please add an exam title before generating.',
    titleTooLong: 'The exam title is too long. Keep it under 120 characters.',
    topicTooLong: 'Topic focus is too long. Keep it under 1200 characters.',
    requestFailed: 'Generation failed due to a network or server error. Please try again.',
    tooManyQuestions: 'Keep the generated exam at 30 questions or fewer.',
    signIn: 'Sign in',
    correctAnswer: 'Correct answer',
    options: 'Options',
  },} as const

const EXAM_COLUMNS =
  'id, user_id, title, description, topic_focus, difficulty, question_count, total_points, estimated_duration_minutes, status, exam_kind, exam_payload, published_at, live_until, created_at'

const MAX_EXAM_TITLE_CHARS = 120
const MAX_TOPIC_FOCUS_CHARS = 1200
const MIN_DURATION_MINUTES = 10
const MAX_DURATION_MINUTES = 240
const MAX_CATEGORY_COUNT = 20
const MIN_CATEGORY_POINTS = 1
const MAX_CATEGORY_POINTS = 100

type CategoryInputState = Record<ExamQuestionType, { count: string; points: string }>

const difficultyOptions: ExamDifficulty[] = ['mixed', 'easy', 'medium', 'hard']

const questionAccentClasses: Record<ExamQuestionType, string> = {
  multiple_choice: 'border-l-teal-500 dark:border-l-teal-300',
  fill_in_blank: 'border-l-amber-500 dark:border-l-amber-300',
  open_ended: 'border-l-sky-500 dark:border-l-sky-300',
}

const createInitialConfig = (locale: 'en', role: 'teacher' | 'student'): ExamGenerationRequest => ({
  title: role === 'teacher' ? 'Official lecture exam' : 'Private practice exam',
  topicFocus: '',
  difficulty: 'mixed',
  language: locale,
  estimatedDurationMinutes: 60,
  selectedLectureIds: [],
  categories: DEFAULT_EXAM_SETTINGS.map((category) => ({ ...category })),
})

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, '')

const parseIntegerInput = (value: string) => {
  if (!value.trim()) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

const createCategoryInputState = (
  categories: ExamGenerationRequest['categories']
): CategoryInputState =>
  categories.reduce(
    (accumulator, category) => ({
      ...accumulator,
      [category.type]: {
        count: String(category.count),
        points: String(category.points),
      },
    }),
    {} as CategoryInputState
  )

const normalizeDurationValue = (value: string, fallback: number) =>
  clampNumber(
    parseIntegerInput(value) ?? fallback,
    MIN_DURATION_MINUTES,
    MAX_DURATION_MINUTES
  )

const normalizeCategoryValue = (
  field: 'count' | 'points',
  value: string,
  fallback: number
) => {
  const parsed = parseIntegerInput(value) ?? fallback

  return field === 'count'
    ? clampNumber(parsed, 0, MAX_CATEGORY_COUNT)
    : clampNumber(parsed, MIN_CATEGORY_POINTS, MAX_CATEGORY_POINTS)
}

const buildNormalizedConfig = (
  config: ExamGenerationRequest,
  durationInput: string,
  categoryInputs: CategoryInputState
): ExamGenerationRequest => ({
  ...config,
  title: config.title.trim(),
  topicFocus: config.topicFocus.trim(),
  estimatedDurationMinutes: normalizeDurationValue(
    durationInput,
    config.estimatedDurationMinutes
  ),
  categories: config.categories.map((category) => ({
    ...category,
    count: normalizeCategoryValue(
      'count',
      categoryInputs[category.type]?.count ?? String(category.count),
      category.count
    ),
    points: normalizeCategoryValue(
      'points',
      categoryInputs[category.type]?.points ?? String(category.points),
      category.points
    ),
  })),
})

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    const message = error.message.trim()
    if (!message) return fallback
    if (message.toLowerCase().includes('failed to fetch')) return fallback
    return message
  }

  return fallback
}

const isMissingExamsTableError = (message: string) => {
  const normalized = message.toLowerCase()

  return (
    normalized.includes('exam_kind') ||
    normalized.includes('live_until') ||
    normalized.includes("could not find the table 'public.exams'") ||
    normalized.includes('schema cache') ||
    normalized.includes('relation "exams" does not exist') ||
    normalized.includes("relation 'exams' does not exist") ||
    normalized.includes('relation does not exist')
  )
}

const isMissingExamAttemptsTableError = (message: string) => {
  const normalized = message.toLowerCase()

  return (
    normalized.includes('exam_attempts') &&
    (
      normalized.includes('does not exist') ||
      normalized.includes('schema cache') ||
      normalized.includes('could not find the table')
    )
  )
}

const safeReadJson = async (response: Response) => {
  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

const createDraftQuestionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const cloneDraftQuestion = (question: ExamQuestion): ExamQuestion => {
  if (question.type === 'multiple_choice') {
    return {
      ...question,
      id: question.id || createDraftQuestionId(),
      options: [...question.options],
    }
  }

  if (question.type === 'fill_in_blank') {
    return {
      ...question,
      id: question.id || createDraftQuestionId(),
      acceptableAnswers: [...question.acceptableAnswers],
    }
  }

  return {
    ...question,
    id: question.id || createDraftQuestionId(),
    gradingNotes: [...question.gradingNotes],
  }
}

const cloneDraftExam = (exam: GeneratedExam): GeneratedExam => ({
  ...exam,
  instructions: [...exam.instructions],
  questions: exam.questions.map(cloneDraftQuestion),
})

const cleanDraftText = (value: string) => value.trim()

const normalizeDraftText = (value: string) =>
  cleanDraftText(value).toLowerCase()

const normalizeDraftExam = (draft: GeneratedExam): GeneratedExam => {
  const questions = draft.questions.map((question) => {
    const prompt = cleanDraftText(question.prompt)
    const points = clampNumber(
      Math.round(Number(question.points) || MIN_CATEGORY_POINTS),
      MIN_CATEGORY_POINTS,
      MAX_CATEGORY_POINTS
    )

    if (!prompt) {
      throw new Error('Invalid draft')
    }

    if (question.type === 'multiple_choice') {
      const options = question.options.map(cleanDraftText).filter(Boolean)
      const normalizedOptions = options.map(normalizeDraftText)

      if (options.length < 2 || new Set(normalizedOptions).size !== options.length) {
        throw new Error('Invalid draft')
      }

      const correctAnswer = cleanDraftText(question.correctAnswer)
      const matchingCorrectOption = options.find(
        (option) => normalizeDraftText(option) === normalizeDraftText(correctAnswer)
      )

      if (!matchingCorrectOption) {
        throw new Error('Invalid draft')
      }

      return {
        ...question,
        id: question.id || createDraftQuestionId(),
        prompt,
        points,
        options,
        correctAnswer: matchingCorrectOption,
        explanation: cleanDraftText(question.explanation),
      }
    }

    if (question.type === 'fill_in_blank') {
      const correctAnswer = cleanDraftText(question.correctAnswer)

      if (!correctAnswer) {
        throw new Error('Invalid draft')
      }

      return {
        ...question,
        id: question.id || createDraftQuestionId(),
        prompt,
        points,
        correctAnswer,
        acceptableAnswers: question.acceptableAnswers.map(cleanDraftText).filter(Boolean),
        explanation: cleanDraftText(question.explanation),
      }
    }

    const sampleAnswer = cleanDraftText(question.sampleAnswer)

    if (!sampleAnswer) {
      throw new Error('Invalid draft')
    }

    return {
      ...question,
      id: question.id || createDraftQuestionId(),
      prompt,
      points,
      sampleAnswer,
      gradingNotes: question.gradingNotes.map(cleanDraftText).filter(Boolean),
    }
  })

  if (questions.length === 0) {
    throw new Error('Invalid draft')
  }

  const estimatedDurationMinutes = clampNumber(
    Math.round(Number(draft.estimatedDurationMinutes) || MIN_DURATION_MINUTES),
    MIN_DURATION_MINUTES,
    MAX_DURATION_MINUTES
  )

  return {
    ...draft,
    title: cleanDraftText(draft.title) || 'Untitled exam',
    description: cleanDraftText(draft.description),
    instructions: draft.instructions.map(cleanDraftText).filter(Boolean),
    topicFocus: cleanDraftText(draft.topicFocus),
    estimatedDurationMinutes,
    totalPoints: questions.reduce((sum, question) => sum + question.points, 0),
    questions,
  }
}

const formatLiveState = (exam: StoredExamRecord, liveLabel: string, expiredLabel: string) => {
  if (exam.status !== 'published') return ''
  if (!exam.live_until) return liveLabel
  return new Date(exam.live_until).getTime() > Date.now() ? liveLabel : expiredLabel
}

function ExamQuestionPreview({
  exam,
  labels,
}: {
  exam: GeneratedExam
  labels: {
    correctAnswer: string
    sampleAnswer: string
    options: string
  }
}) {
  return (
    <div className="mt-4 space-y-3">
      {exam.questions.map((question, index) => (
        <article
          key={question.id || `${question.type}-${index}`}
          className={`surface-muted border-l-4 p-4 ${questionAccentClasses[question.type]}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill">
              {index + 1}. {EXAM_CATEGORY_META[question.type].label}
            </span>
            <span className="status-pill">{question.points} pts</span>
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-900 dark:text-white">
            {question.prompt}
          </p>

          {question.type === 'multiple_choice' && (
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p className="font-semibold">{labels.options}</p>
              {question.options.map((option, optionIndex) => (
                <p key={`${option}-${optionIndex}`} className="rounded-2xl border border-[var(--border)] px-3 py-2">
                  {option}
                </p>
              ))}
              <p className="text-[var(--accent)]">
                {labels.correctAnswer}: {question.correctAnswer}
              </p>
            </div>
          )}

          {question.type === 'fill_in_blank' && (
            <p className="mt-3 text-sm text-[var(--accent)]">
              {labels.correctAnswer}: {question.correctAnswer}
            </p>
          )}

          {question.type === 'open_ended' && (
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {labels.sampleAnswer}: {question.sampleAnswer}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}

export default function ExamBuilder() {
  const { role, roleLoading, user, loading } = useAuth()
  const { locale } = useAppLocale()
  const t = copy[locale]
  const supabase = useSupabaseBrowserClient()
  const builderRole = role === 'teacher' ? 'teacher' : 'student'
  const isTeacher = role === 'teacher'
  const isStudent = role === 'student'
  const examKind: ExamKind = isTeacher ? 'official' : 'practice'

  const [config, setConfig] = useState<ExamGenerationRequest>(() =>
    createInitialConfig(locale, builderRole)
  )
  const [durationInput, setDurationInput] = useState(() =>
    String(createInitialConfig(locale, builderRole).estimatedDurationMinutes)
  )
  const [categoryInputs, setCategoryInputs] = useState<CategoryInputState>(() =>
    createCategoryInputState(createInitialConfig(locale, builderRole).categories)
  )
  const [exams, setExams] = useState<StoredExamRecord[]>([])
  const [attemptExamRecords, setAttemptExamRecords] = useState<StoredExamRecord[]>([])
  const [attempts, setAttempts] = useState<StoredExamAttemptRecord[]>([])
  const [attemptProfiles, setAttemptProfiles] = useState<Record<string, UserProfile>>({})
  const [lectureOptions, setLectureOptions] = useState<LectureFileListItem[]>([])
  const [loadingLectures, setLoadingLectures] = useState(true)
  const [loadingExams, setLoadingExams] = useState(true)
  const [loadingAttempts, setLoadingAttempts] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lectureLoadError, setLectureLoadError] = useState('')
  const [requiresExamTableSetup, setRequiresExamTableSetup] = useState(false)
  const [activeView, setActiveView] = useState<ExamsView>('library')
  const [resultKindFilter, setResultKindFilter] = useState<ResultKindFilter>('all')
  const [selectedResultExamId, setSelectedResultExamId] = useState<string | null>(null)
  const [previewExamId, setPreviewExamId] = useState<string | null>(null)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)
  const [draftEditor, setDraftEditor] = useState<GeneratedExam | null>(null)
  const [draftEditorError, setDraftEditorError] = useState('')
  const [busyExamId, setBusyExamId] = useState<string | null>(null)
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null)

  useEffect(() => {
    setConfig((current) => ({ ...current, language: locale }))
  }, [locale])

  useEffect(() => {
    if (role !== 'teacher' && role !== 'student') return

    const initial = createInitialConfig(locale, role)
    setConfig((current) => ({
      ...current,
      title: current.title || initial.title,
      language: locale,
    }))
  }, [locale, role])

  const normalizedConfig = useMemo(
    () => buildNormalizedConfig(config, durationInput, categoryInputs),
    [categoryInputs, config, durationInput]
  )

  const totalQuestions = useMemo(
    () =>
      normalizedConfig.categories.reduce(
        (sum, category) => sum + category.count,
        0
      ),
    [normalizedConfig.categories]
  )

  const totalPoints = useMemo(
    () =>
      normalizedConfig.categories.reduce(
        (sum, category) => sum + category.count * category.points,
        0
      ),
    [normalizedConfig.categories]
  )

  const selectedLectureCount = config.selectedLectureIds.length

  const fetchExams = useCallback(async () => {
    if (!user || role === 'admin') {
      setExams([])
      setLoadingExams(false)
      return
    }

    setLoadingExams(true)

    try {
      const { data, error } = await supabase
        .from('exams')
        .select(EXAM_COLUMNS)
        .eq('user_id', user.id)
        .eq('exam_kind', role === 'teacher' ? 'official' : 'practice')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setExams((data as StoredExamRecord[]) || [])
      setRequiresExamTableSetup(false)
    } catch (err: unknown) {
      const message = getErrorMessage(err, t.loadError)

      if (isMissingExamsTableError(message)) {
        setRequiresExamTableSetup(true)
        setExams([])
        return
      }

      setAttemptExamRecords([])
      setError(message)
    } finally {
      setLoadingExams(false)
    }
  }, [role, supabase, t.loadError, user])

  const fetchLectureOptions = useCallback(async () => {
    if (!user || role === 'admin') {
      setLectureOptions([])
      setLectureLoadError('')
      setLoadingLectures(false)
      return
    }

    setLoadingLectures(true)
    setLectureLoadError('')

    try {
      const files = await listLectureFiles<LectureFileListItem>(
        supabase,
        user.id,
        EXAM_BUILDER_LECTURE_COLUMNS,
        role === 'student' ? 'visible' : 'own'
      )
      setLectureOptions(files)
      setConfig((current) => ({
        ...current,
        selectedLectureIds:
          current.selectedLectureIds.length > 0
            ? current.selectedLectureIds.filter((id) =>
                files.some((file) => file.id === id)
              )
            : files.map((file) => file.id),
      }))
    } catch (err: unknown) {
      setLectureOptions([])
      setLectureLoadError(getErrorMessage(err, t.lectureLoadError))
    } finally {
      setLoadingLectures(false)
    }
  }, [role, supabase, t.lectureLoadError, user])

  const fetchAttempts = useCallback(async () => {
    if (!user || role === 'admin') {
      setAttempts([])
      setAttemptExamRecords([])
      setAttemptProfiles({})
      setLoadingAttempts(false)
      return
    }

    setLoadingAttempts(true)

    try {
      let query = supabase
        .from('exam_attempts')
        .select(
          'id, exam_id, user_id, status, violations_count, objective_score, objective_max_score, attempt_payload, created_at'
        )
        .order('created_at', { ascending: false })

      if (role === 'teacher') {
        const examIds = exams.map((exam) => exam.id)

        if (!examIds.length) {
          setAttempts([])
          setAttemptProfiles({})
          return
        }

        query = query.in('exam_id', examIds)
      } else {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      const nextAttempts = (data as StoredExamAttemptRecord[]) || []
      setAttempts(nextAttempts)

      if (role === 'teacher') {
        setAttemptExamRecords([])
        const studentIds = Array.from(new Set(nextAttempts.map((attempt) => attempt.user_id).filter(Boolean)))

        if (!studentIds.length) {
          setAttemptProfiles({})
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, requested_role, created_at, updated_at')
          .in('id', studentIds)

        setAttemptProfiles(
          Object.fromEntries(
            ((profileData as UserProfile[] | null) || []).map((profile) => [profile.id, profile])
          )
        )
        return
      }

      if (role !== 'student') {
        setAttemptProfiles({})
        setAttemptExamRecords([])
        return
      }

      setAttemptProfiles({})

      const attemptedExamIds = Array.from(
        new Set(nextAttempts.map((attempt) => attempt.exam_id).filter(Boolean))
      )

      if (!attemptedExamIds.length) {
        setAttemptExamRecords([])
        return
      }

      const { data: examData } = await supabase
        .from('exams')
        .select(EXAM_COLUMNS)
        .in('id', attemptedExamIds)

      setAttemptExamRecords((examData as StoredExamRecord[]) || [])
    } catch (err: unknown) {
      const message = getErrorMessage(err, t.loadError)

      if (isMissingExamAttemptsTableError(message)) {
        setAttempts([])
        setAttemptExamRecords([])
        setAttemptProfiles({})
        return
      }

      setError(message)
    } finally {
      setLoadingAttempts(false)
    }
  }, [exams, role, supabase, t.loadError, user])

  useEffect(() => {
    void fetchExams()
  }, [fetchExams])

  useEffect(() => {
    void fetchLectureOptions()
  }, [fetchLectureOptions])

  useEffect(() => {
    void fetchAttempts()
  }, [fetchAttempts])

  const updateCategoryInput = (
    type: ExamQuestionType,
    field: 'count' | 'points',
    value: string
  ) => {
    const sanitized = sanitizeNumericInput(value)

    setCategoryInputs((current) => ({
      ...current,
      [type]: {
        ...current[type],
        [field]: sanitized,
      },
    }))
  }

  const commitDurationInput = () => {
    const normalizedDuration = normalizeDurationValue(
      durationInput,
      config.estimatedDurationMinutes
    )

    setDurationInput(String(normalizedDuration))
    setConfig((current) => ({
      ...current,
      estimatedDurationMinutes: normalizedDuration,
    }))
  }

  const commitCategoryInput = (
    type: ExamQuestionType,
    field: 'count' | 'points'
  ) => {
    const currentCategory = config.categories.find((category) => category.type === type)

    if (!currentCategory) return

    const normalizedValue = normalizeCategoryValue(
      field,
      categoryInputs[type][field],
      currentCategory[field]
    )

    setCategoryInputs((current) => ({
      ...current,
      [type]: {
        ...current[type],
        [field]: String(normalizedValue),
      },
    }))

    setConfig((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.type === type
          ? {
              ...category,
              [field]: normalizedValue,
            }
          : category
      ),
    }))
  }

  const toggleLectureSelection = (lectureId: string) => {
    setConfig((current) => {
      const isSelected = current.selectedLectureIds.includes(lectureId)

      return {
        ...current,
        selectedLectureIds: isSelected
          ? current.selectedLectureIds.filter((id) => id !== lectureId)
          : [...current.selectedLectureIds, lectureId],
      }
    })
  }

  const saveGeneratedExam = async (exam: GeneratedExam) => {
    if (!user) {
      throw new Error(t.sessionExpired)
    }

    const payload: GeneratedExam = {
      ...exam,
      totalPoints: exam.questions.reduce((sum, question) => sum + question.points, 0),
    }

    const publishedAt = isStudent ? new Date().toISOString() : null

    const { data, error } = await supabase
      .from('exams')
      .insert([
        {
          user_id: user.id,
          title: payload.title,
          description: payload.description,
          topic_focus: payload.topicFocus,
          difficulty: payload.difficulty,
          question_count: payload.questions.length,
          total_points: payload.totalPoints,
          estimated_duration_minutes: payload.estimatedDurationMinutes,
          status: isTeacher ? 'draft' : 'published',
          exam_kind: examKind,
          exam_payload: payload,
          published_at: publishedAt,
          live_until: null,
        },
      ])
      .select(EXAM_COLUMNS)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as StoredExamRecord
  }

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (generating || role === 'admin') return

    setGenerating(true)
    setError('')
    setSuccess('')

    const requestConfig = buildNormalizedConfig(config, durationInput, categoryInputs)
    setConfig(requestConfig)
    setDurationInput(String(requestConfig.estimatedDurationMinutes))
    setCategoryInputs(createCategoryInputState(requestConfig.categories))

    if (!requestConfig.title) {
      setGenerating(false)
      setError(t.titleRequired)
      return
    }

    if (requestConfig.title.length > MAX_EXAM_TITLE_CHARS) {
      setGenerating(false)
      setError(t.titleTooLong)
      return
    }

    if (requestConfig.topicFocus.length > MAX_TOPIC_FOCUS_CHARS) {
      setGenerating(false)
      setError(t.topicTooLong)
      return
    }

    if (totalQuestions > 30) {
      setGenerating(false)
      setError(t.tooManyQuestions)
      return
    }

    if (!requestConfig.selectedLectureIds.length && !requestConfig.topicFocus.trim()) {
      setGenerating(false)
      setError(t.lectureRequired)
      return
    }

    try {
      const response = await fetch('/api/exams/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestConfig),
      })

      const data = (await safeReadJson(response)) as { error?: string; exam?: GeneratedExam; contextAvailable?: boolean } | null

      if (response.status === 401 || response.status === 403) {
        throw new Error(t.sessionExpired)
      }

      if (!response.ok) {
        throw new Error(data?.error || t.requestFailed)
      }

      if (!data?.exam) {
        throw new Error(t.requestFailed)
      }

      const storedExam = await saveGeneratedExam(data.exam)
      setExams((current) => [storedExam, ...current])
      setRequiresExamTableSetup(false)
      setPreviewExamId(isTeacher ? storedExam.id : null)
      setSuccess(
        `${isTeacher ? t.draftReady : t.practiceReady}${data.contextAvailable ? '' : ` ${t.noContext}`}`
      )
      setActiveView('library')
    } catch (err: unknown) {
      const message = getErrorMessage(err, t.requestFailed)

      if (isMissingExamsTableError(message)) {
        setRequiresExamTableSetup(true)
        setError(t.setupNotice)
        return
      }

      setError(message)
    } finally {
      setGenerating(false)
    }
  }

  const handlePublishExam = async (exam: StoredExamRecord) => {
    if (!user) {
      setError(t.sessionExpired)
      return
    }

    if (!window.confirm(t.publishConfirm)) {
      return
    }

    setBusyExamId(exam.id)
    setError('')
    setSuccess('')

    const publishedAt = new Date()
    const liveUntil = new Date(
      publishedAt.getTime() + Math.max(1, exam.estimated_duration_minutes) * 60 * 1000
    )

    try {
      const { data, error } = await supabase
        .from('exams')
        .update({
          status: 'published',
          published_at: publishedAt.toISOString(),
          live_until: liveUntil.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', exam.id)
        .eq('user_id', user.id)
        .eq('exam_kind', 'official')
        .select(EXAM_COLUMNS)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      setExams((current) =>
        current.map((entry) => (entry.id === exam.id ? (data as StoredExamRecord) : entry))
      )
      setSuccess(t.publishSuccess)
    } catch (err: unknown) {
      setError(getErrorMessage(err, t.publishError))
    } finally {
      setBusyExamId(null)
    }
  }

  const handleDeleteExam = async (exam: StoredExamRecord) => {
    if (!user) {
      setError(t.sessionExpired)
      return
    }

    if (!window.confirm(t.deleteExamConfirm)) {
      return
    }

    setBusyExamId(exam.id)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', exam.id)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      setExams((current) => current.filter((entry) => entry.id !== exam.id))
      setAttempts((current) => current.filter((entry) => entry.exam_id !== exam.id))
      setSuccess(t.deleteSuccess)
    } catch (err: unknown) {
      setError(getErrorMessage(err, t.deleteError))
    } finally {
      setBusyExamId(null)
    }
  }

  const updateDraftQuestion = (
    questionId: string,
    updater: (question: ExamQuestion) => ExamQuestion
  ) => {
    setDraftEditor((current) =>
      current
        ? {
            ...current,
            questions: current.questions.map((question) =>
              question.id === questionId ? updater(question) : question
            ),
          }
        : current
    )
    setDraftEditorError('')
  }

  const updateDraftQuestionPrompt = (questionId: string, prompt: string) => {
    updateDraftQuestion(questionId, (question) => ({
      ...question,
      prompt,
    } as ExamQuestion))
  }

  const updateDraftQuestionPoints = (questionId: string, value: string) => {
    const nextPoints = clampNumber(
      parseIntegerInput(sanitizeNumericInput(value)) ?? MIN_CATEGORY_POINTS,
      MIN_CATEGORY_POINTS,
      MAX_CATEGORY_POINTS
    )

    updateDraftQuestion(questionId, (question) => ({
      ...question,
      points: nextPoints,
    } as ExamQuestion))
  }

  const removeDraftQuestion = (questionId: string) => {
    setDraftEditor((current) =>
      current
        ? {
            ...current,
            questions: current.questions.filter((question) => question.id !== questionId),
          }
        : current
    )
    setDraftEditorError('')
  }

  const updateDraftOption = (questionId: string, optionIndex: number, value: string) => {
    updateDraftQuestion(questionId, (question) => {
      if (question.type !== 'multiple_choice') return question

      const previousOption = question.options[optionIndex]
      const options = question.options.map((option, index) =>
        index === optionIndex ? value : option
      )

      return {
        ...question,
        options,
        correctAnswer:
          question.correctAnswer === previousOption ? value : question.correctAnswer,
      }
    })
  }

  const addDraftOption = (questionId: string) => {
    updateDraftQuestion(questionId, (question) => {
      if (question.type !== 'multiple_choice') return question

      return {
        ...question,
        options: [...question.options, `Option ${question.options.length + 1}`],
      }
    })
  }

  const removeDraftOption = (questionId: string, optionIndex: number) => {
    updateDraftQuestion(questionId, (question) => {
      if (question.type !== 'multiple_choice' || question.options.length <= 2) {
        return question
      }

      const removedOption = question.options[optionIndex]
      const options = question.options.filter((_, index) => index !== optionIndex)

      return {
        ...question,
        options,
        correctAnswer:
          question.correctAnswer === removedOption || !options.includes(question.correctAnswer)
            ? options[0] || ''
            : question.correctAnswer,
      }
    })
  }

  const updateDraftFillAnswer = (questionId: string, value: string) => {
    updateDraftQuestion(questionId, (question) =>
      question.type === 'fill_in_blank'
        ? {
            ...question,
            correctAnswer: value,
          }
        : question
    )
  }

  const updateDraftAcceptableAnswer = (
    questionId: string,
    answerIndex: number,
    value: string
  ) => {
    updateDraftQuestion(questionId, (question) =>
      question.type === 'fill_in_blank'
        ? {
            ...question,
            acceptableAnswers: question.acceptableAnswers.map((answer, index) =>
              index === answerIndex ? value : answer
            ),
          }
        : question
    )
  }

  const addDraftAcceptableAnswer = (questionId: string) => {
    updateDraftQuestion(questionId, (question) =>
      question.type === 'fill_in_blank'
        ? {
            ...question,
            acceptableAnswers: [...question.acceptableAnswers, ''],
          }
        : question
    )
  }

  const removeDraftAcceptableAnswer = (questionId: string, answerIndex: number) => {
    updateDraftQuestion(questionId, (question) =>
      question.type === 'fill_in_blank'
        ? {
            ...question,
            acceptableAnswers: question.acceptableAnswers.filter((_, index) => index !== answerIndex),
          }
        : question
    )
  }

  const updateDraftOpenEndedField = (
    questionId: string,
    field: 'sampleAnswer',
    value: string
  ) => {
    updateDraftQuestion(questionId, (question) =>
      question.type === 'open_ended'
        ? {
            ...question,
            [field]: value,
          }
        : question
    )
  }

  const updateDraftGradingNote = (
    questionId: string,
    noteIndex: number,
    value: string
  ) => {
    updateDraftQuestion(questionId, (question) =>
      question.type === 'open_ended'
        ? {
            ...question,
            gradingNotes: question.gradingNotes.map((note, index) =>
              index === noteIndex ? value : note
            ),
          }
        : question
    )
  }

  const addDraftGradingNote = (questionId: string) => {
    updateDraftQuestion(questionId, (question) =>
      question.type === 'open_ended'
        ? {
            ...question,
            gradingNotes: [...question.gradingNotes, ''],
          }
        : question
    )
  }

  const removeDraftGradingNote = (questionId: string, noteIndex: number) => {
    updateDraftQuestion(questionId, (question) =>
      question.type === 'open_ended'
        ? {
            ...question,
            gradingNotes: question.gradingNotes.filter((_, index) => index !== noteIndex),
          }
        : question
    )
  }

  const cancelDraftEdit = () => {
    setEditingExamId(null)
    setDraftEditor(null)
    setDraftEditorError('')
  }

  const startEditingDraft = (exam: StoredExamRecord) => {
    setEditingExamId(exam.id)
    setDraftEditor(cloneDraftExam(exam.exam_payload))
    setDraftEditorError('')
    setPreviewExamId(exam.id)
  }

  const handleSaveDraft = async (exam: StoredExamRecord) => {
    if (!user) {
      setError(t.sessionExpired)
      return
    }

    if (!draftEditor) {
      setDraftEditorError(t.invalidDraftJson)
      return
    }

    setDraftEditorError('')
    setBusyExamId(exam.id)
    setError('')
    setSuccess('')

    try {
      const payload = normalizeDraftExam(draftEditor)

      const { data, error } = await supabase
        .from('exams')
        .update({
          title: payload.title,
          description: payload.description,
          topic_focus: payload.topicFocus,
          difficulty: payload.difficulty,
          question_count: payload.questions.length,
          total_points: payload.totalPoints,
          estimated_duration_minutes: payload.estimatedDurationMinutes,
          exam_payload: payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', exam.id)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .select(EXAM_COLUMNS)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      setExams((current) =>
        current.map((entry) => (entry.id === exam.id ? (data as StoredExamRecord) : entry))
      )
      setEditingExamId(null)
      setDraftEditor(null)
      setSuccess(t.draftSaved)
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Invalid draft') {
        setDraftEditorError(t.invalidDraftJson)
      } else {
        setError(getErrorMessage(err, t.draftSaveError))
      }
    } finally {
      setBusyExamId(null)
    }
  }

  const handleDeleteAttempt = async (attempt: StoredExamAttemptRecord) => {
    if (!user) {
      setError(t.sessionExpired)
      return
    }

    if (!window.confirm(t.deleteResultConfirm)) {
      return
    }

    setDeletingAttemptId(attempt.id)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('exam_attempts')
        .delete()
        .eq('id', attempt.id)

      if (error) {
        throw new Error(error.message)
      }

      setAttempts((current) => current.filter((entry) => entry.id !== attempt.id))
      setSuccess(t.deleteResultSuccess)
    } catch (err: unknown) {
      setError(getErrorMessage(err, t.deleteResultError))
    } finally {
      setDeletingAttemptId(null)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'

    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const examMap = useMemo(
    () => new Map([...attemptExamRecords, ...exams].map((exam) => [exam.id, exam])),
    [attemptExamRecords, exams]
  )

  const practiceExamIds = useMemo(
    () => new Set(exams.filter((exam) => exam.exam_kind === 'practice').map((exam) => exam.id)),
    [exams]
  )

  const getAttemptExamKind = useCallback(
    (attempt: StoredExamAttemptRecord): ExamKind => {
      const payloadKind = attempt.attempt_payload.examKind
      if (payloadKind === 'official' || payloadKind === 'practice') {
        return payloadKind
      }

      const exam = examMap.get(attempt.exam_id)
      if (exam?.exam_kind === 'official' || exam?.exam_kind === 'practice') {
        return exam.exam_kind
      }

      return role === 'student' && !practiceExamIds.has(attempt.exam_id)
        ? 'official'
        : 'practice'
    },
    [examMap, practiceExamIds, role]
  )

  const getAttemptExamTitle = useCallback(
    (attempt: StoredExamAttemptRecord) => {
      const examKind = getAttemptExamKind(attempt)

      return (
        attempt.attempt_payload.examTitle?.trim() ||
        examMap.get(attempt.exam_id)?.title ||
        (examKind === 'official' ? t.officialExam : t.practiceExam)
      )
    },
    [examMap, getAttemptExamKind, t.officialExam, t.practiceExam]
  )

  const filteredAttempts = useMemo(
    () =>
      attempts.filter((attempt) =>
        resultKindFilter === 'all'
          ? true
          : getAttemptExamKind(attempt) === resultKindFilter
      ),
    [attempts, getAttemptExamKind, resultKindFilter]
  )

  const teacherResultExams = useMemo(
    () => exams.filter((exam) => exam.exam_kind === 'official'),
    [exams]
  )

  useEffect(() => {
    if (!isTeacher) {
      setSelectedResultExamId(null)
      return
    }

    if (!teacherResultExams.length) {
      setSelectedResultExamId(null)
      return
    }

    setSelectedResultExamId((current) => {
      if (current && teacherResultExams.some((exam) => exam.id === current)) {
        return current
      }

      return teacherResultExams.find((exam) => attempts.some((attempt) => attempt.exam_id === exam.id))?.id
        || teacherResultExams[0].id
    })
  }, [attempts, isTeacher, teacherResultExams])

  const teacherExamSummaries = useMemo(
    () =>
      teacherResultExams.map((exam) => {
        const examAttempts = attempts.filter((attempt) => attempt.exam_id === exam.id)
        const uniqueStudents = new Set(examAttempts.map((attempt) => attempt.user_id))
        const latestAttempt = examAttempts[0] ?? null
        const averageScore =
          examAttempts.length > 0
            ? Math.round(
                examAttempts.reduce((sum, attempt) => {
                  const maxScore = attempt.objective_max_score || 1
                  return sum + (attempt.objective_score / maxScore) * 100
                }, 0) / examAttempts.length
              )
            : null

        return {
          exam,
          attempts: examAttempts,
          studentCount: uniqueStudents.size,
          latestAttempt,
          averageScore,
        }
      }),
    [attempts, teacherResultExams]
  )

  const selectedResultExam = useMemo(
    () => teacherResultExams.find((exam) => exam.id === selectedResultExamId) ?? null,
    [selectedResultExamId, teacherResultExams]
  )

  const selectedExamAttempts = useMemo(
    () => attempts.filter((attempt) => attempt.exam_id === selectedResultExamId),
    [attempts, selectedResultExamId]
  )

  const selectedStudentResultGroups = useMemo(() => {
    const grouped = new Map<string, StoredExamAttemptRecord[]>()

    selectedExamAttempts.forEach((attempt) => {
      grouped.set(attempt.user_id, [...(grouped.get(attempt.user_id) ?? []), attempt])
    })

    return Array.from(grouped.entries()).map(([userId, userAttempts]) => ({
      userId,
      profile: attemptProfiles[userId],
      attempts: userAttempts.sort(
        (first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime()
      ),
    }))
  }, [attemptProfiles, selectedExamAttempts])

  const getStudentDisplayName = (profile: UserProfile | undefined) =>
    profile?.full_name?.trim() || profile?.email?.trim() || t.studentNameFallback

  const viewTabs: Array<{ key: ExamsView; label: string }> = [
    { key: 'library', label: t.libraryTab },
    { key: 'builder', label: t.builderTab },
    { key: 'results', label: t.resultsTab },
  ]

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="spinner-arc h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <section className="surface animate-fadeInScale p-7 sm:p-9">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {t.sessionExpired}
          </h1>
          <Link href="/login" className="primary-button mt-6 inline-flex justify-center">
            {t.signIn}
          </Link>
        </section>
      </div>
    )
  }

  if (role === 'admin') {
    return (
      <div className="mx-auto max-w-5xl space-y-5 pb-4">
        <section className="surface animate-fadeInScale p-6 sm:p-8 lg:p-10">
          <Link href="/dashboard" className="secondary-button px-4 py-2">
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
          <span className="eyebrow mt-5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.adminBadge}
          </span>
          <h1 className="page-title mt-5 max-w-4xl">{t.adminTitle}</h1>
          <p className="page-copy mt-4 max-w-3xl">{t.adminBody}</p>
          <Link href="/dashboard/admin" className="primary-button mt-6">
            <ShieldCheck className="h-4 w-4" />
            {t.adminCta}
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-4">
      <section className="surface animate-fadeInScale p-6 sm:p-8 lg:p-10">
        <Link href="/dashboard" className="secondary-button px-4 py-2">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
        <span className="eyebrow mt-5">
          {isTeacher ? <Radio className="h-3.5 w-3.5" /> : <WandSparkles className="h-3.5 w-3.5" />}
          {isTeacher ? t.teacherBadge : t.studentBadge}
        </span>
        <h1 className="page-title mt-5 max-w-4xl">
          {isTeacher ? t.teacherTitle : t.studentTitle}
        </h1>
        <p className="page-copy mt-4 max-w-3xl">
          {isTeacher ? t.teacherBody : t.studentBody}
        </p>
      </section>

      <section className="surface animate-fadeInScale p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {activeView === 'builder'
                ? t.setupTitle
                : activeView === 'library'
                  ? isTeacher
                    ? t.savedTitleTeacher
                    : t.savedTitleStudent
                  : isTeacher
                    ? t.resultsTitleTeacher
                    : t.resultsTitleStudent}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {activeView === 'builder'
                ? t.setupBody
                : activeView === 'library'
                  ? isTeacher
                    ? t.savedBodyTeacher
                    : t.savedBodyStudent
                  : isTeacher
                    ? t.resultsBodyTeacher
                    : t.resultsBodyStudent}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {viewTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveView(tab.key)}
                className={`secondary-button px-4 py-2 ${
                  activeView === tab.key
                    ? 'border-[rgba(var(--color-primary-rgb),0.35)] bg-[var(--accent-soft)] text-[var(--accent)]'
                    : ''
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="surface-muted animate-fadeInUp border-rose-200/70 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {success && (
        <div className="surface-muted animate-success-pop border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
          {success}
        </div>
      )}

      {requiresExamTableSetup && (
        <div className="surface-muted animate-fadeInUp border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
          <p>{t.setupNotice}</p>
          <p className="mt-2 text-xs text-amber-700/90 dark:text-amber-200/80">{t.setupHint}</p>
        </div>
      )}

      {activeView === 'builder' && (
        <form
          onSubmit={handleGenerate}
          className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]"
        >
          <section className="surface animate-fadeInScale p-6 sm:p-7">
            <div className="card-header-divider">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {t.setupTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t.setupBody}
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t.examTitle}
                </span>
                <input
                  value={config.title}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, title: event.target.value }))
                  }
                  className="field-input px-4"
                  maxLength={MAX_EXAM_TITLE_CHARS}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {config.title.length}/{MAX_EXAM_TITLE_CHARS}
                </p>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t.topicFocus}
                </span>
                <textarea
                  value={config.topicFocus}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      topicFocus: event.target.value,
                    }))
                  }
                  className="field-input min-h-28 resize-none px-4"
                  placeholder={t.topicPlaceholder}
                  maxLength={MAX_TOPIC_FOCUS_CHARS}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {config.topicFocus.length}/{MAX_TOPIC_FOCUS_CHARS}
                </p>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t.difficulty}
                  </span>
                  <select
                    value={config.difficulty}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        difficulty: event.target.value as ExamDifficulty,
                      }))
                    }
                    className="field-input px-4"
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option} value={option}>
                        {t[option]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t.duration}
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={durationInput}
                      onChange={(event) => setDurationInput(sanitizeNumericInput(event.target.value))}
                      onBlur={commitDurationInput}
                      className="field-input px-4 pr-24"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                      {t.minutes}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section className="surface animate-fadeInScale p-6 sm:p-7">
            <div className="surface-muted mb-6 p-4">
              <div className="card-header-divider flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t.lectureScopeTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {t.lectureScopeBody}
                  </p>
                </div>
                <span className="status-pill">
                  <FileText className="h-3.5 w-3.5" />
                  {selectedLectureCount} {t.selectedLectures.toLowerCase()}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfig((current) => ({
                      ...current,
                      selectedLectureIds: lectureOptions.map((lecture) => lecture.id),
                    }))
                  }
                  disabled={!lectureOptions.length}
                  className="secondary-button px-4 py-2 disabled:opacity-50"
                >
                  {t.selectAllLectures}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((current) => ({ ...current, selectedLectureIds: [] }))
                  }
                  disabled={!selectedLectureCount}
                  className="secondary-button px-4 py-2 disabled:opacity-50"
                >
                  {t.clearLectures}
                </button>
              </div>

              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {lectureLoadError ? (
                  <div className="surface-muted border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                    <p>{lectureLoadError}</p>
                    <button
                      type="button"
                      onClick={() => void fetchLectureOptions()}
                      className="secondary-button mt-3 px-4 py-2"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      {t.retryLectures}
                    </button>
                  </div>
                ) : null}

                {loadingLectures ? (
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="spinner-arc h-4 w-4" />
                    {t.lectureLoading}
                  </div>
                ) : lectureLoadError ? null : lectureOptions.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {t.lectureEmpty}
                  </div>
                ) : (
                  lectureOptions.map((lecture) => {
                    const isSelected = config.selectedLectureIds.includes(lecture.id)

                    return (
                      <label
                        key={lecture.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent-soft)]/60 shadow-depth-sm'
                            : 'border-[var(--border)] bg-white/30 hover:translate-x-1 hover:bg-white/60 dark:bg-slate-900/20 dark:hover:bg-slate-900/55'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLectureSelection(lecture.id)}
                          className="mt-1 h-4 w-4 accent-[var(--accent)]"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {lecture.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {lecture.file_type.split('/').pop()?.toUpperCase() || 'FILE'}
                          </p>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {t.categoriesTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {t.categoriesBody}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {config.categories.map((category) => {
                const meta = EXAM_CATEGORY_META[category.type]

                return (
                  <article key={category.type} className={`surface-muted border-l-4 p-4 ${questionAccentClasses[category.type]}`}>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {meta.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {meta.helper}
                    </p>

                    <div className="mt-4 space-y-3">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {t.count}
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={categoryInputs[category.type].count}
                          onChange={(event) =>
                            updateCategoryInput(category.type, 'count', event.target.value)
                          }
                          onBlur={() => commitCategoryInput(category.type, 'count')}
                          className="field-input px-4"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {t.points}
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={categoryInputs[category.type].points}
                          onChange={(event) =>
                            updateCategoryInput(category.type, 'points', event.target.value)
                          }
                          onBlur={() => commitCategoryInput(category.type, 'points')}
                          className="field-input px-4"
                        />
                      </label>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t.totalQuestions}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {totalQuestions}
                </p>
              </div>
              <div className="surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t.totalPoints}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {totalPoints}
                </p>
              </div>
              <div className="surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t.totalDuration}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {normalizedConfig.estimatedDurationMinutes} {t.minutes}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={generating || totalQuestions < 1 || totalQuestions > 30}
                className={`primary-button justify-center shadow-depth-md ${generating ? 'button-shimmer' : ''}`}
              >
                {generating ? (
                  <>
                    <span className="spinner-arc h-4 w-4" />
                    {t.generating}
                  </>
                ) : (
                  <>
                    <WandSparkles className="h-4 w-4" />
                    {isTeacher ? t.generateTeacher : t.generateStudent}
                  </>
                )}
              </button>
            </div>
          </section>
        </form>
      )}

      {activeView === 'library' && (
        <section className="surface animate-fadeInScale overflow-hidden">
          <div className="card-header-divider px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isTeacher ? t.savedTitleTeacher : t.savedTitleStudent}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isTeacher ? t.savedBodyTeacher : t.savedBodyStudent}
            </p>
          </div>

          {loadingExams ? (
            <div className="flex min-h-56 items-center justify-center p-6">
              <span className="spinner-arc h-8 w-8" />
            </div>
          ) : requiresExamTableSetup ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.setupNotice}
            </div>
          ) : exams.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isTeacher ? t.emptySavedTeacher : t.emptySavedStudent}
              </p>
              <button
                type="button"
                onClick={() => setActiveView('builder')}
                className="primary-button mt-5"
              >
                {t.openBuilder}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 p-6 lg:grid-cols-2">
              {exams.map((exam, index) => {
                const isPreviewing = previewExamId === exam.id
                const isEditing = editingExamId === exam.id
                const isDraft = exam.status === 'draft'
                const liveState = formatLiveState(exam, t.live, t.expired)

                return (
                  <article
                    key={exam.id}
                    style={{ '--i': index } as CSSProperties}
                    className="surface-muted animate-fadeInUp p-5 [animation-delay:calc(var(--i)*50ms)] [animation-fill-mode:both]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {exam.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {exam.description || exam.topic_focus || ' '}
                        </p>
                      </div>
                      <span className="status-pill">
                        {isDraft ? t.draft : isTeacher ? liveState : t.practice}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {t.totalQuestions}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                          {exam.question_count}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {t.totalPoints}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                          {exam.total_points}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {t.totalDuration}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                          {exam.estimated_duration_minutes}m
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <span>{isDraft ? t.draftedOn : t.publishedOn}</span>
                      <span>{formatDate(isDraft ? exam.created_at : exam.published_at || exam.created_at)}</span>
                      {exam.live_until && (
                        <>
                          <span>{t.liveUntil}</span>
                          <span>{formatDate(exam.live_until)}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      {isStudent && (
                        <Link href={`/exam/${exam.id}`} className="primary-button w-full justify-center">
                          <Play className="h-4 w-4" />
                          {t.startExam}
                        </Link>
                      )}

                      {isTeacher && (
                        <button
                          type="button"
                          onClick={() => setPreviewExamId(isPreviewing ? null : exam.id)}
                          className="secondary-button w-full justify-center"
                        >
                          <Eye className="h-4 w-4" />
                          {isPreviewing ? t.hidePreview : t.preview}
                        </button>
                      )}

                      {isTeacher && isDraft && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditingDraft(exam)}
                            className="secondary-button w-full justify-center"
                          >
                            <PencilLine className="h-4 w-4" />
                            {t.editDraft}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handlePublishExam(exam)}
                            disabled={busyExamId === exam.id}
                            className="primary-button w-full justify-center"
                          >
                            {busyExamId === exam.id ? (
                              <span className="spinner-arc h-4 w-4" />
                            ) : (
                              <Radio className="h-4 w-4" />
                            )}
                            {t.publishLive}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleDeleteExam(exam)}
                        disabled={busyExamId === exam.id}
                        data-destructive="true"
                        className="secondary-button w-full justify-center text-rose-600 dark:text-rose-300"
                      >
                        {busyExamId === exam.id ? (
                          <span className="spinner-arc h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {t.deleteExam}
                      </button>
                    </div>

                    {isEditing && draftEditor && (
                      <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white/45 p-4 dark:bg-slate-950/35">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {t.editDraft}
                          </p>
                          <button
                            type="button"
                            onClick={cancelDraftEdit}
                            className="secondary-button px-3 py-2"
                          >
                            <X className="h-4 w-4" />
                            {t.cancelEdit}
                          </button>
                        </div>

                        <div className="mt-4 space-y-4">
                          <section className="rounded-2xl border border-[var(--border)] bg-white/55 p-4 dark:bg-slate-950/30">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                {t.editorQuestions}
                              </p>
                              <span className="status-pill">
                                {draftEditor.questions.length} {t.totalQuestions.toLowerCase()}
                              </span>
                            </div>

                            <div className="mt-4 space-y-4">
                              {draftEditor.questions.map((question, questionIndex) => (
                                <article
                                  key={question.id}
                                  className={`rounded-2xl border border-[var(--border)] border-l-4 bg-white/70 p-4 dark:bg-slate-950/35 ${questionAccentClasses[question.type]}`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="status-pill">
                                        {questionIndex + 1}. {EXAM_CATEGORY_META[question.type].label}
                                      </span>
                                      <label className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-3 py-1.5 text-sm dark:bg-slate-950/50">
                                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                          {t.pointsLabel}
                                        </span>
                                        <input
                                          type="number"
                                          min={MIN_CATEGORY_POINTS}
                                          max={MAX_CATEGORY_POINTS}
                                          value={question.points}
                                          onChange={(event) =>
                                            updateDraftQuestionPoints(question.id, event.target.value)
                                          }
                                          className="w-14 bg-transparent text-sm font-semibold text-slate-900 outline-none dark:text-white"
                                        />
                                      </label>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => removeDraftQuestion(question.id)}
                                      disabled={draftEditor.questions.length <= 1}
                                      data-destructive="true"
                                      className="secondary-button px-3 py-2 text-rose-600 disabled:opacity-40 dark:text-rose-300"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t.removeQuestion}
                                    </button>
                                  </div>

                                  <label className="mt-4 block space-y-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                      {t.questionPrompt}
                                    </span>
                                    <textarea
                                      value={question.prompt}
                                      onChange={(event) =>
                                        updateDraftQuestionPrompt(question.id, event.target.value)
                                      }
                                      className="field-input min-h-24 resize-y px-4 py-3"
                                    />
                                  </label>

                                  {question.type === 'multiple_choice' && (
                                    <div className="mt-4 space-y-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        {t.options}
                                      </p>
                                      {question.options.map((option, optionIndex) => {
                                        const isCorrectOption = question.correctAnswer === option

                                        return (
                                          <div
                                            key={`${question.id}-option-${optionIndex}`}
                                            className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                                          >
                                            <span
                                              title={isCorrectOption ? t.correctAnswer : t.options}
                                              className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                                                isCorrectOption
                                                  ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-300/40 dark:bg-teal-400/15 dark:text-teal-200'
                                                  : 'border-[var(--border)] bg-white/80 text-slate-400 dark:bg-slate-950/50 dark:text-slate-500'
                                              }`}
                                            >
                                              {isCorrectOption ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                              ) : (
                                                <span className="h-2 w-2 rounded-full bg-current" />
                                              )}
                                              <span className="sr-only">
                                                {isCorrectOption ? t.correctAnswer : t.options}
                                              </span>
                                            </span>
                                            <input
                                              value={option}
                                              onChange={(event) =>
                                                updateDraftOption(question.id, optionIndex, event.target.value)
                                              }
                                              className="field-input px-4"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => removeDraftOption(question.id, optionIndex)}
                                              disabled={question.options.length <= 2}
                                              aria-label={t.removeOption}
                                              className="secondary-button h-11 px-3 text-rose-600 disabled:opacity-40 dark:text-rose-300"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        )
                                      })}
                                      <button
                                        type="button"
                                        onClick={() => addDraftOption(question.id)}
                                        className="secondary-button"
                                      >
                                        <Plus className="h-4 w-4" />
                                        {t.addOption}
                                      </button>
                                    </div>
                                  )}

                                  {question.type === 'fill_in_blank' && (
                                    <div className="mt-4 grid gap-3">
                                      <label className="space-y-2">
                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                          {t.answerText}
                                        </span>
                                        <input
                                          value={question.correctAnswer}
                                          onChange={(event) =>
                                            updateDraftFillAnswer(question.id, event.target.value)
                                          }
                                          className="field-input px-4"
                                        />
                                      </label>

                                      <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                          {t.acceptedAnswers}
                                        </p>
                                        {question.acceptableAnswers.map((answer, answerIndex) => (
                                          <div
                                            key={`${question.id}-answer-${answerIndex}`}
                                            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                                          >
                                            <input
                                              value={answer}
                                              onChange={(event) =>
                                                updateDraftAcceptableAnswer(
                                                  question.id,
                                                  answerIndex,
                                                  event.target.value
                                                )
                                              }
                                              className="field-input px-4"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                removeDraftAcceptableAnswer(question.id, answerIndex)
                                              }
                                              aria-label={t.removeOption}
                                              className="secondary-button h-11 px-3 text-rose-600 dark:text-rose-300"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => addDraftAcceptableAnswer(question.id)}
                                          className="secondary-button"
                                        >
                                          <Plus className="h-4 w-4" />
                                          {t.addAcceptedAnswer}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {question.type === 'open_ended' && (
                                    <div className="mt-4 grid gap-3">
                                      <label className="space-y-2">
                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                          {t.sampleAnswer}
                                        </span>
                                        <textarea
                                          value={question.sampleAnswer}
                                          onChange={(event) =>
                                            updateDraftOpenEndedField(question.id, 'sampleAnswer', event.target.value)
                                          }
                                          className="field-input min-h-24 resize-y px-4 py-3"
                                        />
                                      </label>

                                      <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                          {t.gradingNotes}
                                        </p>
                                        {question.gradingNotes.map((note, noteIndex) => (
                                          <div
                                            key={`${question.id}-note-${noteIndex}`}
                                            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                                          >
                                            <input
                                              value={note}
                                              onChange={(event) =>
                                                updateDraftGradingNote(
                                                  question.id,
                                                  noteIndex,
                                                  event.target.value
                                                )
                                              }
                                              className="field-input px-4"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => removeDraftGradingNote(question.id, noteIndex)}
                                              aria-label={t.removeOption}
                                              className="secondary-button h-11 px-3 text-rose-600 dark:text-rose-300"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => addDraftGradingNote(question.id)}
                                          className="secondary-button"
                                        >
                                          <Plus className="h-4 w-4" />
                                          {t.addGradingNote}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </article>
                              ))}
                            </div>
                          </section>
                        </div>

                        {draftEditorError && (
                          <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">
                            {draftEditorError}
                          </p>
                        )}

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={cancelDraftEdit}
                            className="secondary-button justify-center"
                          >
                            <X className="h-4 w-4" />
                            {t.cancelEdit}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSaveDraft(exam)}
                            disabled={busyExamId === exam.id}
                            className="primary-button justify-center"
                          >
                            {busyExamId === exam.id ? (
                              <span className="spinner-arc h-4 w-4" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            {t.saveDraft}
                          </button>
                        </div>
                      </div>
                    )}

                    {isTeacher && isPreviewing && (
                      <ExamQuestionPreview
                        exam={exam.exam_payload}
                        labels={{
                          correctAnswer: t.correctAnswer,
                          sampleAnswer: t.sampleAnswer,
                          options: t.options,
                        }}
                      />
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {activeView === 'results' && (
        <section className="surface animate-fadeInScale overflow-hidden">
          <div className="card-header-divider px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isTeacher ? t.resultsTitleTeacher : t.resultsTitleStudent}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isTeacher ? t.resultsBodyTeacher : t.resultsBodyStudent}
            </p>
            {isStudent && (
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { key: 'all' as const, label: t.allResults },
                  { key: 'official' as const, label: t.officialResults },
                  { key: 'practice' as const, label: t.practiceResults },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setResultKindFilter(filter.key)}
                    className={`secondary-button px-4 py-2 ${
                      resultKindFilter === filter.key
                        ? 'border-[rgba(var(--color-primary-rgb),0.35)] bg-[var(--accent-soft)] text-[var(--accent)]'
                        : ''
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingAttempts ? (
            <div className="flex min-h-56 items-center justify-center p-6">
              <span className="spinner-arc h-8 w-8" />
            </div>
          ) : isTeacher ? (
            teacherExamSummaries.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                {t.noExamResults}
              </div>
            ) : (
              <div className="grid gap-5 p-6 lg:grid-cols-[0.82fr_1.18fr]">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {t.resultExamPicker}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {t.resultExamPickerBody}
                    </p>
                  </div>

                  {teacherExamSummaries.map((summary) => {
                    const selected = selectedResultExamId === summary.exam.id

                    return (
                      <button
                        key={summary.exam.id}
                        type="button"
                        onClick={() => setSelectedResultExamId(summary.exam.id)}
                        className={`w-full rounded-[26px] border p-4 text-left transition ${
                          selected
                            ? 'border-[rgba(var(--color-primary-rgb),0.42)] bg-[var(--accent-soft)] shadow-depth-sm'
                            : 'border-[var(--border)] bg-white/70 hover:border-[rgba(var(--color-primary-rgb),0.28)] hover:bg-white dark:bg-slate-900/45 dark:hover:bg-slate-900/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                              {summary.exam.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {t.resultLatestSubmission}: {summary.latestAttempt ? formatDate(summary.latestAttempt.created_at) : '-'}
                            </p>
                          </div>
                          {selected && <span className="status-pill">{t.selectedExam}</span>}
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="rounded-2xl border border-[var(--border)] bg-white/65 px-3 py-2 dark:bg-slate-950/35">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              {t.resultAttempts}
                            </p>
                            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{summary.attempts.length}</p>
                          </div>
                          <div className="rounded-2xl border border-[var(--border)] bg-white/65 px-3 py-2 dark:bg-slate-950/35">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              {t.resultStudents}
                            </p>
                            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{summary.studentCount}</p>
                          </div>
                          <div className="rounded-2xl border border-[var(--border)] bg-white/65 px-3 py-2 dark:bg-slate-950/35">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              {t.resultAverageScore}
                            </p>
                            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                              {summary.averageScore === null ? '-' : `${summary.averageScore}%`}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="rounded-[30px] border border-[var(--border)] bg-white/58 p-5 dark:bg-slate-950/35">
                  <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {t.studentResult}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                        {selectedResultExam?.title ?? t.officialExam}
                      </h3>
                    </div>
                    <span className="status-pill">
                      {selectedExamAttempts.length} {t.resultAttempts.toLowerCase()}
                    </span>
                  </div>

                  {selectedStudentResultGroups.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      {t.noStudentResults}
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {selectedStudentResultGroups.map((group) => (
                        <article key={group.userId} className="surface-muted p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {getStudentDisplayName(group.profile)}
                              </h4>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {group.profile?.email || t.studentEmailMissing}
                              </p>
                              <p className="mt-2 max-w-full break-all text-xs text-slate-400 dark:text-slate-500">
                                {t.userIdLabel}: {group.userId}
                              </p>
                            </div>
                            <span className="status-pill">
                              {group.attempts.length} {t.resultAttempts.toLowerCase()}
                            </span>
                          </div>

                          <div className="mt-5 space-y-3">
                            {group.attempts.map((attempt, attemptIndex) => (
                              <div key={attempt.id} className="rounded-[24px] border border-[var(--border)] bg-white/72 p-4 dark:bg-slate-950/35">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                      {t.attemptLabel} {group.attempts.length - attemptIndex}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                      {t.attemptSubmitted}: {formatDate(attempt.created_at)}
                                    </p>
                                  </div>
                                  <span className="status-pill">{attempt.status}</span>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                                  <div className="rounded-2xl border border-[var(--border)] px-3 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                      {t.attemptScore}
                                    </p>
                                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                                      {attempt.objective_score}/{attempt.objective_max_score}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-[var(--border)] px-3 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                      {t.answersSubmitted}
                                    </p>
                                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                                      {attempt.attempt_payload.answeredCount}/{attempt.attempt_payload.totalQuestions}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-[var(--border)] px-3 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                      {t.attemptViolations}
                                    </p>
                                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                                      {attempt.violations_count}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteAttempt(attempt)}
                                    disabled={deletingAttemptId === attempt.id}
                                    data-destructive="true"
                                    className="secondary-button justify-center text-rose-600 dark:text-rose-300"
                                  >
                                    {deletingAttemptId === attempt.id ? (
                                      <span className="spinner-arc h-4 w-4" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                    {t.deleteResult}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          ) : filteredAttempts.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.noAttempts}
            </div>
          ) : (
            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredAttempts.map((attempt) => {
                const examKind = getAttemptExamKind(attempt)

                return (
                  <article key={attempt.id} className="surface-muted p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {getAttemptExamTitle(attempt)}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {t.attemptSubmitted}: {formatDate(attempt.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="status-pill">
                          {examKind === 'official' ? t.officialResults : t.practiceResults}
                        </span>
                        <span className="status-pill">{attempt.status}</span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {t.attemptScore}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                          {attempt.objective_score}/{attempt.objective_max_score}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {t.attemptViolations}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                          {attempt.violations_count}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {t.answersSubmitted}
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                          {attempt.attempt_payload.answeredCount}/{attempt.attempt_payload.totalQuestions}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {t.attemptStatus}
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                          {attempt.status}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleDeleteAttempt(attempt)}
                      disabled={deletingAttemptId === attempt.id}
                      data-destructive="true"
                      className="secondary-button mt-4 w-full justify-center text-rose-600 dark:text-rose-300"
                    >
                      {deletingAttemptId === attempt.id ? (
                        <span className="spinner-arc h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {t.deleteResult}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
