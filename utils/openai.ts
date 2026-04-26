import OpenAI from 'openai'

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

export const hasOpenAIApiKey = () =>
  Boolean(process.env.OPENAI_API_KEY?.trim())

export const getRequiredOpenAIApiKey = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing on the server.')
  }

  return apiKey
}

export const getOpenAIModel = (
  envName: 'OPENAI_CHAT_MODEL' | 'OPENAI_EXAM_MODEL'
) => process.env[envName]?.trim() || DEFAULT_OPENAI_MODEL

export const createOpenAIClient = () =>
  new OpenAI({
    apiKey: getRequiredOpenAIApiKey(),
  })
