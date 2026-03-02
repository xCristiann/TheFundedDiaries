import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: uerr } = await supabase.auth.getUser();
    if (uerr) return NextResponse.json({ ok: false, error: uerr.message }, { status: 401 });
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { account_id } = body;
    if (!account_id) return NextResponse.json({ ok: false, error: "missing account_id" }, { status: 400 });

    const { data: acc, error: aerr } = await supabase
      .from("trading_accounts")
      .select("id, user_id, balance")
      .eq("id", account_id)
      .single();

    if (aerr || !acc) return NextResponse.json({ ok: false, error: aerr?.message || "account not found" }, { status: 404 });
    if (acc.user_id !== user.id) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    const { data: positions, error: perr } = await supabase
      .from("positions")
      .select("*")
      .eq("account_id", account_id);

    if (perr) return NextResponse.json({ ok: false, error: "positions select: " + perr.message }, { status: 400 });

    const list = positions || [];
    if (list.length === 0) return NextResponse.json({ ok: true, closed: 0, pnl: 0 });

    let balance = Number(acc.balance ?? 0);
    let totalPnl = 0;

    const tradesToInsert = list.map((p) => {
      const exit = Number(p.current_price ?? p.entry_price ?? 0);
      const pnl = Number(p.unrealized_pnl ?? 0);

      totalPnl += pnl;
      balance += pnl;

      return {
        account_id,
        symbol: p.symbol,
        type: p.side,
        lot_size: p.lot_size,
        entry_price: p.entry_price,
        exit_price: exit,
        pnl,
      };
    });

    // 1) INSERT trades
    const { error: terr } = await supabase.from("trades").insert(tradesToInsert);
    if (terr) return NextResponse.json({ ok: false, error: "trades insert: " + terr.message }, { status: 400 });

    // 2) DELETE positions (do it in chunks to avoid query limits)
    const ids = list.map((p) => p.id).filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ ok: false, error: "no position ids found" }, { status: 400 });

    const chunkSize = 100;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const { error: derr } = await supabase.from("positions").delete().in("id", chunk);
      if (derr) return NextResponse.json({ ok: false, error: "positions delete: " + derr.message }, { status: 400 });
    }

    // 3) UPDATE account
    const equity = Number(balance.toFixed(2));
    const { error: uerr2 } = await supabase
      .from("trading_accounts")
      .update({ balance, equity })
      .eq("id", account_id);

    if (uerr2) return NextResponse.json({ ok: false, error: "account update: " + uerr2.message }, { status: 400 });

    return NextResponse.json({
      ok: true,
      closed: list.length,
      pnl: Number(totalPnl.toFixed(2)),
      balance,
      equity,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "internal: " + String(e?.message || e) }, { status: 500 });
  }
}
