// app/api/stripe/create-checkout/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();

    // acceptă și camelCase (frontend) și snake_case (backend)
    const challenge_id = body.challenge_id ?? body.challengeId;
    const origin_url =
      body.origin_url ??
      body.originUrl ??
      `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}`;

    const user_id = body.user_id ?? body.userId ?? null;
    const email = body.email ?? null;
    const coupon_code = body.coupon_code ?? body.couponCode ?? null;
    const discount_amount = body.discount_amount ?? body.discountAmount ?? 0;

    if (!challenge_id || !origin_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1) ia challenge din DB
    const { data: challenge, error: chErr } = await supabaseAdmin
      .from("challenges")
      .select("*")
      .eq("id", challenge_id)
      .single();

    if (chErr || !challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // 2) calculează prețul final (în cents)
    const basePrice = Number(challenge.price || 0);
    const discount = Number(discount_amount || 0);
    const finalPrice = Math.max(0, basePrice - discount);
    const unitAmount = Math.round(finalPrice * 100);

    // 3) creează order "pending" (dacă tabelul există)
    let orderId = null;
    try {
      const { data: order, error: orderErr } = await supabaseAdmin
        .from("orders")
        .insert([
          {
            user_id,
            challenge_id,
            platform: "tfd-trade",
            coupon_code,
            original_price: basePrice,
            discount_amount: discount,
            final_price: finalPrice,
            status: "pending",
            email,
          },
        ])
        .select("id")
        .single();

      if (!orderErr && order?.id) orderId = order.id;
    } catch (e) {
      // dacă nu există coloane/tabla nu e exact, nu blocăm checkout-ul
      console.warn("orders insert skipped:", e?.message || e);
    }

    // 4) creează checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `TheFundedDiaries Challenge (${challenge.type} - ${challenge.balance})`,
              description: `Profit target: ${challenge.profit_target}% | Daily DD: ${challenge.daily_drawdown}% | Max DD: ${challenge.max_drawdown}%`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin_url}/checkout/status?session_id={CHECKOUT_SESSION_ID}${
        orderId ? `&order_id=${orderId}` : ""
      }`,
      cancel_url: `${origin_url}/challenges?canceled=1`,
      metadata: {
        challenge_id: String(challenge_id),
        user_id: user_id ? String(user_id) : "",
        order_id: orderId ? String(orderId) : "",
      },
    });

    // 5) salvează session_id pe order (dacă există coloana)
    if (orderId) {
      try {
        await supabaseAdmin
          .from("orders")
          .update({ stripe_session_id: session.id })
          .eq("id", orderId);
      } catch (e) {
        console.warn("orders stripe_session_id update skipped:", e?.message || e);
      }
    }

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id, orderId });
  } catch (error) {
    console.error("create-checkout error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}