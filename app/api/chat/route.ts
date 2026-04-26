import { NextRequest, NextResponse } from 'next/server'
import { getLectureContext } from '@/utils/fileParsing'
import {
  createOpenRouterClient,
  getOpenRouterModel,
  hasOpenRouterApiKey,
} from '@/utils/openrouter'

const client = createOpenRouterClient()
const chatModel = getOpenRouterModel('OPENROUTER_CHAT_MODEL')

export async function POST(request: NextRequest) {
  try {
    if (!hasOpenRouterApiKey()) {
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
