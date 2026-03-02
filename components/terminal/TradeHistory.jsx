"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TradeHistory({ accountId, open, onClose }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState([]);
  const [opened, setOpened] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    if (!accountId) return;
    (async () => {
      setLoading(true); setErr("");
      const p = await supabase
        .from("positions")
        .select("*")
        .eq("account_id", accountId)
        .order("opened_at", { ascending: false });

      const t = await supabase
        .from("trades")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (p.error) setErr(p.error.message);
      if (t.error) setErr(t.error.message);

      setOpened(p.data || []);
      setClosed(t.data || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accountId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#071022] shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <div className="text-lg font-semibold">History</div>
            <div className="text-xs text-gray-400">Account: {accountId}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 px-3 py-2 hover:bg-white/5"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-6">
          {err && <div className="text-sm text-rose-300">{err}</div>}
          {loading ? (
            <div className="text-gray-300">Loading...</div>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold mb-3">Open positions</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400">
                      <tr className="text-left">
                        <th className="py-2">Symbol</th>
                        <th>Side</th>
                        <th>Lot</th>
                        <th>Entry</th>
                        <th>SL</th>
                        <th>TP</th>
                        <th>Opened</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opened.length ? opened.map((x) => (
                        <tr key={x.id} className="border-t border-white/10">
                          <td className="py-2">{x.symbol}</td>
                          <td>{x.side}</td>
                          <td>{x.lot_size}</td>
                          <td>{x.entry_price}</td>
                          <td>{x.sl ?? "-"}</td>
                          <td>{x.tp ?? "-"}</td>
                          <td className="text-gray-400">{new Date(x.opened_at).toLocaleString()}</td>
                        </tr>
                      )) : (
                        <tr><td className="py-3 text-gray-400" colSpan={7}>No open positions</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold mb-3">Closed trades</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400">
                      <tr className="text-left">
                        <th className="py-2">Symbol</th>
                        <th>Type</th>
                        <th>Lot</th>
                        <th>Entry</th>
                        <th>Exit</th>
                        <th>PnL</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closed.length ? closed.map((x) => (
                        <tr key={x.id} className="border-t border-white/10">
                          <td className="py-2">{x.symbol}</td>
                          <td>{x.type}</td>
                          <td>{x.lot_size}</td>
                          <td>{x.entry_price}</td>
                          <td>{x.exit_price ?? "-"}</td>
                          <td className={Number(x.pnl) >= 0 ? "text-emerald-300" : "text-rose-300"}>
                            {Number(x.pnl ?? 0).toFixed(2)}
                          </td>
                          <td className="text-gray-400">{new Date(x.created_at).toLocaleString()}</td>
                        </tr>
                      )) : (
                        <tr><td className="py-3 text-gray-400" colSpan={7}>No closed trades</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
