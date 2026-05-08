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

    let body: { message?: string } = {}

    try {
      body = (await request.json()) as { message?: string }
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

    const lectureContext = await getLectureContext()
    const client = createOpenAIClient()

    const completion = await client.chat.completions.create({
      model: chatModel,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for an exam preparation app. Answer clearly and concisely.
Respond in the same language as the user's message unless they explicitly ask for another language.

Below is the knowledge base from the user's uploaded lectures.
If the question relates to these materials, use them as the primary source.

KNOWLEDGE BASE:
${lectureContext || 'No lecture materials have been uploaded yet.'}`,
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
