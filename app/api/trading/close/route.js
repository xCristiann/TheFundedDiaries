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
  return Number((base + wave + drift).toFixed(symbol === "EURUSD" ? 5 : 2));
}

// PnL simplu simulator (rafinezi după contract size)
function pnlFor(symbol, side, lot, entry, exit) {
  const dir = side === "buy" ? 1 : -1;
  const diff = (exit - entry) * dir;

  let mult = 1;
  if (symbol === "US30") mult = 1;           // $/point/lot
  else if (symbol === "XAUUSD") mult = 100;  // $ per 1.00 / lot (simplificat)
  else if (symbol === "EURUSD") mult = 100000; // notional (simplificat)

  return Number((diff * lot * mult).toFixed(2));
}

export async function POST(req) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { position_id } = body;
  if (!position_id) return NextResponse.json({ ok: false, error: "missing position_id" }, { status: 400 });

  const { data: pos, error: perr } = await supabase
    .from("positions")
    .select("*")
    .eq("id", position_id)
    .single();

  if (perr || !pos) return NextResponse.json({ ok: false, error: "position not found" }, { status: 404 });

  const { data: acc, error: aerr } = await supabase
    .from("trading_accounts")
    .select("id, user_id, balance, equity")
    .eq("id", pos.account_id)
    .single();

  if (aerr || !acc) return NextResponse.json({ ok: false, error: "account not found" }, { status: 404 });
  if (acc.user_id !== user.id) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const exit_price = mockPrice(pos.symbol);
  const pnl = pnlFor(pos.symbol, pos.side, Number(pos.lot_size), Number(pos.entry_price), exit_price);

  // insert into trades (istoric)
  const { error: terr } = await supabase.from("trades").insert([{
    account_id: pos.account_id,
    symbol: pos.symbol,
    type: pos.side, // la tine: trades.type
    lot_size: pos.lot_size,
    entry_price: pos.entry_price,
    exit_price,
    pnl
  }]);

  if (terr) return NextResponse.json({ ok: false, error: terr.message }, { status: 400 });

  // update trading_accounts
  const newBalance = Number(acc.balance ?? 0) + pnl;
  const newEquity = newBalance;

  const { error: uerr } = await supabase
    .from("trading_accounts")
    .update({ balance: newBalance, equity: newEquity })
    .eq("id", acc.id);

  if (uerr) return NextResponse.json({ ok: false, error: uerr.message }, { status: 400 });

  // delete position
  const { error: derr } = await supabase.from("positions").delete().eq("id", pos.id);
  if (derr) return NextResponse.json({ ok: false, error: derr.message }, { status: 400 });

  // log equity history
  await supabase.from("equity_history").insert([{ account_id: acc.id, balance: newBalance, equity: newEquity }]);

  return NextResponse.json({ ok: true, exit_price, pnl, balance: newBalance, equity: newEquity });
}
