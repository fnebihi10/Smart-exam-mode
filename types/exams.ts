export type ExamDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'

export type ExamKind = 'official' | 'practice'

export type ExamStatus = 'draft' | 'published' | 'archived'

export type ExamQuestionType = 'multiple_choice' | 'fill_in_blank' | 'open_ended'

export interface ExamCategorySetting {
  type: ExamQuestionType
  count: number
  points: number
}

export interface ExamGenerationRequest {
  title: string
  topicFocus: string
  difficulty: ExamDifficulty
  language: 'en' | 'sq'
  estimatedDurationMinutes: number
  selectedLectureIds: string[]
  categories: ExamCategorySetting[]
}

interface BaseQuestion {
  id: string
  type: ExamQuestionType
  prompt: string
  points: number
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice'
  options: string[]
  correctAnswer: string
  explanation: string
}

export interface FillInBlankQuestion extends BaseQuestion {
  type: 'fill_in_blank'
  correctAnswer: string
  acceptableAnswers: string[]
  explanation: string
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: 'open_ended'
  sampleAnswer: string
  gradingNotes: string[]
}

export type ExamQuestion =
  | MultipleChoiceQuestion
  | FillInBlankQuestion
  | OpenEndedQuestion

export interface GeneratedExam {
  title: string
  description: string
  instructions: string[]
  topicFocus: string
  difficulty: ExamDifficulty
  estimatedDurationMinutes: number
  totalPoints: number
  questions: ExamQuestion[]
}

export interface StoredExamRecord {
  id: string
  user_id: string
  title: string
  description: string | null
  topic_focus: string | null
  difficulty: ExamDifficulty
  question_count: number
  total_points: number
  estimated_duration_minutes: number
  status: ExamStatus
  exam_kind: ExamKind
  exam_payload: GeneratedExam
  published_at: string | null
  live_until: string | null
  created_at: string
}

export type ExamAttemptStatus = 'completed' | 'auto_submitted'

export type ExamAnswerValue = string

export interface ExamAttemptAnswer {
  questionId: string
  type: ExamQuestionType
  answer: ExamAnswerValue
}

export interface OpenEndedGrade {
  questionId: string
  earnedPoints: number
  feedback: string
}

export interface ExamAttemptPayload {
  examTitle?: string
  examKind?: ExamKind
  answers: ExamAttemptAnswer[]
  objectiveScore: number
  objectiveMaxScore: number
  answeredCount: number
  totalQuestions: number
  violations: string[]
  submittedAt: string
  openEndedGrades?: OpenEndedGrade[]
}

export interface StoredExamAttemptRecord {
  id: string
  exam_id: string
  user_id: string
  status: ExamAttemptStatus
  violations_count: number
  objective_score: number
  objective_max_score: number
  attempt_payload: ExamAttemptPayload
  created_at: string
}

export const EXAM_CATEGORY_META: Record<
  ExamQuestionType,
  {
    label: string
    shortLabel: string
    helper: string
  }
> = {
  multiple_choice: {
    label: 'Multiple choice',
    shortLabel: 'MCQ',
    helper: 'Two or more options per question with one correct answer.',
  },
  fill_in_blank: {
    label: 'Fill in the blank',
    shortLabel: 'Blank',
    helper: 'Short-answer prompts with expected terms or phrases.',
  },
  open_ended: {
    label: 'Open ended',
    shortLabel: 'Essay',
    helper: 'Written-response questions with grading guidance.',
  },
}

export const DEFAULT_EXAM_SETTINGS: ExamCategorySetting[] = [
  { type: 'multiple_choice', count: 9, points: 2 },
  { type: 'fill_in_blank', count: 4, points: 3 },
  { type: 'open_ended', count: 2, points: 8 },
]
