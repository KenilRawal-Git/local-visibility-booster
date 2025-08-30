// src/app/api/report/batch/route.ts
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderMonthlyReportHTML } from '../../../lib/report';
import { batchClients } from '../../../../lib/clients.server';

// --- core batch worker (shared by GET/POST) ---
async function runBatch() {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  if (!resendKey) return { ok: false, error: 'RESEND_API_KEY missing' };
  if (!from) return { ok: false, error: 'FROM_EMAIL missing' };

  const resend = new Resend(resendKey);
  const monthLabel = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  const results: Array<{ name: string; email: string; id?: string | null; error?: string }> = [];

  for (const c of batchClients) {
    try {
      const html = renderMonthlyReportHTML({
        businessName: c.name,
        monthLabel,
        highlights: c.highlights || [],
        keywords: c.keywords || [],
      });

      const r = await resend.emails.send({
        from,
        to: c.email,
        subject: `${c.name} — Local Visibility Report (${monthLabel})`,
        html,
      });

      if ((r as any)?.error) {
        const msg =
          (r as any).error?.message || (r as any).error || 'Resend returned an unspecified error';
        results.push({ name: c.name, email: c.email, error: msg });
      } else {
        results.push({ name: c.name, email: c.email, id: (r as any)?.id || null });
      }
    } catch (e: any) {
      results.push({ name: c.name, email: c.email, error: e?.message || String(e) });
    }
  }

  return { ok: true, sent: results };
}

// --- manual trigger (e.g., curl/postman) ---
export async function POST() {
  try {
    const result = await runBatch();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'batch failed' }, { status: 500 });
  }
}

// --- vercel cron trigger (GET + ?key=CRON_SECRET) ---
export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not set' }, { status: 500 });
    }

    const url = new URL(req.url);
    const key = url.searchParams.get('key');

    if (key !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runBatch();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'batch failed' }, { status: 500 });
  }
}
