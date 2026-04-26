import OpenAI from 'openai'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const OPENROUTER_APP_TITLE = 'Smart Exam Mode'
const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini'

const normalizeBaseUrl = (value: string | undefined) => {
  const trimmed = value?.trim()

  if (!trimmed) {
    return 'http://localhost:3000'
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return `https://${trimmed}`
}

export const getAppBaseUrl = () =>
  normalizeBaseUrl(
    process.env.APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL
  )

export const hasOpenRouterApiKey = () =>
  Boolean(process.env.OPENROUTER_API_KEY?.trim())

export const getRequiredOpenRouterApiKey = () => {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing on the server.')
  }

  return apiKey
}

export const getOpenRouterModel = (
  envName: 'OPENROUTER_CHAT_MODEL' | 'OPENROUTER_EXAM_MODEL'
) => process.env[envName]?.trim() || DEFAULT_OPENROUTER_MODEL

export const createOpenRouterClient = () =>
  new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: getRequiredOpenRouterApiKey(),
    defaultHeaders: {
      'HTTP-Referer': getAppBaseUrl(),
      'X-Title': OPENROUTER_APP_TITLE,
    },
  })
