import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = await createClient();

  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr) return NextResponse.json({ ok: false, error: uerr.message }, { status: 401 });
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const account_id = body.account_id;
  if (!account_id) return NextResponse.json({ ok: false, error: "missing account_id" }, { status: 400 });

  // load account + challenge
  const { data: acc, error: aerr } = await supabase
    .from("trading_accounts")
    .select("id, user_id, balance, equity, status, challenge_id, challenges(*)")
    .eq("id", account_id)
    .single();

  if (aerr || !acc) return NextResponse.json({ ok: false, error: aerr?.message || "account not found" }, { status: 404 });
  if (acc.user_id !== user.id) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const ch = acc.challenges;
  if (!ch) return NextResponse.json({ ok: false, error: "challenge missing on account" }, { status: 400 });

  const initial = Number(ch.balance ?? 0); // initial balance from challenge
  const equity = Number(acc.equity ?? acc.balance ?? 0);
  const balance = Number(acc.balance ?? 0);

  // profit to target
  const profitNow = equity - initial;
  const targetPct = Number(ch.profit_target ?? 0);
  const targetAmount = initial * (targetPct / 100);
  const remainingToTarget = Math.max(0, targetAmount - profitNow);

  // daily loss today (use UTC day boundary)
  const startUtc = new Date();
  startUtc.setUTCHours(0, 0, 0, 0);
  const startIso = startUtc.toISOString();

  const { data: tradesToday, error: terr } = await supabase
    .from("trades")
    .select("pnl, created_at")
    .eq("account_id", account_id)
    .gte("created_at", startIso);

  if (terr) return NextResponse.json({ ok: false, error: "trades query: " + terr.message }, { status: 400 });

  const pnlToday = (tradesToday || []).reduce((s, t) => s + Number(t.pnl ?? 0), 0);
  const dailyLoss = Math.max(0, -pnlToday); // only if negative total => loss

  const dailyPct = Number(ch.daily_drawdown ?? 0);
  const dailyLimit = initial * (dailyPct / 100);
  const remainingDaily = Math.max(0, dailyLimit - dailyLoss);

  // max drawdown remaining (simple: from initial)
  const maxPct = Number(ch.max_drawdown ?? 0);
  const maxLimit = initial * (maxPct / 100);
  const maxLoss = Math.max(0, initial - equity);
  const remainingMax = Math.max(0, maxLimit - maxLoss);

  return NextResponse.json({
    ok: true,
    account: {
      id: acc.id,
      status: acc.status,
      balance,
      equity,
      initial,
    },
    rules: {
      type: ch.type,
      profit_target_pct: targetPct,
      daily_drawdown_pct: dailyPct,
      max_drawdown_pct: maxPct,
      target_amount: Number(targetAmount.toFixed(2)),
      daily_limit: Number(dailyLimit.toFixed(2)),
      max_limit: Number(maxLimit.toFixed(2)),
    },
    metrics: {
      profit_now: Number(profitNow.toFixed(2)),
      remaining_to_target: Number(remainingToTarget.toFixed(2)),
      pnl_today: Number(pnlToday.toFixed(2)),
      daily_loss: Number(dailyLoss.toFixed(2)),
      remaining_daily: Number(remainingDaily.toFixed(2)),
      max_loss: Number(maxLoss.toFixed(2)),
      remaining_max: Number(remainingMax.toFixed(2)),
    },
  });
}
