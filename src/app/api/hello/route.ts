// src/app/api/hello/route.ts
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ ok: true, msg: 'hello route works' });
}
