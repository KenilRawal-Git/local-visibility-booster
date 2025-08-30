// src/app/api/report/test/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Resend } from 'resend';


export async function GET() {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 });
    }
  const resend = new Resend(process.env.RESEND_API_KEY);

   // change the recipient to your inbox
const result = await resend.emails.send({
  from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
  to: 'kenilrawal47@gmail.com', // ← put your real email here
  subject: 'LVB test — plain text',
  text: 'If you see this, Resend is working end-to-end.',
});


    if ((result as any)?.error) {
      return NextResponse.json({ error: (result as any).error?.message || 'send failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: (result as any)?.id || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 });
  }
}
