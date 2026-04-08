export type ExamDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'

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
  title: string
  description: string | null
  topic_focus: string | null
  difficulty: ExamDifficulty
  question_count: number
  total_points: number
  estimated_duration_minutes: number
  status: 'published'
  exam_payload: GeneratedExam
  created_at: string
}

export type ExamAttemptStatus = 'completed' | 'auto_submitted'

export type ExamAnswerValue = string

export interface ExamAttemptAnswer {
  questionId: string
  type: ExamQuestionType
  answer: ExamAnswerValue
}

export interface ExamAttemptPayload {
  answers: ExamAttemptAnswer[]
  objectiveScore: number
  objectiveMaxScore: number
  answeredCount: number
  totalQuestions: number
  violations: string[]
  submittedAt: string
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
    label: { en: string; sq: string }
    shortLabel: { en: string; sq: string }
    helper: { en: string; sq: string }
  }
> = {
  multiple_choice: {
    label: { en: 'Multiple choice', sq: 'Me alternativa' },
    shortLabel: { en: 'MCQ', sq: 'Alternativa' },
    helper: {
      en: 'Four options per question with one correct answer.',
      sq: 'Kater opsione per pyetje me nje pergjigje te sakte.',
    },
  },
  fill_in_blank: {
    label: { en: 'Fill in the blank', sq: 'Plotesim' },
    shortLabel: { en: 'Blank', sq: 'Plotesim' },
    helper: {
      en: 'Short-answer prompts with expected terms or phrases.',
      sq: 'Pyetje te shkurtra me terma ose fraza te pritshme.',
    },
  },
  open_ended: {
    label: { en: 'Open ended', sq: 'Pergjigje e hapur' },
    shortLabel: { en: 'Essay', sq: 'Ese' },
    helper: {
      en: 'Written-response questions with grading guidance.',
      sq: 'Pyetje me shkrim me udhezime vleresimi.',
    },
  },
}

export const DEFAULT_EXAM_SETTINGS: ExamCategorySetting[] = [
  { type: 'multiple_choice', count: 9, points: 2 },
  { type: 'fill_in_blank', count: 4, points: 3 },
  { type: 'open_ended', count: 2, points: 8 },
]
