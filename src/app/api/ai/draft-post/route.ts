// src/app/api/ai/draft-post/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { business, topic } = body as { business?: string; topic?: string };

    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    if (!business || !topic) return NextResponse.json({ error: 'Missing "business" or "topic"' }, { status: 400 });

    const prompt = `Write a 90-120 word Google Business Profile post for "${business}". Topic: ${topic}. Tone: friendly and local. Include a light call-to-action.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      return NextResponse.json({ error: `OpenAI ${r.status}: ${errText || r.statusText}` }, { status: 500 });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || '';
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown server error' }, { status: 500 });
  }
}
