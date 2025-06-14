import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json() as { description?: string };

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Prompt engineering: ask for concise bullet cursor rules tailored to project
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'You are an expert architect writing *meta* Cursor rules. Meta-rules instruct future AI agents HOW to derive project-specific rules once the project is opened in Cursor. Keep them general yet tailored to the project domain, focusing on naming conventions, architectural patterns to look for, and important questions to ask. Output 5-8 concise bullet statements (no numbering, begin each with a dash).' 
      },
      {
        role: 'user',
        content: `Project description: "${description}"\n\nWrite meta Cursor rules:`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 300
    });

    const rawText = completion.choices[0]?.message?.content || '';

    // Split into lines, trim bullets and spaces
    const rules = rawText
      .split('\n')
      .map((line: string) => line.replace(/^[-*\d.\s]+/, '').trim())
      .filter((line: string) => line.length > 0);

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('OpenAI error', error);
    return NextResponse.json({ error: 'Failed to generate rules' }, { status: 500 });
  }
} 