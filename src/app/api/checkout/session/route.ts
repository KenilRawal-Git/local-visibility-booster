export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { tier } = await req.json(); // 'STARTER' | 'GROWTH' | 'PRO'
    const priceMap: Record<string, string | undefined> = {
      STARTER: process.env.STRIPE_PRICE_STARTER,
      GROWTH: process.env.STRIPE_PRICE_GROWTH,
      PRO: process.env.STRIPE_PRICE_PRO
    };
    const price = priceMap[tier];
    if (!price) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/pricing/success?tier=${tier}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto'
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'stripe error' }, { status: 500 });
  }
}
