import type { ExamAttemptPayload, StoredExamRecord } from '@/types/exams'

type LiveSessionExam = Pick<
  StoredExamRecord,
  'id' | 'exam_kind' | 'published_at'
>

export type AttemptLiveSessionRecord = {
  created_at: string
  attempt_payload: Pick<ExamAttemptPayload, 'liveSessionId'> | null
}

export const getExamLiveSessionId = (exam: LiveSessionExam) => {
  if (exam.exam_kind !== 'official') return null

  return exam.published_at || `legacy:${exam.id}`
}

export const isAttemptForCurrentLiveSession = (
  attempt: AttemptLiveSessionRecord,
  exam: LiveSessionExam
) => {
  if (exam.exam_kind !== 'official') return true

  const currentLiveSessionId = getExamLiveSessionId(exam)
  const attemptLiveSessionId = attempt.attempt_payload?.liveSessionId

  if (attemptLiveSessionId) {
    return attemptLiveSessionId === currentLiveSessionId
  }

  if (!exam.published_at) {
    return true
  }

  return new Date(attempt.created_at).getTime() >= new Date(exam.published_at).getTime()
}
