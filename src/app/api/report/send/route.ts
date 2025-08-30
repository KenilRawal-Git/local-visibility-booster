// src/app/api/report/send/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const resend = new Resend(process.env.RESEND_API_KEY);

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
// If you don't have the "@/..." alias set in tsconfig, switch to '../../../lib/report'
import { renderMonthlyReportHTML } from '../../../lib/report';

export async function POST(req: NextRequest) {
  try {
    const env = {
      FROM_EMAIL: process.env.FROM_EMAIL,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
    };

    // Parse body safely
    const body = await req.json().catch(() => ({} as any));
    const { toEmail, businessName, monthLabel, highlights, keywords } = body || {};

    // Validate environment
    if (!env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY missing (set in .env.local and restart dev server)' },
        { status: 500 }
      );
    }
    if (!env.FROM_EMAIL) {
      return NextResponse.json(
        { error: 'FROM_EMAIL missing (e.g., onboarding@resend.dev or your verified domain)' },
        { status: 500 }
      );
    }

    // Validate inputs
    if (!toEmail || !businessName || !monthLabel) {
      return NextResponse.json(
        { error: 'toEmail, businessName, and monthLabel are required' },
        { status: 400 }
      );
    }

    // Build HTML
    const html = renderMonthlyReportHTML({
      businessName,
      monthLabel,
      highlights: Array.isArray(highlights) ? highlights : [],
      keywords: Array.isArray(keywords) ? keywords : [],
    });

    // Send
    const resend = new Resend(env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: env.FROM_EMAIL!,
      to: toEmail,
      subject: `${businessName} — Local Visibility Report (${monthLabel})`,
      html,
    });

    // If Resend returned an error object, surface it
    if ((result as any)?.error) {
      const msg =
        (result as any).error?.message ||
        (result as any).error ||
        'Resend returned an unspecified error';
      return NextResponse.json({ error: `Resend error: ${msg}` }, { status: 500 });
    }

    // Success
    return NextResponse.json({
      ok: true,
      id: (result as any)?.id || null,
    });
  } catch (err: any) {
    // Log full error on server for debugging
    console.error('report/send error:', err);
    // Return safe message to client
    return NextResponse.json(
      { error: err?.message || 'Unknown server error in /api/report/send' },
      { status: 500 }
    );
  }
}
