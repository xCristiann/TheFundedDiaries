import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// preț “mock” determinist (simulator)
function mockPrice(symbol) {
  const t = Math.floor(Date.now() / 1000);
  const base =
    symbol === "US30" ? 49000 :
    symbol === "XAUUSD" ? 2050 :
    symbol === "EURUSD" ? 1.08 :
    100;

  const wave = Math.sin(t / 7) * (symbol === "EURUSD" ? 0.001 : 25);
  const drift = Math.sin(t / 31) * (symbol === "EURUSD" ? 0.0005 : 10);
  return Number((base + wave + drift).toFixed(symbol === "EURUSD" ? 5 : 2));
}

export async function POST(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { account_id, symbol, side, lot_size, sl, tp } = body;

  if (!account_id || !symbol || !["buy", "sell"].includes(side) || !lot_size) {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }

  // verify account belongs to user
  const { data: acc, error: aerr } = await supabase
    .from("trading_accounts")
    .select("id, user_id, balance, equity")
    .eq("id", account_id)
    .single();

  if (aerr || !acc) return NextResponse.json({ ok: false, error: "account not found" }, { status: 404 });
  if (acc.user_id !== user.id) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const entry_price = mockPrice(symbol);

  const { data: pos, error: perr } = await supabase
    .from("positions")
    .insert([{
      account_id,
      symbol,
      side,
      lot_size: Number(lot_size),
      entry_price,
      sl: sl ?? null,
      tp: tp ?? null,
      current_price: entry_price,
      unrealized_pnl: 0,
      status: "open",
    }])
    .select("*")
    .single();

  if (perr) return NextResponse.json({ ok: false, error: perr.message }, { status: 400 });

  // log equity snapshot (optional)
  await supabase.from("equity_history").insert([{
    account_id,
    balance: acc.balance ?? 0,
    equity: acc.equity ?? acc.balance ?? 0
  }]);

  return NextResponse.json({ ok: true, position: pos, price: entry_price });
}
