"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/glass-card";

export default function PositionsTable({ positions, onClosed, accountId }) {
  const [busyId, setBusyId] = useState("");
  const [busyAll, setBusyAll] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // local editable sl/tp per position
  const [draft, setDraft] = useState({}); // { [id]: { sl, tp } }

  const rows = useMemo(() => positions || [], [positions]);

  function getDraft(id, key, fallback) {
    const v = draft?.[id]?.[key];
    return (v === undefined) ? (fallback ?? "") : v;
  }

  function setDraftField(id, key, value) {
    setDraft((d) => ({
      ...d,
      [id]: { ...(d[id] || {}), [key]: value },
    }));
  }

  async function closePosition(positionId) {
    setErr("");
    setMsg("");
    setBusyId(positionId);

    try {
      const r = await fetch("/api/trading/close", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ position_id: positionId }),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j.ok) {
        setErr(j?.error || `close failed (${r.status})`);
        return;
      }

      if (typeof onClosed === "function") await onClosed();
      setMsg("Position closed.");
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setBusyId("");
    }
  }

  async function saveSLTP(positionId) {
    setErr("");
    setMsg("");
    setBusyId(positionId);

    try {
      const sl = getDraft(positionId, "sl", "");
      const tp = getDraft(positionId, "tp", "");

      const r = await fetch("/api/trading/modify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ position_id: positionId, sl, tp }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setErr(j?.error || `modify failed (${r.status})`);
        return;
      }

      if (typeof onClosed === "function") await onClosed();
      setMsg("SL/TP updated.");
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setBusyId("");
    }
  }

  async function closeAll() {
    setErr("");
    setMsg("");

    if (!accountId) {
      setErr("Missing accountId (active account).");
      return;
    }

    setBusyAll(true);
    try {
      const r = await fetch("/api/trading/close-all", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ account_id: accountId }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setErr(j?.error || `close-all failed (${r.status})`);
        return;
      }

      if (typeof onClosed === "function") await onClosed();
      setMsg(`Closed ${j.closed} position(s). PnL: ${j.pnl}`);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setBusyAll(false);
    }
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-lg font-semibold">Open positions</div>
          <div className="text-xs text-gray-500">PnL live (sim)</div>
        </div>

        <button
          onClick={closeAll}
          disabled={busyAll || rows.length === 0}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10 disabled:opacity-50"
          title="Close all open positions for the active account"
        >
          {busyAll ? "Closing all..." : "Close all"}
        </button>
      </div>

      {err ? (
        <div className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {err}
        </div>
      ) : null}

      {msg ? (
        <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {msg}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-2 pr-3">Symbol</th>
              <th className="py-2 pr-3">Side</th>
              <th className="py-2 pr-3">Lot</th>
              <th className="py-2 pr-3">Entry</th>
              <th className="py-2 pr-3">Now</th>
              <th className="py-2 pr-3">uPnL</th>
              <th className="py-2 pr-3">SL</th>
              <th className="py-2 pr-3">TP</th>
              <th className="py-2 pr-0 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="text-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 text-gray-500" colSpan={9}>
                  No open positions
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const upnl = Number(p.unrealized_pnl ?? 0);
                const upnlCls = upnl >= 0 ? "text-emerald-300" : "text-rose-300";
                const isBusy = busyId === p.id;

                const slVal = getDraft(p.id, "sl", p.sl ?? "");
                const tpVal = getDraft(p.id, "tp", p.tp ?? "");

                return (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="py-2 pr-3">{p.symbol}</td>
                    <td className="py-2 pr-3">{p.side}</td>
                    <td className="py-2 pr-3">{p.lot_size}</td>
                    <td className="py-2 pr-3 tabular-nums">{Number(p.entry_price ?? 0).toFixed(2)}</td>
                    <td className="py-2 pr-3 tabular-nums">{Number(p.current_price ?? 0).toFixed(2)}</td>
                    <td className={`py-2 pr-3 tabular-nums ${upnlCls}`}>{upnl.toFixed(2)}</td>

                    <td className="py-2 pr-3">
                      <input
                        value={slVal}
                        onChange={(e) => setDraftField(p.id, "sl", e.target.value)}
                        placeholder="-"
                        className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-gray-500"
                      />
                    </td>

                    <td className="py-2 pr-3">
                      <input
                        value={tpVal}
                        onChange={(e) => setDraftField(p.id, "tp", e.target.value)}
                        placeholder="-"
                        className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-gray-500"
                      />
                    </td>

                    <td className="py-2 pr-0 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => saveSLTP(p.id)}
                          disabled={isBusy}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-50"
                        >
                          {isBusy ? "Saving..." : "Save"}
                        </button>

                        <button
                          onClick={() => closePosition(p.id)}
                          disabled={isBusy}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-50"
                        >
                          {isBusy ? "Closing..." : "Close"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
