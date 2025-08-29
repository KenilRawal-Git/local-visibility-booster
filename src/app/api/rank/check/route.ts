export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { keyword, businessName, location } = await req.json();
    if (!process.env.SERPAPI_KEY) {
      return NextResponse.json({ error: 'SERPAPI_KEY missing' }, { status: 500 });
    }
    if (!keyword || !businessName || !location) {
      return NextResponse.json({ error: 'keyword, businessName, location required' }, { status: 400 });
    }

    const params = new URLSearchParams({
      engine: 'google',
      q: keyword,
      gl: 'uk',                // adjust if not UK
      hl: 'en',
      location,
      num: '10'
    });

    const r = await fetch(`https://serpapi.com/search.json?${params.toString()}&api_key=${process.env.SERPAPI_KEY}`);
    const data = await r.json();

    // Try local pack first, then organic/maps
    const pack = data.local_results || data.local_pack || [];
    const organic = data.organic_results || [];
    let position: number | null = null;

    const hitPack = pack.findIndex((p: any) =>
      (p.title || '').toLowerCase().includes(businessName.toLowerCase())
    );
    if (hitPack !== -1) position = hitPack + 1;

    if (position === null) {
      const hitOrganic = organic.findIndex((o: any) =>
        (o.title || '').toLowerCase().includes(businessName.toLowerCase()) ||
        (o.link || '').toLowerCase().includes((businessName.split(' ')[0] || '').toLowerCase())
      );
      if (hitOrganic !== -1) position = hitOrganic + 1;
    }

    return NextResponse.json({
      position,
      topLocal: pack.slice(0, 3).map((p: any, i: number) => ({
        pos: i + 1, title: p.title, rating: p.rating, reviews: p.reviews, link: p.link
      }))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'rank check failed' }, { status: 500 });
  }
}
