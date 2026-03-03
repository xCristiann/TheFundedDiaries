import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fetchChallenge(challengeId) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || // <-- MUST be legacy service_role JWT (eyJ...)
    process.env.SUPABASE_SERVICE_ROLE_JWT || // optional alias if you used different name
    "";

  if (!url) throw new Error("ENV missing: NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("ENV missing: SUPABASE_SERVICE_ROLE_KEY (legacy service_role JWT)");

  const endpoint = `${url}/rest/v1/challenges?id=eq.${challengeId}&select=*`;

  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

  const text = await res.text(); // keep raw for debugging
  if (!res.ok) {
    // return full detail so you see REAL reason (401/403/404 etc.)
    return { ok: false, status: res.status, body: text, endpoint };
  }

  let json = [];
  try { json = JSON.parse(text); } catch {}
  const row = Array.isArray(json) && json.length ? json[0] : null;
  return { ok: true, row, endpoint };
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const challengeId = body.challengeId || body.challenge_id || body.challenge;
    const originUrl = body.originUrl || body.origin_url;

    if (!challengeId || !originUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const q = await fetchChallenge(challengeId);
    if (!q.ok) {
      return NextResponse.json(
        {
          error: "Supabase fetch failed",
          supabase_status: q.status,
          supabase_body: q.body?.slice(0, 800),
          endpoint: q.endpoint,
          hint:
            "Check Vercel env vars: NEXT_PUBLIC_SUPABASE_URL must be same project as your challenges; SUPABASE_SERVICE_ROLE_KEY must be legacy service_role JWT (eyJ...).",
        },
        { status: 500 }
      );
    }

    const challenge = q.row;
    if (!challenge) {
      return NextResponse.json(
        {
          error: "Challenge not found in DB",
          endpoint: q.endpoint,
          hint: "This challengeId does not exist in the Supabase project your Vercel env points to.",
        },
        { status: 404 }
      );
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
    return NextResponse.json({ error: String(e?.message || e || "Internal error") }, { status: 500 });
  }
}
