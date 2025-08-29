import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const { business, reviewText } = await req.json();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const msg = `Write a courteous 60-80 word reply from "${business}" to this Google review. Personalize, thank them, and invite them back.\n\nReview: ${reviewText}`;
  const r = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: msg }],
    temperature: 0.5
  });
  const text = r.choices?.[0]?.message?.content?.trim() || '';
  return NextResponse.json({ text });
}
