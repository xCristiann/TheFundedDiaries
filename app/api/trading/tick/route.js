import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function mockPrice(symbol) {
  const t = Math.floor(Date.now() / 1000);
  const base =
    symbol === "US30" ? 49000 :
    symbol === "XAUUSD" ? 2050 :
    symbol === "EURUSD" ? 1.08 :
    100;

  const wave = Math.sin(t / 7) * (symbol === "EURUSD" ? 0.001 : 25);
  const drift = Math.sin(t / 31) * (symbol === "EURUSD" ? 0.0005 : 10);
  const decimals = symbol === "EURUSD" ? 5 : 2;
  return Number((base + wave + drift).toFixed(decimals));
}

function pnlFor(symbol, side, lot, entry, now) {
  const dir = side === "buy" ? 1 : -1;
  const diff = (now - entry) * dir;

  let mult = 1;
  if (symbol === "US30") mult = 1;
  else if (symbol === "XAUUSD") mult = 100;
  else if (symbol === "EURUSD") mult = 100000;

  return Number((diff * lot * mult).toFixed(2));
}

function hitSLTP(pos, price) {
  const sl = pos.sl === null || typeof pos.sl === "undefined" ? null : Number(pos.sl);
  const tp = pos.tp === null || typeof pos.tp === "undefined" ? null : Number(pos.tp);
  const side = pos.side;

  if (side === "buy") {
    if (sl !== null && price <= sl) return { hit: true, reason: "sl" };
    if (tp !== null && price >= tp) return { hit: true, reason: "tp" };
  } else {
    if (sl !== null && price >= sl) return { hit: true, reason: "sl" };
    if (tp !== null && price <= tp) return { hit: true, reason: "tp" };
  }
  return { hit: false, reason: null };
}

export async function POST(req) {
  const supabase = await createClient();

  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr) return NextResponse.json({ ok: false, error: uerr.message }, { status: 401 });
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { account_id } = body;
  if (!account_id) return NextResponse.json({ ok: false, error: "missing account_id" }, { status: 400 });

  const { data: acc, error: aerr } = await supabase
    .from("trading_accounts")
    .select("id, user_id, balance, equity")
    .eq("id", account_id)
    .single();

  if (aerr || !acc) return NextResponse.json({ ok: false, error: aerr?.message || "account not found" }, { status: 404 });
  if (acc.user_id !== user.id) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { data: positions, error: perr } = await supabase
    .from("positions")
    .select("*")
    .eq("account_id", account_id)
    .order("opened_at", { ascending: false });

  if (perr) return NextResponse.json({ ok: false, error: perr.message }, { status: 400 });

  let balance = Number(acc.balance ?? 0);
  let unrealSum = 0;
  let closedCount = 0;

  for (const p of (positions || [])) {
    const price = mockPrice(p.symbol);
    const upnl = pnlFor(p.symbol, p.side, Number(p.lot_size), Number(p.entry_price), price);

    const { error: uposErr } = await supabase
      .from("positions")
      .update({ current_price: price, unrealized_pnl: upnl })
      .eq("id", p.id);

    if (uposErr) return NextResponse.json({ ok: false, error: "positions update: " + uposErr.message }, { status: 400 });

    const hit = hitSLTP(p, price);
    if (hit.hit) {
      const pnl = upnl;

      const { error: terr } = await supabase.from("trades").insert([{
        account_id,
        symbol: p.symbol,
        type: p.side,
        lot_size: p.lot_size,
        entry_price: p.entry_price,
        exit_price: price,
        pnl
      }]);

      if (terr) return NextResponse.json({ ok: false, error: "trades insert: " + terr.message }, { status: 400 });

      balance = balance + pnl;

      const { error: derr } = await supabase.from("positions").delete().eq("id", p.id);
      if (derr) return NextResponse.json({ ok: false, error: "positions delete: " + derr.message }, { status: 400 });

      closedCount += 1;
      continue;
    }

    unrealSum += upnl;
  }

  const equity = Number((balance + unrealSum).toFixed(2));

  const { error: uerr2 } = await supabase
    .from("trading_accounts")
    .update({ balance, equity })
    .eq("id", account_id);

  if (uerr2) return NextResponse.json({ ok: false, error: "account update: " + uerr2.message }, { status: 400 });

  // ✅ insert into equity_history (best-effort; don't break tick)
  let equityHistoryOk = true;
  let equityHistoryError = "";
  const { error: ehErr } = await supabase
    .from("equity_history")
    .insert([{ account_id, balance, equity }]);

  if (ehErr) {
    equityHistoryOk = false;
    equityHistoryError = ehErr.message;
  }

  return NextResponse.json({
    ok: true,
    balance,
    equity,
    unrealSum,
    positionsCount: (positions || []).length,
    closedCount,
    equityHistoryOk,
    equityHistoryError
  });
}
