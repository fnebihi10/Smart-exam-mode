import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with OpenRouter configuration
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY, // or process.env.OPENAI_API_KEY if you kept that name
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter (your site URL)
    'X-Title': 'Smart Exam Mode', // Optional, shows in OpenRouter dashboard
  },
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Mesazhi është i zbrazët' },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini', // You can change this to any model OpenRouter supports
      messages: [
        {
          role: 'system',
          content: 'Je një asistent i dobishëm për një aplikacion provimi. Përgjigju shkurt dhe qartë.',
        },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Gabim gjatë komunikimit me AI' },
      { status: 500 }
    );
  }
}