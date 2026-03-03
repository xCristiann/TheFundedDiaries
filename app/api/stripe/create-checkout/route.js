import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getChallengeById(challengeId) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase admin env (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
  }

  const res = await fetch(`${url}/rest/v1/challenges?id=eq.${challengeId}&select=*`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  const arr = await res.json().catch(() => []);
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const challengeId = body.challengeId || body.challenge_id || body.challenge;
    const originUrl = body.originUrl || body.origin_url;

    if (!challengeId || !originUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const price = Number(challenge.price || 0);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Invalid challenge price" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: `TFD Challenge — ${challenge.type} — ${challenge.balance}`,
            },
          },
        },
      ],
      success_url: `${originUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${originUrl}/checkout?challengeId=${challengeId}`,
      metadata: {
        challenge_id: String(challengeId),
        platform: body.platform ? String(body.platform) : "tfd-terminal",
        user_id: body.userId ? String(body.userId) : "",
        email: body.email ? String(body.email) : "",
        coupon: body.couponCode ? String(body.couponCode) : "",
      },
      customer_email: body.email || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("create-checkout error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
