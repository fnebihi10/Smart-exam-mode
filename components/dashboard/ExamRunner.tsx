'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileWarning,
  Flag,
  MonitorCog,
  ScanEye,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppLocale } from '@/components/i18n/useAppLocale'
import {
  EXAM_CATEGORY_META,
  type ExamAttemptAnswer,
  type ExamAttemptPayload,
  type ExamAttemptStatus,
  type GeneratedExam,
  type OpenEndedGrade,
  type OpenEndedQuestion,
  type StoredExamRecord,
} from '@/types/exams'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'

const VIOLATION_LIMIT = 3

const copy = {
  en: {
    back: 'Back to exams',
    loading: 'Loading exam...',
    notFound: 'This exam could not be loaded.',
    introBadge: 'Live exam mode',
    introTitle: 'You are about to enter a focused exam session.',
    introBody:
      'The exam starts from question one, tracks violations, and auto-submits after the third strike.',
    rulesTitle: 'Exam rules',
    ruleEsc: 'Pressing Escape counts as a violation.',
    ruleSwitch: 'Switching tabs or apps counts as a violation.',
    ruleShiftTab: 'Shift+Tab is blocked and counts as a violation.',
    ruleSystemShortcut:
      'System, browser-tab, and navigation shortcuts are blocked when the browser exposes them.',
    ruleFullscreen: 'Leaving fullscreen counts as a violation.',
    ruleAuto: 'After 3 violations, the exam is submitted automatically.',
    ruleNav: 'Use next, previous, or question numbers to navigate.',
    start: 'Start exam',
    resume: 'Resume exam',
    submit: 'Submit exam',
    submitting: 'Submitting...',
    previous: 'Previous',
    next: 'Next',
    question: 'Question',
    questions: 'Questions',
    objectiveScore: 'Total score',
    answered: 'Answered',
    violations: 'Violations',
    timeLeft: 'Time left',
    submitNotice:
      'Multiple choice, fill-in, and open-ended answers are scored automatically. Open-ended answers are reviewed by AI.',
    violationBadge: 'Violation monitor',
    violationLimit: 'Maximum 3 violations',
    escViolation: 'Escape key was pressed during the exam.',
    switchViolation: 'The exam tab lost visibility or focus.',
    shiftTabViolation: 'Shift+Tab was pressed during the exam.',
    systemShortcutViolation: 'A Windows/Meta system shortcut was attempted during the exam.',
    navigationShortcutViolation: 'A browser tab or page navigation shortcut was attempted during the exam.',
    fullscreenViolation: 'Fullscreen exam mode was exited.',
    autoSubmitted: 'The exam was auto-submitted after the third violation.',
    notLive: 'This official exam is no longer live.',
    completed: 'Exam submitted successfully.',
    saveFailed:
      'The exam was submitted locally, but saving the attempt in the database failed.',
    saveSetupMissing:
      'Exam answers were submitted, but the exam_attempts table is not set up in Supabase yet.',
    gradingFailed:
      'AI grading for open-ended answers failed, so those answers were saved with 0 open-ended points.',
    resultTitle: 'Session complete',
    resultBody:
      'Your answers are locked. Review your outcome and return when you are ready.',
    returnToExams: 'Return to exams',
    takeAnother: 'Back to builder',
    answeredCount: 'Answered questions',
    violationsCount: 'Violation count',
    manualReview: 'Open-ended answers were reviewed by AI and included in the total score.',
    rulesAcknowledge: 'I understand the rules and I am ready to begin.',
    answerPlaceholder: 'Type your answer...',
    responsePlaceholder: 'Write your response...',
    stayFocused: 'Stay on this screen until you submit.',
    strike: 'Strike',
    violationWarning: 'Violation detected',
    violationPaused:
      'The exam is paused. Click resume to continue after this warning.',
    topAlert:
      'Warning: Escape, Shift+Tab, fullscreen exit, system shortcuts, or tab switching will add violations. In-exam navigation is safe. Three violations cause auto-submit.',
    previewOnlyTitle: 'Preview-only exam view',
    previewOnlyBody:
      'Admins and teachers can inspect the exam, but only students can start a live or practice attempt.',
    reviewTitle: 'Answer review',
    reviewBody:
      'See how your score was calculated and compare your response with the expected answer.',
    yourAnswer: 'Your answer',
    correctAnswerLabel: 'Correct answer',
    acceptedAnswersLabel: 'Accepted answers',
    explanationLabel: 'Explanation',
    aiSampleAnswer: 'AI sample answer',
    gradingNotesLabel: 'Grading notes',
    earnedPoints: 'Points earned',
    notAnswered: 'No answer submitted.',
    noOpenEndedAnswerFeedback: 'No answer was submitted for this open-ended question.',
    correct: 'Correct',
    incorrect: 'Incorrect',
    pendingReview: 'AI review',
    partial: 'Partial',
    aiFeedback: 'AI feedback',
    noViolations: 'No violations recorded.',
    attemptStorageHint:
      'If you want attempts saved in Supabase, run the exam_attempts SQL block too.',
  },} as const

const normalizeText = (value: string) => value.trim().toLowerCase()

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getRemainingLiveSeconds = (liveUntil: string | null) => {
  if (!liveUntil) return null

  return Math.max(0, Math.floor((new Date(liveUntil).getTime() - Date.now()) / 1000))
}

const getExamTimeLimitSeconds = (examRecord: StoredExamRecord) => {
  const durationSeconds = Math.max(
    1,
    (examRecord.exam_payload.estimatedDurationMinutes || 1) * 60
  )

  if (examRecord.exam_kind !== 'official') {
    return durationSeconds
  }

  const remainingLiveSeconds = getRemainingLiveSeconds(examRecord.live_until)

  if (remainingLiveSeconds === null) {
    return durationSeconds
  }

  return Math.min(durationSeconds, remainingLiveSeconds)
}

const isMetaKeyEvent = (event: KeyboardEvent) =>
  event.metaKey ||
  event.getModifierState?.('Meta') ||
  event.key === 'Meta' ||
  event.key === 'OS' ||
  event.key === 'Win' ||
  event.code === 'MetaLeft' ||
  event.code === 'MetaRight' ||
  event.code === 'OSLeft' ||
  event.code === 'OSRight'

const isSystemShiftShortcut = (event: KeyboardEvent) =>
  event.shiftKey && isMetaKeyEvent(event)

const isSystemShortcut = (event: KeyboardEvent) =>
  isMetaKeyEvent(event) || isSystemShiftShortcut(event)

const isBrowserNavigationShortcut = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase()
  const code = event.code.toLowerCase()
  const ctrlOrMeta = event.ctrlKey || isMetaKeyEvent(event)

  return (
    (key === 'tab' && (event.ctrlKey || event.metaKey || event.altKey)) ||
    (ctrlOrMeta && (key === 'pageup' || key === 'pagedown')) ||
    (event.altKey && (key === 'arrowleft' || key === 'arrowright' || key === 'tab')) ||
    (ctrlOrMeta && ['l', 'r', 'w', 'n', 't'].includes(key)) ||
    code === 'f11'
  )
}

const blockExamKeyboardEvent = (event: KeyboardEvent) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
}

const isAttemptTableMissing = (message: string) => {
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

const gradeOpenEndedAnswers = async (
  questions: Array<OpenEndedQuestion & { userAnswer: string }>,
  language: 'en' | 'sq',
  noAnswerFeedback: string
) => {
  if (!questions.length) {
    return [] as OpenEndedGrade[]
  }

  const unansweredGrades = questions
    .filter((question) => !question.userAnswer.trim())
    .map((question) => ({
      questionId: question.id,
      earnedPoints: 0,
      feedback: noAnswerFeedback,
    }))

  const answeredQuestions = questions.filter((question) => question.userAnswer.trim())

  if (!answeredQuestions.length) {
    return unansweredGrades
  }

  const response = await fetch('/api/exams/grade-open-ended', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language,
      questions: answeredQuestions.map((question) => ({
        questionId: question.id,
        prompt: question.prompt,
        points: question.points,
        sampleAnswer: question.sampleAnswer,
        gradingNotes: question.gradingNotes,
        userAnswer: question.userAnswer,
      })),
    }),
  })

  const data = (await safeReadJson(response)) as
    | { error?: string; grades?: OpenEndedGrade[] }
    | null

  if (!response.ok) {
    throw new Error(data?.error || 'AI grading failed.')
  }

  return [...unansweredGrades, ...(data?.grades ?? [])]
}

export default function ExamRunner({
  examId,
}: {
  examId: string
}) {
  const { role, roleLoading, user } = useAuth()
  const { locale } = useAppLocale()
  const t = copy[locale]
  const supabase = useSupabaseBrowserClient()
  const [examRecord, setExamRecord] = useState<StoredExamRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [violations, setViolations] = useState<string[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [saveNotice, setSaveNotice] = useState('')
  const [result, setResult] = useState<{
    status: ExamAttemptStatus
    payload: ExamAttemptPayload
  } | null>(null)
  const lastViolationAtRef = useRef(0)
  const lastInternalPointerAtRef = useRef(0)
  const submitStartedRef = useRef(false)

  useEffect(() => {
    const fetchExam = async () => {
      if (roleLoading) return

      if (!user) {
        setLoading(false)
        setError(t.notFound)
        return
      }

      setLoading(true)

      try {
        const { data, error } = await supabase
          .from('exams')
          .select(
            'id, user_id, title, description, topic_focus, difficulty, question_count, total_points, estimated_duration_minutes, status, exam_kind, exam_payload, published_at, live_until, created_at'
          )
          .eq('id', examId)
          .eq('status', 'published')
          .single()

        if (error || !data) {
          throw new Error(error?.message || t.notFound)
        }

        const nextExamRecord = data as StoredExamRecord
        const timeLimitSeconds = getExamTimeLimitSeconds(nextExamRecord)

        if (role === 'student' && nextExamRecord.exam_kind === 'official' && timeLimitSeconds <= 0) {
          throw new Error(t.notLive)
        }

        setExamRecord(nextExamRecord)
        setTimeLeft(timeLimitSeconds)
        setSessionDurationSeconds(timeLimitSeconds)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t.notFound)
      } finally {
        setLoading(false)
      }
    }

    void fetchExam()
  }, [examId, role, roleLoading, supabase, t.notFound, t.notLive, user])

  const exam = examRecord?.exam_payload as GeneratedExam | undefined

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value.trim().length > 0).length,
    [answers]
  )

  const reviewItems = useMemo(() => {
    if (!exam || !result) return []

    const answerMap = new Map(result.payload.answers.map((entry) => [entry.questionId, entry.answer]))
    const openEndedGradeMap = new Map(
      (result.payload.openEndedGrades ?? []).map((grade) => [grade.questionId, grade])
    )

    return exam.questions.map((question) => {
      const userAnswer = answerMap.get(question.id) || ''

      if (question.type === 'multiple_choice') {
        const isCorrect = normalizeText(userAnswer) === normalizeText(question.correctAnswer)
        return {
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          points: question.points,
          status: isCorrect ? 'correct' : 'incorrect',
          earnedPoints: isCorrect ? question.points : 0,
          userAnswer,
          correctAnswer: question.correctAnswer,
          acceptedAnswers: [] as string[],
          explanation: question.explanation,
          aiSampleAnswer: '',
          gradingNotes: [] as string[],
        }
      }

      if (question.type === 'fill_in_blank') {
        const acceptedAnswers = [question.correctAnswer, ...question.acceptableAnswers]
        const isCorrect = acceptedAnswers
          .map(normalizeText)
          .includes(normalizeText(userAnswer))

        return {
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          points: question.points,
          status: isCorrect ? 'correct' : 'incorrect',
          earnedPoints: isCorrect ? question.points : 0,
          userAnswer,
          correctAnswer: question.correctAnswer,
          acceptedAnswers,
          explanation: question.explanation,
          aiSampleAnswer: '',
          gradingNotes: [] as string[],
        }
      }

      const grade = openEndedGradeMap.get(question.id)
      const earnedPoints = grade?.earnedPoints ?? 0

      return {
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        points: question.points,
        status:
          earnedPoints >= question.points
            ? 'correct'
            : earnedPoints > 0
              ? 'partial'
              : 'incorrect',
        earnedPoints,
        userAnswer,
        correctAnswer: '',
        acceptedAnswers: [] as string[],
        explanation: grade?.feedback ?? '',
        aiSampleAnswer: question.sampleAnswer,
        gradingNotes: question.gradingNotes,
      }
    })
  }, [exam, result])

  const submitExam = useCallback(
    async (status: ExamAttemptStatus, violationSnapshot?: string[]) => {
      if (!exam || !examRecord || !user || role !== 'student' || submitted || submitStartedRef.current) return

      submitStartedRef.current = true
      setSubmitting(true)
      setIsPaused(false)
      setPauseReason('')

      const answersList: ExamAttemptAnswer[] = exam.questions.map((question) => ({
        questionId: question.id,
        type: question.type,
        answer: answers[question.id] || '',
      }))

      let totalScore = 0
      let totalMaxScore = 0
      let openEndedGrades: OpenEndedGrade[] = []
      const openEndedQuestions: Array<OpenEndedQuestion & { userAnswer: string }> = []

      exam.questions.forEach((question) => {
        const answer = normalizeText(answers[question.id] || '')
        totalMaxScore += question.points

        if (question.type === 'multiple_choice') {
          if (answer && answer === normalizeText(question.correctAnswer)) {
            totalScore += question.points
          }
        }

        if (question.type === 'fill_in_blank') {
          const accepted = [question.correctAnswer, ...question.acceptableAnswers].map(normalizeText)
          if (answer && accepted.includes(answer)) {
            totalScore += question.points
          }
        }

        if (question.type === 'open_ended') {
          openEndedQuestions.push({
            ...question,
            userAnswer: answers[question.id] || '',
          })
        }
      })

      try {
        openEndedGrades = await gradeOpenEndedAnswers(
          openEndedQuestions,
          locale,
          t.noOpenEndedAnswerFeedback
        )
        totalScore += openEndedGrades.reduce((sum, grade) => sum + grade.earnedPoints, 0)
      } catch {
        setSaveNotice(t.gradingFailed)
        openEndedGrades = openEndedQuestions.map((question) => ({
          questionId: question.id,
          earnedPoints: 0,
          feedback: t.gradingFailed,
        }))
      }

      const payload: ExamAttemptPayload = {
        examTitle: exam.title,
        examKind: examRecord.exam_kind,
        answers: answersList,
        objectiveScore: totalScore,
        objectiveMaxScore: totalMaxScore,
        answeredCount: answersList.filter((entry) => entry.answer.trim().length > 0).length,
        totalQuestions: exam.questions.length,
        violations: violationSnapshot ?? violations,
        submittedAt: new Date().toISOString(),
        openEndedGrades,
      }

      try {
        const { error } = await supabase.from('exam_attempts').insert([
          {
            exam_id: examRecord.id,
            user_id: user.id,
            status,
            violations_count: payload.violations.length,
            objective_score: payload.objectiveScore,
            objective_max_score: payload.objectiveMaxScore,
            attempt_payload: payload,
          },
        ])

        if (error) {
          throw new Error(error.message)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t.saveFailed
        setSaveNotice(isAttemptTableMissing(message) ? t.saveSetupMissing : message)
      } finally {
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => undefined)
        }

        setSubmitted(true)
        setStarted(false)
        setSubmitting(false)
        setResult({ status, payload })
      }
    },
    [
      answers,
      exam,
      examRecord,
      locale,
      role,
      submitted,
      supabase,
      t.gradingFailed,
      t.noOpenEndedAnswerFeedback,
      t.saveFailed,
      t.saveSetupMissing,
      user,
      violations,
    ]
  )

  const registerViolation = useCallback(
    (reason: string) => {
      const now = Date.now()
      if (
        now - lastViolationAtRef.current < 1500 ||
        submitted ||
        submitStartedRef.current ||
        !started ||
        isPaused
      ) {
        return
      }

      lastViolationAtRef.current = now
      setIsPaused(true)
      setPauseReason(reason)

      const nextViolations = [...violations, reason]
      setViolations(nextViolations)

      if (nextViolations.length >= VIOLATION_LIMIT) {
        void submitExam('auto_submitted', nextViolations)
      }
    },
    [isPaused, started, submitExam, submitted, violations]
  )

  useEffect(() => {
    if (!started || submitted) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        blockExamKeyboardEvent(event)
        registerViolation(t.escViolation)
        return
      }

      if (event.key === 'Tab' && event.shiftKey) {
        blockExamKeyboardEvent(event)
        registerViolation(t.shiftTabViolation)
        return
      }

      if (isSystemShortcut(event)) {
        blockExamKeyboardEvent(event)
        registerViolation(t.systemShortcutViolation)
        return
      }

      if (isBrowserNavigationShortcut(event)) {
        blockExamKeyboardEvent(event)
        registerViolation(t.navigationShortcutViolation)
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        registerViolation(t.switchViolation)
      }
    }

    const onPointerDown = () => {
      lastInternalPointerAtRef.current = Date.now()
    }

    const onBlur = () => {
      window.setTimeout(() => {
        const wasRecentInExamClick = Date.now() - lastInternalPointerAtRef.current < 1000

        if (!document.hidden && !wasRecentInExamClick && !document.hasFocus()) {
          registerViolation(t.switchViolation)
        }
      }, 200)
    }

    const onFullscreenChange = () => {
      if (!document.fullscreenElement && started && !submitted && !submitting) {
        registerViolation(t.fullscreenViolation)
      }
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur, true)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur, true)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [
    registerViolation,
    started,
    submitted,
    submitting,
    t.escViolation,
    t.fullscreenViolation,
    t.navigationShortcutViolation,
    t.shiftTabViolation,
    t.switchViolation,
    t.systemShortcutViolation,
  ])

  useEffect(() => {
    if (!started || submitted || isPaused) return

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          void submitExam('completed')
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isPaused, started, submitExam, submitted])

  const startExam = async () => {
    if (!examRecord || role !== 'student') return

    const timeLimitSeconds = getExamTimeLimitSeconds(examRecord)

    if (examRecord.exam_kind === 'official' && timeLimitSeconds <= 0) {
      setError(t.notLive)
      return
    }

    submitStartedRef.current = false
    lastViolationAtRef.current = 0
    lastInternalPointerAtRef.current = 0
    setStarted(true)
    setSubmitted(false)
    setCurrentIndex(0)
    setViolations([])
    setIsPaused(false)
    setPauseReason('')
    setSaveNotice('')
    setResult(null)
    setTimeLeft(timeLimitSeconds)
    setSessionDurationSeconds(timeLimitSeconds)

    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        // Fullscreen can be blocked by the browser; the exam can still proceed.
      }
    }
  }

  const resumeExam = async () => {
    setIsPaused(false)
    setPauseReason('')

    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        // If fullscreen is blocked, keep the session active anyway.
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <span className="spinner-arc h-6 w-6" />
          {t.loading}
        </div>
      </div>
    )
  }

  if (error || !exam || !examRecord) {
    return <div className="min-h-screen p-6 text-sm text-rose-600">{error || t.notFound}</div>
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(180,83,9,0.12),transparent_26%),linear-gradient(180deg,#f8f4ed_0%,#eee6db_100%)] px-4 py-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/95 p-6 text-slate-950 shadow-[0_35px_100px_-48px_rgba(15,23,42,0.45)] sm:p-8">
            <span className="eyebrow">{t.resultTitle}</span>
            <h1 className="page-title mt-5 max-w-3xl text-slate-950">{exam.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{t.resultBody}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-slate-200/80 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.objectiveScore}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {result.payload.objectiveScore}/{result.payload.objectiveMaxScore}
                </p>
              </div>
              <div className="rounded-[28px] border border-slate-200/80 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.answeredCount}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {result.payload.answeredCount}/{result.payload.totalQuestions}
                </p>
              </div>
              <div className="rounded-[28px] border border-slate-200/80 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.violationsCount}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{result.payload.violations.length}</p>
              </div>
            </div>

            <div className={`mt-6 rounded-[24px] border p-4 text-sm ${
              result.status === 'auto_submitted'
                ? 'border-rose-200/70 bg-rose-50/80 text-rose-700'
                : 'border-emerald-200/70 bg-emerald-50/80 text-emerald-700'
            }`}>
              {result.status === 'auto_submitted' ? t.autoSubmitted : t.completed}
            </div>

            <p className="mt-4 text-sm text-slate-500">{t.manualReview}</p>
            {saveNotice && (
              <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                <p>{saveNotice}</p>
                <p className="mt-2 text-xs text-amber-700">{t.attemptStorageHint}</p>
              </div>
            )}

            {result.payload.violations.length > 0 && (
              <div className="mt-6 space-y-2">
                {result.payload.violations.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-[22px] border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {index + 1}. {item}
                  </div>
                ))}
              </div>
            )}

            {result.payload.violations.length === 0 && (
              <div className="mt-6 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {t.noViolations}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/exams" className="primary-button justify-center">
                {t.returnToExams}
              </Link>
              <Link href="/dashboard/exams" className="secondary-button justify-center text-slate-900">
                {t.takeAnother}
              </Link>
            </div>
          </section>

          <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/95 p-6 text-slate-950 shadow-[0_35px_100px_-48px_rgba(15,23,42,0.45)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="eyebrow">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  {t.reviewTitle}
                </span>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{t.reviewBody}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {reviewItems.length} {t.questions.toLowerCase()}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {reviewItems.map((item, index) => {
                const statusStyles =
                  item.status === 'correct'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : item.status === 'partial'
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : item.status === 'incorrect'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'

                const statusLabel =
                  item.status === 'correct'
                    ? t.correct
                    : item.status === 'partial'
                      ? t.partial
                    : item.status === 'incorrect'
                      ? t.incorrect
                      : t.pendingReview

                return (
                  <article key={item.id} className="rounded-[28px] border border-slate-200/80 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                            {t.question} {index + 1}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles}`}>
                            {statusLabel}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                            {EXAM_CATEGORY_META[item.type].label}
                          </span>
                        </div>
                        <p className="mt-4 text-lg leading-8 text-slate-900">{item.prompt}</p>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.earnedPoints}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {item.earnedPoints}/{item.points}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.yourAnswer}</p>
                        <p className="mt-3 text-sm leading-7 text-slate-800">
                          {item.userAnswer.trim() ? item.userAnswer : t.notAnswered}
                        </p>
                      </div>

                      {item.type !== 'open_ended' ? (
                        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.correctAnswerLabel}</p>
                          <p className="mt-3 text-sm leading-7 text-slate-800">{item.correctAnswer}</p>
                          {item.acceptedAnswers.length > 1 && (
                            <>
                              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.acceptedAnswersLabel}</p>
                              <p className="mt-2 text-sm leading-7 text-slate-700">{item.acceptedAnswers.join(', ')}</p>
                            </>
                          )}
                          {item.explanation && (
                            <>
                              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.explanationLabel}</p>
                              <p className="mt-2 text-sm leading-7 text-slate-700">{item.explanation}</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.aiSampleAnswer}</p>
                          <p className="mt-3 text-sm leading-7 text-slate-800">{item.aiSampleAnswer}</p>
                          {item.explanation && (
                            <>
                              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.aiFeedback}</p>
                              <p className="mt-2 text-sm leading-7 text-slate-700">{item.explanation}</p>
                            </>
                          )}
                          {item.gradingNotes.length > 0 && (
                            <>
                              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.gradingNotesLabel}</p>
                              <div className="mt-2 space-y-2">
                                {item.gradingNotes.map((note, noteIndex) => (
                                  <div key={`${item.id}-note-${noteIndex}`} className="rounded-[18px] bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                    {note}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(180,83,9,0.12),transparent_30%),linear-gradient(180deg,#f9f5ee_0%,#ede3d6_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_28%),linear-gradient(180deg,#09111b_0%,#101927_100%)]">
        <div className="mx-auto max-w-6xl space-y-5">
          <Link href="/dashboard/exams" className="secondary-button">
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>

          <section className="surface overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <span className="eyebrow">{t.introBadge}</span>
                <h1 className="page-title mt-5 max-w-4xl">{t.introTitle}</h1>
                <p className="page-copy mt-4 max-w-3xl">{t.introBody}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="surface-muted p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t.questions}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{exam.questions.length}</p>
                  </div>
                  <div className="surface-muted p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t.timeLeft}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{exam.estimatedDurationMinutes}m</p>
                  </div>
                  <div className="surface-muted p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t.violations}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{VIOLATION_LIMIT}</p>
                  </div>
                </div>
              </div>

              <div className="surface-muted p-5">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t.rulesTitle}</h2>
                <div className="mt-5 space-y-3">
                  <div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-rose-500" /><p className="text-sm text-slate-600 dark:text-slate-300">{t.ruleEsc}</p></div>
                  <div className="flex gap-3"><MonitorCog className="mt-0.5 h-5 w-5 text-amber-500" /><p className="text-sm text-slate-600 dark:text-slate-300">{t.ruleSwitch}</p></div>
                  <div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-rose-500" /><p className="text-sm text-slate-600 dark:text-slate-300">{t.ruleShiftTab}</p></div>
                  <div className="flex gap-3"><MonitorCog className="mt-0.5 h-5 w-5 text-amber-500" /><p className="text-sm text-slate-600 dark:text-slate-300">{t.ruleSystemShortcut}</p></div>
                  <div className="flex gap-3"><FileWarning className="mt-0.5 h-5 w-5 text-rose-500" /><p className="text-sm text-slate-600 dark:text-slate-300">{t.ruleFullscreen}</p></div>
                  <div className="flex gap-3"><FileWarning className="mt-0.5 h-5 w-5 text-sky-500" /><p className="text-sm text-slate-600 dark:text-slate-300">{t.ruleAuto}</p></div>
                  <div className="flex gap-3"><ScanEye className="mt-0.5 h-5 w-5 text-[var(--accent)]" /><p className="text-sm text-slate-600 dark:text-slate-300">{t.ruleNav}</p></div>
                </div>

                {role === 'student' ? (
                  <>
                    <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-white/70 p-4 text-sm text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                      {t.rulesAcknowledge}
                    </div>

                    <button type="button" onClick={startExam} className="primary-button mt-6 w-full justify-center">
                      <Sparkles className="h-4 w-4" />
                      {t.start}
                    </button>
                  </>
                ) : (
                  <div className="mt-6 rounded-[24px] border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                    <p className="font-semibold">{t.previewOnlyTitle}</p>
                    <p className="mt-2 leading-6">{t.previewOnlyBody}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {role !== 'student' && (
            <section className="surface overflow-hidden p-6 sm:p-8">
              <span className="eyebrow">
                <BookOpenCheck className="h-3.5 w-3.5" />
                {t.reviewTitle}
              </span>
              <div className="mt-5 space-y-3">
                {exam.questions.map((question, index) => (
                  <article key={question.id} className="surface-muted p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="status-pill">
                        {t.question} {index + 1}
                      </span>
                      <span className="status-pill">
                        {EXAM_CATEGORY_META[question.type].label}
                      </span>
                      <span className="status-pill">{question.points} pts</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                      {question.prompt}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    )
  }

  const currentQuestion = exam.questions[currentIndex]
  const progress = ((currentIndex + 1) / exam.questions.length) * 100
  const totalExamSeconds = sessionDurationSeconds || (exam.estimatedDurationMinutes || 1) * 60
  const timeRatio = totalExamSeconds > 0 ? timeLeft / totalExamSeconds : 1
  const timerWarning = timeRatio <= 0.2
  const timerCritical = timeRatio <= 0.1

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_20%),linear-gradient(180deg,#faf6ef_0%,#efe5d8_100%)] px-4 py-4 text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_22%),linear-gradient(180deg,#09111b_0%,#0f1824_100%)] dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="animate-slideInRight sticky top-3 z-30 mb-5 rounded-[26px] border border-rose-200/80 bg-rose-50/90 px-5 py-4 shadow-depth-lg backdrop-blur-xl dark:border-rose-400/25 dark:bg-rose-500/12">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700 dark:text-rose-200">{t.violationWarning}</p>
              <p className="mt-1 text-sm leading-6 text-rose-900/80 dark:text-rose-50">{t.topAlert}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                key={`violation-pill-${violations.length}`}
                className="animate-shake rounded-full border border-rose-300/70 bg-white/75 px-3 py-1 text-sm text-rose-700 dark:border-rose-300/25 dark:bg-rose-500/20 dark:text-rose-50"
              >
                {t.violations}: {violations.length}/{VIOLATION_LIMIT}
              </span>
              {pauseReason && (
                <span className="rounded-full border border-amber-300/70 bg-amber-50/90 px-3 py-1 text-sm text-amber-800 dark:border-amber-300/25 dark:bg-amber-400/15 dark:text-amber-100">
                  {pauseReason}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-[32px] border border-slate-200/80 bg-[rgba(255,253,249,0.88)] p-5 text-slate-950 shadow-[0_38px_110px_-62px_rgba(148,163,184,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:shadow-[0_38px_110px_-54px_rgba(2,6,23,0.95)] sm:p-7">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-200/80">{exam.title}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.question} {currentIndex + 1}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div
                style={timerCritical ? { animationDuration: '0.8s' } : undefined}
                className={`rounded-full border px-4 py-2 text-sm shadow-depth-sm transition-all duration-300 ${
                  timerCritical
                    ? 'animate-pulse-ring border-rose-300/80 bg-rose-50/90 text-rose-700 dark:border-rose-300/30 dark:bg-rose-500/15 dark:text-rose-100'
                    : timerWarning
                      ? 'animate-pulse-ring border-amber-300/80 bg-amber-50/90 text-amber-800 dark:border-amber-300/30 dark:bg-amber-400/12 dark:text-amber-100'
                      : 'border-slate-200/80 bg-white/85 text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-100'
                }`}
              >
                <Clock3 className="mr-2 inline h-4 w-4 text-teal-600 dark:text-teal-300" />
                {formatTime(timeLeft)}
              </div>
              <button
                type="button"
                onClick={() => void submitExam('completed')}
                disabled={submitting}
                className="primary-button"
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          </div>

          <div className="mt-5 h-2 rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-sky-400" style={{ width: `${progress}%` }} />
          </div>

          <div key={currentQuestion.id} className="animate-fadeInScale mt-6 rounded-[30px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_34px_90px_-54px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-900/75 dark:shadow-[0_40px_90px_-50px_rgba(15,118,110,0.45)] sm:p-7">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:bg-white/10 dark:text-teal-100">
                {EXAM_CATEGORY_META[currentQuestion.type].label}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-200">
                {currentQuestion.points} pts
              </span>
            </div>

            <p className="mt-5 text-xl leading-9 text-slate-900 dark:text-white sm:text-2xl">{currentQuestion.prompt}</p>

            <div className="mt-6">
              {currentQuestion.type === 'multiple_choice' && (
                <div className="grid gap-3">
                  {currentQuestion.options.map((option) => {
                    const selected = answers[currentQuestion.id] === option
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: option }))}
                        className={`rounded-[24px] border-2 px-4 py-4 text-left text-sm font-medium transition sm:text-base ${
                          selected
                            ? 'border-teal-500 bg-teal-100 text-teal-900 shadow-[0_0_0_4px_rgba(20,184,166,0.18),0_4px_16px_-4px_rgba(20,184,166,0.28)] dark:border-teal-400 dark:bg-teal-400/25 dark:text-teal-50 dark:shadow-[0_0_0_4px_rgba(45,212,191,0.2),0_8px_24px_-8px_rgba(45,212,191,0.4)]'
                            : 'border-slate-200 bg-white/88 text-slate-700 hover:border-teal-400/50 hover:bg-teal-50/40 dark:border-white/10 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:border-teal-300/40 dark:hover:bg-slate-900/80'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === 'fill_in_blank' && (
                <input
                  value={answers[currentQuestion.id] || ''}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [currentQuestion.id]: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/20 dark:border-white/15 dark:bg-slate-950/80 dark:text-white dark:placeholder:text-slate-500"
                  placeholder={t.answerPlaceholder}
                />
              )}

              {currentQuestion.type === 'open_ended' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [currentQuestion.id]: event.target.value }))
                  }
                  className="min-h-52 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/20 dark:border-white/15 dark:bg-slate-950/80 dark:text-white dark:placeholder:text-slate-500"
                  placeholder={t.responsePlaceholder}
                />
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((current) => Math.max(0, current - 1))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-400/40 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/12 dark:bg-white/6 dark:text-slate-100 dark:hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t.previous}
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((current) => Math.min(exam.questions.length - 1, current + 1))
                }
                disabled={currentIndex === exam.questions.length - 1}
                className="primary-button justify-center disabled:opacity-40"
              >
                {t.next}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-slate-200/80 bg-[rgba(255,253,249,0.88)] p-5 text-slate-950 shadow-[0_35px_100px_-62px_rgba(148,163,184,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:shadow-[0_35px_100px_-56px_rgba(2,6,23,0.92)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t.violationBadge}</p>
                <p className="mt-2 text-lg font-semibold">{t.violationLimit}</p>
              </div>
              <div className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
                {violations.length}/{VIOLATION_LIMIT}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {Array.from({ length: VIOLATION_LIMIT }).map((_, index) => (
                <div
                  key={index}
                  className={`rounded-2xl border px-3 py-2 text-sm ${
                    index < violations.length
                      ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/50 dark:bg-rose-500/15 dark:text-rose-100'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300'
                  }`}
                >
                  <Flag className="mr-2 inline h-4 w-4" />
                  {t.strike} {index + 1}
                </div>
              ))}
            </div>

            {violations.length > 0 && (
              <div className="mt-4 space-y-2">
                {violations.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200">
                    {index + 1}. {item}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[30px] border border-slate-200/80 bg-[rgba(255,253,249,0.88)] p-5 text-slate-950 shadow-[0_35px_100px_-62px_rgba(148,163,184,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:shadow-[0_35px_100px_-56px_rgba(2,6,23,0.92)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t.questions}</p>
                <p className="mt-2 text-lg font-semibold">{answeredCount}/{exam.questions.length} {t.answered.toLowerCase()}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-300" />
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {exam.questions.map((question, index) => {
                const answered = Boolean(answers[question.id]?.trim())
                const active = index === currentIndex

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`rounded-2xl px-0 py-3 text-sm font-semibold transition ${
                      active
                        ? 'bg-gradient-to-br from-teal-400 to-sky-400 text-slate-950 shadow-depth-sm'
                        : answered
                          ? 'border border-teal-300/40 bg-teal-50/80 text-teal-950 dark:border-teal-300/25 dark:bg-teal-400/12 dark:text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900/90'
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200/80 bg-[rgba(255,253,249,0.88)] p-5 text-slate-950 shadow-[0_35px_100px_-62px_rgba(148,163,184,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:shadow-[0_35px_100px_-56px_rgba(2,6,23,0.92)]">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{t.submitNotice}</p>
            <div className="mt-4 rounded-[24px] border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              {t.stayFocused}
            </div>
          </section>
        </aside>
        </div>

        {isPaused && !submitted && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-[4px] dark:bg-slate-950/70">
            <div className="animate-fadeInScale w-full max-w-xl rounded-[32px] border border-rose-200/80 bg-white/96 p-6 text-slate-950 shadow-[0_45px_120px_-56px_rgba(225,29,72,0.28)] dark:border-rose-300/20 dark:bg-slate-950/95 dark:text-white dark:shadow-[0_45px_120px_-45px_rgba(244,63,94,0.75)] sm:p-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight">{t.violationWarning}</h2>
              <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300">{pauseReason}</p>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.violationPaused}</p>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t.violations}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{violations.length}/{VIOLATION_LIMIT}</p>
                </div>
                <button type="button" onClick={resumeExam} className="primary-button justify-center">
                  {t.resume}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
