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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { message?: string }
    const message = body.message?.trim()

    if (!message) {
      return NextResponse.json({ error: 'Mesazhi është i zbrazët.' }, { status: 400 })
    }

    const lectureContext = await getLectureContext()

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Je një asistent i dobishëm për një aplikacion provimi. Përgjigju shkurt dhe qartë.

Më poshtë është baza e njohurive nga leksionet e ngarkuara të përdoruesit.
Nëse pyetja lidhet me këto materiale, përdori si burimin parësor.

KNOWLEDGE BASE:
${lectureContext || 'Nuk ka materiale të ngarkuara ende.'}`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 1000,
    })

    const reply = completion.choices[0]?.message.content ?? 'Nuk mora një përgjigje këtë herë.'
    return NextResponse.json({ reply })
  } catch (error: unknown) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Gabim gjatë komunikimit me AI.' }, { status: 500 })
  }
}
