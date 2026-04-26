'use client'

import Link from 'next/link'
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  Layers3,
  Play,
  RefreshCcw,
  Sparkles,
  Target,
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
  type ExamQuestion,
  type ExamQuestionType,
  type GeneratedExam,
  type StoredExamRecord,
} from '@/types/exams'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'

const copy = {
  en: {
    back: 'Back to dashboard',
    badge: 'High-end AI exams',
    title: 'Design the exam structure first, then let AI generate the draft.',
    description:
      'Control how many questions belong to each category, define the points for every type, preview the whole exam, edit anything you want, and only then publish it.',
    setupTitle: 'Exam setup',
    setupBody:
      'A strong draft starts with a clear structure. Use 14 to 15 total questions for a balanced practice exam, or tune it to your style.',
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
    generate: 'Generate exam draft',
    generating: 'Generating draft...',
    draftTitle: 'Draft preview',
    draftBody:
      'Review the full draft, rewrite questions, adjust answers, or remove anything before publishing.',
    draftReady: 'Draft ready for review.',
    noContext:
      'No uploaded lecture files were found, so the draft was generated from your topic focus only.',
    publish: 'Publish exam',
    publishing: 'Publishing...',
    publishSuccess: 'Exam published successfully.',
    publishError: 'Publishing failed. Make sure the exams table exists in Supabase.',
    publishSetupMissing:
      'Publishing is not ready yet because the Supabase exams table has not been created.',
    savedTitle: 'Published exams',
    savedBody: 'Your published exams are listed here for quick tracking.',
    emptySaved: 'No published exams yet.',
    loadError: 'Failed to load published exams.',
    setupNotice:
      'Published exams are not available yet. Run the new exams SQL in Supabase to enable saving and loading.',
    setupHint:
      'You can still generate and edit AI exam drafts right now. Publishing will start working after the database table is added.',
    editExam: 'Exam details',
    editQuestions: 'Questions',
    instructions: 'Instructions',
    instructionPlaceholder: 'Instruction',
    addInstruction: 'Add instruction',
    removeQuestion: 'Remove question',
    prompt: 'Prompt',
    correctAnswer: 'Correct answer',
    acceptableAnswers: 'Accepted answers',
    acceptableAnswersHint: 'Separate short-answer variants with commas.',
    explanation: 'Answer explanation',
    sampleAnswer: 'Sample answer',
    gradingNotes: 'Grading notes',
    gradingNotesHint: 'Write one grading note per line.',
    option: 'Option',
    addQuestion: 'Add manual question',
    mcq: 'Add multiple choice',
    fill: 'Add fill-in',
    open: 'Add open-ended',
    questionLabel: 'Question',
    publishedOn: 'Published',
    startExam: 'Start exam',
    launchExam: 'Launch live mode',
    statusDraft: 'Draft',
    statusPublished: 'Published',
    mixed: 'Mixed',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    sourceReady: 'Lecture context connected',
    sourceFallback: 'Topic-only generation',
    descriptionLabel: 'Description',
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
    editStep: 'Edit',
    publishStep: 'Publish',
  },
  sq: {
    back: 'Kthehu te dashboard',
    badge: 'Provime AI me nivel te larte',
    title: 'Percakto strukturen e provimit fillimisht, pastaj lejo AI te krijoje draftin.',
    description:
      'Kontrollo sa pyetje i perkasin seciles kategori, cakto piket per cdo lloj, shiko provimin e plote, ndrysho cfare te duash dhe publikoje vetem kur je gati.',
    setupTitle: 'Konfigurimi i provimit',
    setupBody:
      'Nje draft i forte nis me strukture te qarte. Perdori 14 deri 15 pyetje per nje provim praktik te balancuar, ose pershtate si te duash.',
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
    generate: 'Gjenero draftin e provimit',
    generating: 'Po gjenerohet drafti...',
    draftTitle: 'Parashikimi i draftit',
    draftBody:
      'Shiko draftin e plote, ndrysho pyetjet, pergjigjet ose hiq cdo gje para publikimit.',
    draftReady: 'Drafti eshte gati per rishikim.',
    noContext:
      'Nuk u gjeten materiale te ngarkuara, ndaj drafti u krijua vetem nga fokusi i temes.',
    publish: 'Publiko provimin',
    publishing: 'Po publikohet...',
    publishSuccess: 'Provimi u publikua me sukses.',
    publishError:
      'Publikimi deshtoi. Sigurohu qe tabela exams ekziston ne Supabase.',
    publishSetupMissing:
      'Publikimi nuk eshte gati ende sepse tabela exams ne Supabase nuk eshte krijuar.',
    savedTitle: 'Provimet e publikuara',
    savedBody: 'Provimet e publikuara shfaqen ketu per ndjekje te shpejte.',
    emptySaved: 'Nuk ka ende provime te publikuara.',
    loadError: 'Gabim gjate ngarkimit te provimeve te publikuara.',
    setupNotice:
      'Provimet e publikuara nuk jane ende aktive. Ekzekuto SQL-ne e re te exams ne Supabase per te aktivizuar ruajtjen dhe ngarkimin.',
    setupHint:
      'Mund te gjenerosh dhe modifikosh draftet e provimit tani. Publikimi do te funksionoje pasi te shtohet tabela ne databaze.',
    editExam: 'Detajet e provimit',
    editQuestions: 'Pyetjet',
    instructions: 'Udhezimet',
    instructionPlaceholder: 'Udhezim',
    addInstruction: 'Shto udhezim',
    removeQuestion: 'Hiq pyetjen',
    prompt: 'Pyetja',
    correctAnswer: 'Pergjigjja e sakte',
    acceptableAnswers: 'Pergjigje te pranueshme',
    acceptableAnswersHint: 'Ndaji variantet e shkurtra me presje.',
    explanation: 'Shpjegimi i pergjigjes',
    sampleAnswer: 'Pergjigje model',
    gradingNotes: 'Shenime vleresimi',
    gradingNotesHint: 'Shkruaj nje shenim vleresimi per rresht.',
    option: 'Opsioni',
    addQuestion: 'Shto pyetje manualisht',
    mcq: 'Shto alternative',
    fill: 'Shto plotesim',
    open: 'Shto te hapur',
    questionLabel: 'Pyetja',
    publishedOn: 'Publikuar',
    startExam: 'Fillo provimin',
    launchExam: 'Hap modalitetin live',
    statusDraft: 'Draft',
    statusPublished: 'Publikuar',
    mixed: 'E perzier',
    easy: 'E lehte',
    medium: 'Mesatare',
    hard: 'E veshtire',
    sourceReady: 'Konteksti i leksioneve i lidhur',
    sourceFallback: 'Gjenerim vetem nga tema',
    descriptionLabel: 'Pershkrimi',
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
    editStep: 'Modifiko',
    publishStep: 'Publiko',
  },
} as const

const MAX_EXAM_TITLE_CHARS = 120
const MAX_TOPIC_FOCUS_CHARS = 1200

const createInitialConfig = (locale: 'en' | 'sq'): ExamGenerationRequest => ({
  title:
    locale === 'sq'
      ? 'Draft provimi i gjeneruar nga AI'
      : 'AI-generated exam draft',
  topicFocus: '',
  difficulty: 'mixed',
  language: locale,
  estimatedDurationMinutes: 60,
  selectedLectureIds: [],
  categories: DEFAULT_EXAM_SETTINGS.map((category) => ({ ...category })),
})

const createManualQuestion = (
  type: ExamQuestionType,
  locale: 'en' | 'sq'
): ExamQuestion => {
  if (type === 'fill_in_blank') {
    return {
      id: crypto.randomUUID(),
      type,
      prompt:
        locale === 'sq'
          ? 'Pyetje e re: ploteso pjesen qe mungon.'
          : 'New question: fill in the missing word or phrase.',
      points: 3,
      correctAnswer: '',
      acceptableAnswers: [],
      explanation: '',
    }
  }

  if (type === 'open_ended') {
    return {
      id: crypto.randomUUID(),
      type,
      prompt:
        locale === 'sq'
          ? 'Pyetje e re: jep nje pergjigje te zhvilluar.'
          : 'New question: write a developed response.',
      points: 8,
      sampleAnswer: '',
      gradingNotes: [],
    }
  }

  return {
    id: crypto.randomUUID(),
    type,
    prompt:
      locale === 'sq'
        ? 'Pyetje e re me alternativa.'
        : 'New multiple choice question.',
    points: 2,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 'Option A',
    explanation: '',
  }
}

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

const recalculateDraft = (exam: GeneratedExam): GeneratedExam => ({
  ...exam,
  totalPoints: exam.questions.reduce((sum, question) => sum + question.points, 0),
})

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
  const [draft, setDraft] = useState<GeneratedExam | null>(null)
  const [publishedExams, setPublishedExams] = useState<StoredExamRecord[]>([])
  const [lectureOptions, setLectureOptions] = useState<LectureFileListItem[]>([])
  const [loadingLectures, setLoadingLectures] = useState(true)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lectureLoadError, setLectureLoadError] = useState('')
  const [contextAvailable, setContextAvailable] = useState(true)
  const [requiresExamTableSetup, setRequiresExamTableSetup] = useState(false)
  const [publishedThisSession, setPublishedThisSession] = useState(false)

  useEffect(() => {
    setConfig((current) => ({ ...current, language: locale }))
  }, [locale])

  const totalQuestions = useMemo(
    () => config.categories.reduce((sum, category) => sum + category.count, 0),
    [config.categories]
  )

  const selectedLectureCount = config.selectedLectureIds.length

  const totalPoints = useMemo(
    () =>
      config.categories.reduce(
        (sum, category) => sum + category.count * category.points,
        0
      ),
    [config.categories]
  )

  const currentStep = publishing || publishedThisSession ? 4 : draft ? 3 : generating ? 2 : 1

  const steps = [
    { key: 'configure', label: t.configureStep },
    { key: 'generate', label: t.generateStep },
    { key: 'edit', label: t.editStep },
    { key: 'publish', label: t.publishStep },
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

  const applyDraftUpdate = (updater: (current: GeneratedExam) => GeneratedExam) => {
    setDraft((current) => {
      if (!current) return current
      return recalculateDraft(updater(current))
    })
  }

  const updateCategory = (
    type: ExamQuestionType,
    field: 'count' | 'points',
    value: number
  ) => {
    setConfig((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.type === type
          ? {
              ...category,
              [field]:
                field === 'count'
                  ? Math.max(0, Math.min(20, value))
                  : Math.max(1, Math.min(100, value)),
            }
          : category
      ),
    }))
  }

  const updateQuestion = (
    questionId: string,
    updater: (question: ExamQuestion) => ExamQuestion
  ) => {
    applyDraftUpdate((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === questionId ? updater(question) : question
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

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (generating) return
    setGenerating(true)
    setPublishedThisSession(false)
    setError('')
    setSuccess('')

    const title = config.title.trim()
    const topicFocus = config.topicFocus.trim()

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

    if (!config.selectedLectureIds.length && !config.topicFocus.trim()) {
      setGenerating(false)
      setError(t.lectureRequired)
      return
    }

    try {
      const response = await fetch('/api/exams/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
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

      setDraft(data.exam as GeneratedExam)
      setContextAvailable(Boolean(data.contextAvailable))
      setSuccess(Boolean(data.contextAvailable) ? t.draftReady : t.noContext)
    } catch (err: unknown) {
      setError(getErrorMessage(err, t.requestFailed))
    } finally {
      setGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (!draft) return
    if (publishing) return
    if (!user) {
      setError(t.sessionExpired)
      return
    }

    setPublishing(true)
    setError('')
    setSuccess('')

    try {
      const payload = recalculateDraft(draft)

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

      setPublishedExams((current) => [data as StoredExamRecord, ...current])
      setRequiresExamTableSetup(false)
      setPublishedThisSession(true)
      setSuccess(t.publishSuccess)
    } catch (err: unknown) {
      const message = getErrorMessage(err, t.publishError)

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
      setPublishing(false)
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleString(locale === 'sq' ? 'sq-AL' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

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
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <Link href="/dashboard" className="secondary-button px-4 py-2">
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Link>
            <span className="eyebrow mt-5">{t.badge}</span>
            <h1 className="page-title mt-5 max-w-4xl">{t.title}</h1>
            <p className="page-copy mt-4 max-w-3xl">{t.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="surface-muted animate-fadeInUp p-4 [animation-delay:120ms] [animation-fill-mode:both]">
              <div className="icon-shell h-11 w-11 text-[var(--accent)]">
                <Layers3 className="h-4 w-4" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t.totalQuestions}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {totalQuestions}
              </p>
            </div>

            <div className="surface-muted animate-fadeInUp p-4 [animation-delay:200ms] [animation-fill-mode:both]">
              <div className="icon-shell h-11 w-11 text-amber-600 dark:text-amber-300">
                <Target className="h-4 w-4" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t.totalPoints}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {totalPoints}
              </p>
            </div>

            <div className="surface-muted animate-fadeInUp p-4 [animation-delay:280ms] [animation-fill-mode:both]">
              <div className="icon-shell h-11 w-11 text-sky-600 dark:text-sky-300">
                <Clock3 className="h-4 w-4" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t.totalDuration}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {config.estimatedDurationMinutes}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface animate-fadeInScale p-5 sm:p-6">
        <ol className="grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const completed = publishedThisSession ? stepNumber <= 4 : stepNumber < currentStep
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
                    type="number"
                    min={10}
                    max={240}
                    value={config.estimatedDurationMinutes}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        estimatedDurationMinutes: Math.max(
                          10,
                          Math.min(240, Number(event.target.value) || 10)
                        ),
                      }))
                    }
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
                        type="number"
                        min={0}
                        max={20}
                        value={category.count}
                        onChange={(event) =>
                          updateCategory(
                            category.type,
                            'count',
                            Number(event.target.value) || 0
                          )
                        }
                        className="field-input px-4"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {t.points}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={category.points}
                        onChange={(event) =>
                          updateCategory(
                            category.type,
                            'points',
                            Number(event.target.value) || 1
                          )
                        }
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
                {config.estimatedDurationMinutes} {t.minutes}
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

      {draft && (
        <section className="surface animate-fadeInScale overflow-hidden">
          <div className="card-header-divider px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {t.draftTitle}
                  </h2>
                  <span className="status-pill">
                    <FileCheck2 className="h-3.5 w-3.5" />
                    {t.statusDraft}
                  </span>
                  <span className="status-pill">
                    <Sparkles className="h-3.5 w-3.5" />
                    {contextAvailable ? t.sourceReady : t.sourceFallback}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {t.draftBody}
                </p>
              </div>

              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className={`primary-button justify-center shadow-depth-md ${publishing ? 'button-shimmer' : ''}`}
              >
                {publishing ? (
                  <>
                    <span className="spinner-arc h-4 w-4" />
                    {t.publishing}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t.publish}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-5 px-6 py-6 sm:px-7 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-5">
              <section className="surface-muted p-5">
                <div className="card-header-divider">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t.editExam}
                  </h3>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t.examTitle}
                    </span>
                    <input
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((current) =>
                          current ? { ...current, title: event.target.value } : current
                        )
                      }
                      className="field-input px-4"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t.topicFocus}
                    </span>
                    <textarea
                      value={draft.topicFocus}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, topicFocus: event.target.value }
                            : current
                        )
                      }
                      className="field-input min-h-24 resize-none px-4"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t.descriptionLabel}
                    </span>
                    <textarea
                      value={draft.description}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? { ...current, description: event.target.value }
                            : current
                        )
                      }
                      className="field-input min-h-28 resize-none px-4"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t.difficulty}
                      </span>
                      <select
                        value={draft.difficulty}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  difficulty: event.target.value as ExamDifficulty,
                                }
                              : current
                          )
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
                      <input
                        type="number"
                        min={10}
                        max={240}
                        value={draft.estimatedDurationMinutes}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  estimatedDurationMinutes: Math.max(
                                    10,
                                    Math.min(240, Number(event.target.value) || 10)
                                  ),
                                }
                              : current
                          )
                        }
                        className="field-input px-4"
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section className="surface-muted p-5">
                <div className="card-header-divider flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t.instructions}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              instructions: [...current.instructions, ''],
                            }
                          : current
                      )
                    }
                    className="secondary-button px-4 py-2"
                  >
                    {t.addInstruction}
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {draft.instructions.map((instruction, index) => (
                    <input
                      key={`${draft.title}-instruction-${index}`}
                      value={instruction}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                instructions: current.instructions.map((item, itemIndex) =>
                                  itemIndex === index ? event.target.value : item
                                ),
                              }
                            : current
                        )
                      }
                      className="field-input px-4"
                      placeholder={t.instructionPlaceholder}
                    />
                  ))}
                </div>
              </section>

              <section className="surface-muted p-5">
                <div className="card-header-divider flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t.addQuestion}
                  </h3>
                  <RefreshCcw className="h-4 w-4 text-[var(--accent)]" />
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        questions: [
                          ...current.questions,
                          createManualQuestion('multiple_choice', locale),
                        ],
                      }))
                    }
                    className="secondary-button justify-center"
                  >
                    {t.mcq}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        questions: [
                          ...current.questions,
                          createManualQuestion('fill_in_blank', locale),
                        ],
                      }))
                    }
                    className="secondary-button justify-center"
                  >
                    {t.fill}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        questions: [
                          ...current.questions,
                          createManualQuestion('open_ended', locale),
                        ],
                      }))
                    }
                    className="secondary-button justify-center"
                  >
                    {t.open}
                  </button>
                </div>
              </section>
            </div>

            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t.editQuestions}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {draft.questions.length} {t.totalQuestions.toLowerCase()} • {draft.totalPoints}{' '}
                  {t.totalPoints.toLowerCase()}
                </p>
              </div>

              {draft.questions.map((question, index) => {
                const meta = EXAM_CATEGORY_META[question.type]

                return (
                  <article
                    key={question.id}
                    style={{ '--qi': index } as CSSProperties}
                    className={`surface-muted animate-fadeInUp border-l-4 p-5 ${questionAccentClasses[question.type]} [animation-delay:calc(var(--qi)*80ms)] [animation-fill-mode:both]`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="icon-shell h-11 w-11 text-[var(--accent)]">
                          <span className="text-sm font-semibold">{index + 1}</span>
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {t.questionLabel} {index + 1}
                          </p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {meta.label[locale]}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          {t.points}
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={question.points}
                            onChange={(event) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                points: Math.max(
                                  1,
                                  Math.min(100, Number(event.target.value) || 1)
                                ),
                              }))
                            }
                            className="field-input w-24 px-3"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            applyDraftUpdate((current) => ({
                              ...current,
                              questions: current.questions.filter(
                                (entry) => entry.id !== question.id
                              ),
                            }))
                          }
                          data-destructive="true"
                          className="secondary-button px-4 py-2 text-rose-600 dark:text-rose-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t.removeQuestion}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {t.prompt}
                        </span>
                        <textarea
                          value={question.prompt}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) => ({
                              ...current,
                              prompt: event.target.value,
                            }))
                          }
                          className="field-input min-h-28 resize-none px-4"
                        />
                      </label>

                      {question.type === 'multiple_choice' && (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            {question.options.map((option, optionIndex) => (
                              <label
                                key={`${question.id}-option-${optionIndex}`}
                                className="space-y-2"
                              >
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {t.option} {optionIndex + 1}
                                </span>
                                <input
                                  value={option}
                                  onChange={(event) =>
                                    updateQuestion(question.id, (current) => {
                                      if (current.type !== 'multiple_choice') return current
                                      const nextOptions = current.options.map(
                                        (item, itemIndex) =>
                                          itemIndex === optionIndex
                                            ? event.target.value
                                            : item
                                      )
                                      const nextCorrectAnswer =
                                        current.correctAnswer ===
                                        current.options[optionIndex]
                                          ? event.target.value
                                          : current.correctAnswer

                                      return {
                                        ...current,
                                        options: nextOptions,
                                        correctAnswer: nextCorrectAnswer,
                                      }
                                    })
                                  }
                                  className="field-input px-4"
                                />
                              </label>
                            ))}
                          </div>

                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {t.correctAnswer}
                            </span>
                            <select
                              value={question.correctAnswer}
                              onChange={(event) =>
                                updateQuestion(question.id, (current) =>
                                  current.type === 'multiple_choice'
                                    ? {
                                        ...current,
                                        correctAnswer: event.target.value,
                                      }
                                    : current
                                )
                              }
                              className="field-input px-4"
                            >
                              {question.options.map((option) => (
                                <option key={`${question.id}-${option}`} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {t.explanation}
                            </span>
                            <textarea
                              value={question.explanation}
                              onChange={(event) =>
                                updateQuestion(question.id, (current) =>
                                  current.type === 'multiple_choice'
                                    ? {
                                        ...current,
                                        explanation: event.target.value,
                                      }
                                    : current
                                )
                              }
                              className="field-input min-h-24 resize-none px-4"
                            />
                          </label>
                        </>
                      )}

                      {question.type === 'fill_in_blank' && (
                        <>
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {t.correctAnswer}
                            </span>
                            <input
                              value={question.correctAnswer}
                              onChange={(event) =>
                                updateQuestion(question.id, (current) =>
                                  current.type === 'fill_in_blank'
                                    ? {
                                        ...current,
                                        correctAnswer: event.target.value,
                                      }
                                    : current
                                )
                              }
                              className="field-input px-4"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {t.acceptableAnswers}
                            </span>
                            <input
                              value={question.acceptableAnswers.join(', ')}
                              onChange={(event) =>
                                updateQuestion(question.id, (current) =>
                                  current.type === 'fill_in_blank'
                                    ? {
                                        ...current,
                                        acceptableAnswers: event.target.value
                                          .split(',')
                                          .map((entry) => entry.trim())
                                          .filter(Boolean),
                                      }
                                    : current
                                )
                              }
                              className="field-input px-4"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t.acceptableAnswersHint}
                            </p>
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {t.explanation}
                            </span>
                            <textarea
                              value={question.explanation}
                              onChange={(event) =>
                                updateQuestion(question.id, (current) =>
                                  current.type === 'fill_in_blank'
                                    ? {
                                        ...current,
                                        explanation: event.target.value,
                                      }
                                    : current
                                )
                              }
                              className="field-input min-h-24 resize-none px-4"
                            />
                          </label>
                        </>
                      )}

                      {question.type === 'open_ended' && (
                        <>
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {t.sampleAnswer}
                            </span>
                            <textarea
                              value={question.sampleAnswer}
                              onChange={(event) =>
                                updateQuestion(question.id, (current) =>
                                  current.type === 'open_ended'
                                    ? {
                                        ...current,
                                        sampleAnswer: event.target.value,
                                      }
                                    : current
                                )
                              }
                              className="field-input min-h-28 resize-none px-4"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {t.gradingNotes}
                            </span>
                            <textarea
                              value={question.gradingNotes.join('\n')}
                              onChange={(event) =>
                                updateQuestion(question.id, (current) =>
                                  current.type === 'open_ended'
                                    ? {
                                        ...current,
                                        gradingNotes: event.target.value
                                          .split('\n')
                                          .map((entry) => entry.trim())
                                          .filter(Boolean),
                                      }
                                    : current
                                )
                              }
                              className="field-input min-h-24 resize-none px-4"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t.gradingNotesHint}
                            </p>
                          </label>
                        </>
                      )}
                    </div>
                  </article>
                )
              })}
            </section>
          </div>
        </section>
      )}

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
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.emptySaved}
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

                <Link href={`/exam/${exam.id}`} className="primary-button mt-5 w-full justify-center hover:animate-pulse-ring">
                  <Play className="h-4 w-4" />
                  {t.startExam}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
