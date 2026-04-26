'use client'

import Link from 'next/link'
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  Play,
  RefreshCcw,
  Trash2,
  WandSparkles,
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
  type ExamQuestionType,
  type GeneratedExam,
  type StoredExamAttemptRecord,
  type StoredExamRecord,
} from '@/types/exams'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'

type ExamsView = 'builder' | 'library' | 'results'

const copy = {
  en: {
    back: 'Back to dashboard',
    badge: 'High-end AI exams',
    title: 'Choose the exam structure, then generate a ready-to-start exam.',
    description:
      'Control the question mix, points, source material, and difficulty. The AI creates and publishes the exam directly, so students can start right away.',
    setupTitle: 'Exam setup',
    setupBody:
      'A strong exam starts with a clear structure. Use 14 to 15 total questions for a balanced practice exam, or tune it to your style.',
    examTitle: 'Exam title',
    topicFocus: 'Topic focus',
    topicPlaceholder:
      'Example: Chapters 2 to 5, networking fundamentals, or uploaded lecture materials.',
    difficulty: 'Difficulty',
    duration: 'Duration',
    minutes: 'minutes',
    lectureScopeTitle: 'Lecture source',
    lectureScopeBody:
      'Choose which uploaded lectures should be used as the source for this exam.',
    lectureLoading: 'Loading lecture files...',
    lectureEmpty:
      'No lecture files found yet. Upload materials first or use topic focus only.',
    lectureLoadError:
      'Lecture sources could not be loaded right now. You can still use topic focus or try again.',
    retryLectures: 'Retry lecture loading',
    selectAllLectures: 'Use all lectures',
    clearLectures: 'Clear selection',
    selectedLectures: 'Selected lectures',
    lectureRequired:
      'Select at least one lecture or write a topic focus before generating the exam.',
    categoriesTitle: 'Question categories',
    categoriesBody:
      'Choose exactly how many questions and points each category should carry.',
    count: 'Questions',
    points: 'Points each',
    totalQuestions: 'Total questions',
    totalPoints: 'Total points',
    totalDuration: 'Suggested duration',
    recommendation: '14 to 15 questions is the sweet spot for this format.',
    recommendationOk: 'This setup is right in the recommended range.',
    generate: 'Generate ready exam',
    generating: 'Generating exam...',
    generatedReady: 'Exam generated and ready to start.',
    noContext:
      'Exam generated from your topic focus only and ready to start.',
    publishSetupMissing:
      'Publishing is not ready yet because the Supabase exams table has not been created.',
    savedTitle: 'Published exams',
    savedBody: 'Your published exams are listed here for quick tracking.',
    emptySaved: 'No published exams yet.',
    loadError: 'Failed to load published exams.',
    setupNotice:
      'Published exams are not available yet. Run the new exams SQL in Supabase to enable saving and loading.',
    setupHint:
      'Exam generation needs the database table because generated exams are published immediately.',
    publishedOn: 'Published',
    startExam: 'Start exam',
    statusPublished: 'Published',
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
    tryAgain: 'Try again',
    signIn: 'Sign in',
    configureStep: 'Configure',
    generateStep: 'Generate',
    publishStep: 'Start',
    builderTab: 'Builder',
    libraryTab: 'Library',
    resultsTab: 'Results',
    libraryTitle: 'Published exam library',
    libraryBody: 'Start, review, or remove published exams without scrolling through the builder.',
    resultsTitle: 'Exam results',
    resultsBody: 'Review submitted attempts and filter them by exam.',
    noAttempts: 'No exam attempts yet.',
    attemptScore: 'Score',
    attemptStatus: 'Status',
    attemptViolations: 'Violations',
    attemptSubmitted: 'Submitted',
    answersSubmitted: 'Answers',
    deleteExam: 'Delete exam',
    deleteExamConfirm: 'Do you want to delete this exam?',
    deleteSuccess: 'Exam deleted successfully.',
    deleteError: 'Deleting the exam failed.',
    deleteResult: 'Delete result',
    deleteResultConfirm: 'Do you want to delete this result?',
    deleteResultSuccess: 'Result deleted successfully.',
    deleteResultError: 'Deleting the result failed.',
    viewResults: 'View results',
    filterAll: 'All exams',
    openBuilder: 'Open builder',
  },
  sq: {
    back: 'Kthehu te dashboard',
    badge: 'Provime AI me nivel te larte',
    title: 'Zgjidh strukturen e provimit, pastaj gjenero nje provim gati per nisje.',
    description:
      'Kontrollo llojet e pyetjeve, piket, burimin dhe veshtiresine. AI krijon dhe publikon provimin direkt, pa hap modifikimi.',
    setupTitle: 'Konfigurimi i provimit',
    setupBody:
      'Nje provim i forte nis me strukture te qarte. Perdori 14 deri 15 pyetje per nje provim praktik te balancuar, ose pershtate si te duash.',
    examTitle: 'Titulli i provimit',
    topicFocus: 'Fokusi i temes',
    topicPlaceholder:
      'Shembull: Kapitujt 2 deri 5, bazat e rrjeteve, ose materialet e ngarkuara.',
    difficulty: 'Veshtiresia',
    duration: 'Kohezgjatja',
    minutes: 'minuta',
    lectureScopeTitle: 'Burimi i leksioneve',
    lectureScopeBody:
      'Zgjidh cilat materiale te ngarkuara duhet te perdoren si burim per kete provim.',
    lectureLoading: 'Po ngarkohen materialet...',
    lectureEmpty:
      'Nuk ka materiale ende. Ngarko leksione fillimisht ose perdor vetem fokusin e temes.',
    lectureLoadError:
      'Burimet e leksioneve nuk u ngarkuan dot tani. Mund te perdoresh fokusin e temes ose te provosh perseri.',
    retryLectures: 'Ringarko leksionet',
    selectAllLectures: 'Perdor te gjitha leksionet',
    clearLectures: 'Hiq perzgjedhjen',
    selectedLectures: 'Leksione te zgjedhura',
    lectureRequired:
      'Zgjidh te pakten nje leksion ose shkruaj fokusin e temes para gjenerimit te provimit.',
    categoriesTitle: 'Kategorite e pyetjeve',
    categoriesBody:
      'Zgjidh saktesisht sa pyetje dhe sa pike duhet te kete cdo kategori.',
    count: 'Pyetje',
    points: 'Pike secila',
    totalQuestions: 'Totali i pyetjeve',
    totalPoints: 'Totali i pikeve',
    totalDuration: 'Kohezgjatja e sugjeruar',
    recommendation: '14 deri 15 pyetje jane balanca me e mire per kete format.',
    recommendationOk: 'Ky konfigurim eshte pikerisht ne diapazonin e rekomanduar.',
    generate: 'Gjenero provim gati',
    generating: 'Po gjenerohet provimi...',
    generatedReady: 'Provimi u gjenerua dhe eshte gati per nisje.',
    noContext:
      'Provimi u gjenerua vetem nga fokusi i temes dhe eshte gati per nisje.',
    publishSetupMissing:
      'Publikimi nuk eshte gati ende sepse tabela exams ne Supabase nuk eshte krijuar.',
    savedTitle: 'Provimet e publikuara',
    savedBody: 'Provimet e publikuara shfaqen ketu per ndjekje te shpejte.',
    emptySaved: 'Nuk ka ende provime te publikuara.',
    loadError: 'Gabim gjate ngarkimit te provimeve te publikuara.',
    setupNotice:
      'Provimet e publikuara nuk jane ende aktive. Ekzekuto SQL-ne e re te exams ne Supabase per te aktivizuar ruajtjen dhe ngarkimin.',
    setupHint:
      'Gjenerimi ka nevoje per tabelen e databazes sepse provimet publikohen direkt.',
    publishedOn: 'Publikuar',
    startExam: 'Fillo provimin',
    statusPublished: 'Publikuar',
    mixed: 'E perzier',
    easy: 'E lehte',
    medium: 'Mesatare',
    hard: 'E veshtire',
    sessionExpired: 'Sesioni ka skaduar. Ju lutem kyquni perseri.',
    titleRequired: 'Ju lutem vendosni nje titull provimi para gjenerimit.',
    titleTooLong: 'Titulli i provimit eshte shume i gjate. Mbajeni nen 120 karaktere.',
    topicTooLong: 'Fokusi i temes eshte shume i gjate. Mbajeni nen 1200 karaktere.',
    requestFailed: 'Deshtoi per shkak te rrjetit ose serverit. Ju lutem provoni perseri.',
    tooManyQuestions: 'Mbajeni provimin me 30 pyetje ose me pak.',
    tryAgain: 'Provo perseri',
    signIn: 'Kycu',
    configureStep: 'Konfiguro',
    generateStep: 'Gjenero',
    publishStep: 'Nis',
    builderTab: 'Krijuesi',
    libraryTab: 'Biblioteka',
    resultsTab: 'Rezultatet',
    libraryTitle: 'Biblioteka e provimeve',
    libraryBody: 'Nis, rishiko ose fshi provimet e publikuara pa kaluar neper te gjithe krijuesin.',
    resultsTitle: 'Rezultatet e provimit',
    resultsBody: 'Shiko tentativat e derguara dhe filtroji sipas provimit.',
    noAttempts: 'Nuk ka tentativa ende.',
    attemptScore: 'Rezultati',
    attemptStatus: 'Statusi',
    attemptViolations: 'Shkelje',
    attemptSubmitted: 'Derguar',
    answersSubmitted: 'Pergjigje',
    deleteExam: 'Fshi provimin',
    deleteExamConfirm: 'Deshiron ta fshish kete provim?',
    deleteSuccess: 'Provimi u fshi me sukses.',
    deleteError: 'Fshirja e provimit deshtoi.',
    deleteResult: 'Fshi rezultatin',
    deleteResultConfirm: 'Deshiron ta fshish kete rezultat?',
    deleteResultSuccess: 'Rezultati u fshi me sukses.',
    deleteResultError: 'Fshirja e rezultatit deshtoi.',
    viewResults: 'Shiko rezultatet',
    filterAll: 'Te gjitha',
    openBuilder: 'Hap krijuesin',
  },
} as const

const MAX_EXAM_TITLE_CHARS = 120
const MAX_TOPIC_FOCUS_CHARS = 1200
const MIN_DURATION_MINUTES = 10
const MAX_DURATION_MINUTES = 240
const MAX_CATEGORY_COUNT = 20
const MIN_CATEGORY_POINTS = 1
const MAX_CATEGORY_POINTS = 100

type CategoryInputState = Record<
  ExamQuestionType,
  {
    count: string
    points: string
  }
>

const createInitialConfig = (locale: 'en' | 'sq'): ExamGenerationRequest => ({
  title:
    locale === 'sq'
      ? 'Provim i gjeneruar nga AI'
      : 'AI-generated exam',
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

    // Fetch failures typically surface as TypeError with a generic message.
    if (message.toLowerCase().includes('failed to fetch')) {
      return fallback
    }

    return message
  }

  return fallback
}

const isAuthExpiredError = (message: string) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('jwt expired') ||
    normalized.includes('invalid jwt') ||
    normalized.includes('not authorized') ||
    normalized.includes('unauthorized') ||
    normalized.includes('auth session missing')
  )
}

const isMissingExamsTableError = (message: string) => {
  const normalized = message.toLowerCase()

  return (
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

const difficultyOptions: ExamDifficulty[] = ['mixed', 'easy', 'medium', 'hard']

const questionAccentClasses: Record<ExamQuestionType, string> = {
  multiple_choice: 'border-l-teal-500 dark:border-l-teal-300',
  fill_in_blank: 'border-l-amber-500 dark:border-l-amber-300',
  open_ended: 'border-l-sky-500 dark:border-l-sky-300',
}

export default function ExamBuilder() {
  const { user, loading } = useAuth()
  const { locale } = useAppLocale()
  const t = useMemo(() => copy[locale], [locale])
  const supabase = useSupabaseBrowserClient()
  const [config, setConfig] = useState<ExamGenerationRequest>(() =>
    createInitialConfig(locale)
  )
  const [durationInput, setDurationInput] = useState(() =>
    String(createInitialConfig(locale).estimatedDurationMinutes)
  )
  const [categoryInputs, setCategoryInputs] = useState<CategoryInputState>(() =>
    createCategoryInputState(createInitialConfig(locale).categories)
  )
  const [publishedExams, setPublishedExams] = useState<StoredExamRecord[]>([])
  const [lectureOptions, setLectureOptions] = useState<LectureFileListItem[]>([])
  const [loadingLectures, setLoadingLectures] = useState(true)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lectureLoadError, setLectureLoadError] = useState('')
  const [requiresExamTableSetup, setRequiresExamTableSetup] = useState(false)
  const [publishedThisSession, setPublishedThisSession] = useState(false)
  const [activeView, setActiveView] = useState<ExamsView>('library')
  const [attempts, setAttempts] = useState<StoredExamAttemptRecord[]>([])
  const [loadingAttempts, setLoadingAttempts] = useState(true)
  const [attemptsError, setAttemptsError] = useState('')
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null)
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null)
  const [resultsExamFilter, setResultsExamFilter] = useState<string>('all')

  useEffect(() => {
    setConfig((current) => ({ ...current, language: locale }))
  }, [locale])

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

  const selectedLectureCount = config.selectedLectureIds.length

  const totalPoints = useMemo(
    () =>
      normalizedConfig.categories.reduce(
        (sum, category) => sum + category.count * category.points,
        0
      ),
    [normalizedConfig.categories]
  )

  const currentStep = publishedThisSession ? 3 : generating ? 2 : 1

  const steps = [
    { key: 'configure', label: t.configureStep },
    { key: 'generate', label: t.generateStep },
    { key: 'start', label: t.publishStep },
  ]

  const viewTabs: Array<{ key: ExamsView; label: string }> = [
    { key: 'library', label: t.libraryTab },
    { key: 'builder', label: t.builderTab },
    { key: 'results', label: t.resultsTab },
  ]

  const fetchPublishedExams = useCallback(async () => {
    if (!user) {
      setPublishedExams([])
      setLoadingSaved(false)
      return
    }

    setLoadingSaved(true)

    try {
      const { data, error } = await supabase
        .from('exams')
        .select(
          'id, title, description, topic_focus, difficulty, question_count, total_points, estimated_duration_minutes, status, exam_payload, created_at'
        )
        .eq('user_id', user.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setPublishedExams((data as StoredExamRecord[]) || [])
      setRequiresExamTableSetup(false)
    } catch (err: unknown) {
      const message = getErrorMessage(err, t.loadError)

      if (isMissingExamsTableError(message)) {
        setRequiresExamTableSetup(true)
        setPublishedExams([])
        return
      }

      setError(message)
    } finally {
      setLoadingSaved(false)
    }
  }, [supabase, t.loadError, user])

  useEffect(() => {
    void fetchPublishedExams()
  }, [fetchPublishedExams])

  const fetchAttempts = useCallback(async () => {
    if (!user) {
      setAttempts([])
      setLoadingAttempts(false)
      return
    }

    setLoadingAttempts(true)
    setAttemptsError('')

    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select(
          'id, exam_id, user_id, status, violations_count, objective_score, objective_max_score, attempt_payload, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setAttempts((data as StoredExamAttemptRecord[]) || [])
    } catch (err: unknown) {
      const message = getErrorMessage(err, t.loadError)

      if (isMissingExamAttemptsTableError(message)) {
        setAttempts([])
        return
      }

      setAttemptsError(message)
    } finally {
      setLoadingAttempts(false)
    }
  }, [supabase, t.loadError, user])

  useEffect(() => {
    void fetchAttempts()
  }, [fetchAttempts])

  const fetchLectureOptions = useCallback(async () => {
    if (!user) {
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
        EXAM_BUILDER_LECTURE_COLUMNS
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
  }, [supabase, t.lectureLoadError, user])

  useEffect(() => {
    void fetchLectureOptions()
  }, [fetchLectureOptions])

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

    const fallbackValue = currentCategory[field]
    const normalizedValue = normalizeCategoryValue(
      field,
      categoryInputs[type][field],
      fallbackValue
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

  const safeReadJson = async (response: Response) => {
    try {
      return (await response.json()) as unknown
    } catch {
      return null
    }
  }

  const publishGeneratedExam = async (exam: GeneratedExam) => {
    if (!user) {
      throw new Error(t.sessionExpired)
    }

    const payload: GeneratedExam = {
      ...exam,
      totalPoints: exam.questions.reduce((sum, question) => sum + question.points, 0),
    }

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
          status: 'published',
          exam_payload: payload,
        },
      ])
      .select(
        'id, title, description, topic_focus, difficulty, question_count, total_points, estimated_duration_minutes, status, exam_payload, created_at'
      )
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as StoredExamRecord
  }

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (generating) return
    setGenerating(true)
    setPublishedThisSession(false)
    setError('')
    setSuccess('')

    const requestConfig = buildNormalizedConfig(config, durationInput, categoryInputs)
    setConfig(requestConfig)
    setDurationInput(String(requestConfig.estimatedDurationMinutes))
    setCategoryInputs(createCategoryInputState(requestConfig.categories))

    const title = requestConfig.title.trim()
    const topicFocus = requestConfig.topicFocus.trim()

    if (!title) {
      setGenerating(false)
      setError(t.titleRequired)
      return
    }

    if (title.length > MAX_EXAM_TITLE_CHARS) {
      setGenerating(false)
      setError(t.titleTooLong)
      return
    }

    if (topicFocus.length > MAX_TOPIC_FOCUS_CHARS) {
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

      const publishedExam = await publishGeneratedExam(data.exam as GeneratedExam)
      setPublishedExams((current) => [publishedExam, ...current])
      setRequiresExamTableSetup(false)
      setPublishedThisSession(true)
      setSuccess(Boolean(data.contextAvailable) ? t.generatedReady : t.noContext)
      setActiveView('library')
    } catch (err: unknown) {
      const message = getErrorMessage(err, t.requestFailed)

      if (isAuthExpiredError(message)) {
        setError(t.sessionExpired)
        return
      }

      if (isMissingExamsTableError(message)) {
        setRequiresExamTableSetup(true)
        setError(t.publishSetupMissing)
        return
      }

      setError(message)
    } finally {
      setGenerating(false)
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

    setDeletingExamId(exam.id)
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

      setPublishedExams((current) => current.filter((entry) => entry.id !== exam.id))
      setAttempts((current) => current.filter((entry) => entry.exam_id !== exam.id))
      if (resultsExamFilter === exam.id) {
        setResultsExamFilter('all')
      }
      setSuccess(t.deleteSuccess)
    } catch (err: unknown) {
      setError(getErrorMessage(err, t.deleteError))
    } finally {
      setDeletingExamId(null)
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
        .eq('user_id', user.id)

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

  const formatDate = (date: string) =>
    new Date(date).toLocaleString(locale === 'sq' ? 'sq-AL' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const publishedExamMap = useMemo(
    () => new Map(publishedExams.map((exam) => [exam.id, exam])),
    [publishedExams]
  )

  const filteredAttempts = useMemo(
    () =>
      resultsExamFilter === 'all'
        ? attempts
        : attempts.filter((attempt) => attempt.exam_id === resultsExamFilter),
    [attempts, resultsExamFilter]
  )

  if (loading) {
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
          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            {t.setupHint}
          </p>
          <Link href="/login" className="primary-button mt-6 inline-flex justify-center">
            {t.signIn}
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
        <span className="eyebrow mt-5">{t.badge}</span>
        <h1 className="page-title mt-5 max-w-4xl">{t.title}</h1>
        <p className="page-copy mt-4 max-w-3xl">{t.description}</p>
      </section>

      <section className="surface animate-fadeInScale p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {activeView === 'builder'
                ? t.setupTitle
                : activeView === 'library'
                  ? t.libraryTitle
                  : t.resultsTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {activeView === 'builder'
                ? t.setupBody
                : activeView === 'library'
                  ? t.libraryBody
                  : t.resultsBody}
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
        <>
      <section className="surface animate-fadeInScale p-5 sm:p-6">
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const completed = publishedThisSession ? stepNumber <= steps.length : stepNumber < currentStep
            const current = stepNumber === currentStep && !publishedThisSession

            return (
              <li
                key={step.key}
                style={{ '--i': index } as CSSProperties}
                className="animate-fadeInUp [animation-delay:calc(var(--i)*70ms+80ms)] [animation-fill-mode:both]"
              >
                <div className={`surface-muted flex items-center gap-4 border px-4 py-4 ${
                  current ? 'border-[rgba(var(--color-primary-rgb),0.3)]' : ''
                }`}>
                  <span className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                    completed
                      ? 'border-transparent bg-[var(--accent)] text-white shadow-depth-sm'
                      : current
                        ? 'border-[rgba(var(--color-primary-rgb),0.35)] bg-[var(--accent-soft)] text-[var(--accent)] animate-pulse-ring'
                        : 'border-[var(--surface-border)] bg-white/70 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400'
                  }`}>
                    {completed ? <CheckCircle2 className="h-5 w-5" /> : stepNumber}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      0{stepNumber}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {step.label}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

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

          <hr className="section-divider" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {t.categoriesTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t.categoriesBody}
              </p>
            </div>
            <span className="status-pill">
              <Eye className="h-3.5 w-3.5" />
              {totalQuestions >= 14 && totalQuestions <= 15
                ? t.recommendationOk
                : t.recommendation}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {config.categories.map((category) => {
              const meta = EXAM_CATEGORY_META[category.type]

              return (
                <article key={category.type} className={`surface-muted border-l-4 p-4 ${questionAccentClasses[category.type]}`}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {meta.label[locale]}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {meta.helper[locale]}
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

          <hr className="section-divider mt-6" />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {totalQuestions >= 14 && totalQuestions <= 15
                ? t.recommendationOk
                : t.recommendation}
            </p>
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
                  {t.generate}
                </>
              )}
            </button>
          </div>
        </section>
      </form>

        </>
      )}

      {activeView === 'library' && (
      <section className="surface animate-fadeInScale overflow-hidden">
        <div className="card-header-divider px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t.savedTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t.savedBody}
          </p>
        </div>

        {loadingSaved ? (
          <div className="flex min-h-56 items-center justify-center p-6">
            <span className="spinner-arc h-8 w-8" />
          </div>
        ) : requiresExamTableSetup ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.setupNotice}
          </div>
        ) : publishedExams.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.emptySaved}</p>
            <button
              type="button"
              onClick={() => setActiveView('builder')}
              className="primary-button mt-5"
            >
              {t.openBuilder}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {publishedExams.map((exam) => (
              <article key={exam.id} className="surface-muted p-5 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-depth-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {exam.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {exam.description || exam.topic_focus || ' '}
                    </p>
                  </div>
                  <span className="status-pill">{t.statusPublished}</span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span>{t.publishedOn}</span>
                  <span>{formatDate(exam.created_at)}</span>
                </div>

                <div className="mt-5 grid gap-2">
                  <Link href={`/exam/${exam.id}`} className="primary-button w-full justify-center hover:animate-pulse-ring">
                    <Play className="h-4 w-4" />
                    {t.startExam}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setResultsExamFilter(exam.id)
                      setActiveView('results')
                    }}
                    className="secondary-button w-full justify-center"
                  >
                    <Eye className="h-4 w-4" />
                    {t.viewResults}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteExam(exam)}
                    disabled={deletingExamId === exam.id}
                    data-destructive="true"
                    className="secondary-button w-full justify-center text-rose-600 dark:text-rose-300"
                  >
                    {deletingExamId === exam.id ? (
                      <span className="spinner-arc h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {t.deleteExam}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      )}

      {activeView === 'results' && (
        <section className="surface animate-fadeInScale overflow-hidden">
          <div className="card-header-divider px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {t.resultsTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t.resultsBody}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setResultsExamFilter('all')}
                  className={`secondary-button px-4 py-2 ${
                    resultsExamFilter === 'all'
                      ? 'border-[rgba(var(--color-primary-rgb),0.35)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : ''
                  }`}
                >
                  {t.filterAll}
                </button>
                {publishedExams.map((exam) => (
                  <button
                    key={`filter-${exam.id}`}
                    type="button"
                    onClick={() => setResultsExamFilter(exam.id)}
                    className={`secondary-button px-4 py-2 ${
                      resultsExamFilter === exam.id
                        ? 'border-[rgba(var(--color-primary-rgb),0.35)] bg-[var(--accent-soft)] text-[var(--accent)]'
                        : ''
                    }`}
                  >
                    {exam.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingAttempts ? (
            <div className="flex min-h-56 items-center justify-center p-6">
              <span className="spinner-arc h-8 w-8" />
            </div>
          ) : attemptsError ? (
            <div className="p-10 text-center text-sm text-rose-600 dark:text-rose-300">
              {attemptsError}
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.noAttempts}
            </div>
          ) : (
            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredAttempts.map((attempt) => {
                const exam = publishedExamMap.get(attempt.exam_id)

                return (
                  <article key={attempt.id} className="surface-muted p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {exam?.title || attempt.exam_id}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {t.attemptSubmitted}: {formatDate(attempt.created_at)}
                        </p>
                      </div>
                      <span className="status-pill">
                        {attempt.status}
                      </span>
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
