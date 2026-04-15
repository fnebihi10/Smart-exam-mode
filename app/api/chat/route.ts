import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getLectureContext } from '@/utils/fileParsing'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'Smart Exam Mode',
  },
})

const chatModel =
  process.env.OPENROUTER_CHAT_MODEL?.trim() || 'openai/gpt-4o-mini'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY is missing on the server.' },
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
        { error: 'Mesazhi eshte i zbrazet.' },
        { status: 400 }
      )
    }

    const lectureContext = await getLectureContext()

    const completion = await client.chat.completions.create({
      model: chatModel,
      messages: [
        {
          role: 'system',
          content: `Je nje asistent i dobishem per nje aplikacion provimi. Pergjigju shkurt dhe qarte.

Me poshte eshte baza e njohurive nga leksionet e ngarkuara te perdoruesit.
Nese pyetja lidhet me keto materiale, perdori si burimin paresor.

KNOWLEDGE BASE:
${lectureContext || 'Nuk ka materiale te ngarkuara ende.'}`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 1000,
    })

    const reply =
      completion.choices[0]?.message.content ??
      'Nuk mora nje pergjigje kete here.'

    return NextResponse.json({ reply })
  } catch (error: unknown) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Gabim gjate komunikimit me AI.' },
      { status: 500 }
    )
  }
}
