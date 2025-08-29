import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  const key = process.env.RESEND_API_KEY || '';
  return NextResponse.json({
    hasResendKey: Boolean(key),
    keyPrefix: key ? key.slice(0, 3) : null, // shows 're_' if set, but not the whole key
    fromEmail: process.env.FROM_EMAIL || null,
  });
}
