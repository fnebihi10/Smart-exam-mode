import { NextRequest, NextResponse } from 'next/server'
import { getLectureContext } from '@/utils/fileParsing'
import {
  createOpenAIClient,
  getOpenAIModel,
  hasOpenAIApiKey,
} from '@/utils/openai'

const chatModel = getOpenAIModel('OPENAI_CHAT_MODEL')

export async function POST(request: NextRequest) {
  try {
    if (!hasOpenAIApiKey()) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is missing on the server.' },
        { status: 500 }
      )
    }

    let body: {
      message?: string
      mode?: 'general' | 'lecture'
      selectedLectureIds?: unknown
    } = {}

    try {
      body = (await request.json()) as {
        message?: string
        mode?: 'general' | 'lecture'
        selectedLectureIds?: unknown
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const message = body.message?.trim()

    if (!message) {
      return NextResponse.json(
        { error: 'Message cannot be empty.' },
        { status: 400 }
      )
    }

    const selectedLectureIds = Array.isArray(body.selectedLectureIds)
      ? body.selectedLectureIds
          .filter((id): id is string => typeof id === 'string')
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, 5)
      : []
    const isGeneralMode = body.mode === 'general'
    const lectureContext = isGeneralMode
      ? ''
      : await getLectureContext(selectedLectureIds)

    if (!isGeneralMode && selectedLectureIds.length > 0 && !lectureContext.trim()) {
      return NextResponse.json(
        {
          error:
            'The selected lecture exists in the list, but its file is missing from Supabase Storage. Re-upload this lecture from Lectures or choose another file.',
        },
        { status: 404 }
      )
    }
    const client = createOpenAIClient()

    const completion = await client.chat.completions.create({
      model: chatModel,
      messages: [
        {
          role: 'system',
          content: isGeneralMode
            ? `You are a helpful general AI study assistant for an exam preparation app. Answer clearly and concisely.
Help with revision plans, explanations, practice questions, exam strategy, and study routines.
Respond in the same language as the user's message unless they explicitly ask for another language.`
            : `You are a helpful assistant for an exam preparation app. Answer clearly and concisely.
Respond in the same language as the user's message unless they explicitly ask for another language.

Below is the knowledge base from the user's uploaded lectures.
If the question relates to these materials, use them as the primary source.

KNOWLEDGE BASE:
${lectureContext || 'The selected lecture could not be read yet. Ask the user to confirm the file uploaded correctly or choose another lecture.'}`,
        },
        { role: 'user', content: message },
      ],
      max_completion_tokens: 1000,
    })

    const reply =
      completion.choices[0]?.message.content ??
      'I could not generate an answer this time.'

    return NextResponse.json({ reply })
  } catch (error: unknown) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'AI communication failed.' },
      { status: 500 }
    )
  }
}
