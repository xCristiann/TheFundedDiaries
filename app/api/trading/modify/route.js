import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = await createClient();

  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr) return NextResponse.json({ ok: false, error: uerr.message }, { status: 401 });
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { position_id, sl, tp } = body;

  if (!position_id) {
    return NextResponse.json({ ok: false, error: "missing position_id" }, { status: 400 });
  }

  // load position
  const { data: pos, error: perr } = await supabase
    .from("positions")
    .select("id, account_id")
    .eq("id", position_id)
    .single();

  if (perr || !pos) {
    return NextResponse.json({ ok: false, error: perr?.message || "position not found" }, { status: 404 });
  }

  // verify owner
  const { data: acc, error: aerr } = await supabase
    .from("trading_accounts")
    .select("id, user_id")
    .eq("id", pos.account_id)
    .single();

  if (aerr || !acc) return NextResponse.json({ ok: false, error: aerr?.message || "account not found" }, { status: 404 });
  if (acc.user_id !== user.id) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const nextSl = (sl === "" || sl === null || typeof sl === "undefined") ? null : Number(sl);
  const nextTp = (tp === "" || tp === null || typeof tp === "undefined") ? null : Number(tp);

  if (nextSl !== null && Number.isNaN(nextSl)) return NextResponse.json({ ok: false, error: "invalid sl" }, { status: 400 });
  if (nextTp !== null && Number.isNaN(nextTp)) return NextResponse.json({ ok: false, error: "invalid tp" }, { status: 400 });

  const { error: uperr } = await supabase
    .from("positions")
    .update({ sl: nextSl, tp: nextTp })
    .eq("id", position_id);

  if (uperr) return NextResponse.json({ ok: false, error: uperr.message }, { status: 400 });

  return NextResponse.json({ ok: true, sl: nextSl, tp: nextTp });
}
