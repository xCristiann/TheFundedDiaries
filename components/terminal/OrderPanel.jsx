"use client";
import { useState } from "react";

export default function OrderPanel({ accountId, onOpened }) {
  const [symbol, setSymbol] = useState("US30");
  const [side, setSide] = useState("buy");
  const [lot, setLot] = useState(1);
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function open() {
    if (!accountId) return setMsg("Selectează un account.");
    setBusy(true); setMsg("");

    const r = await fetch("/api/trading/open", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        account_id: accountId,
        symbol,
        side,
        lot_size: Number(lot),
        sl: sl === "" ? null : Number(sl),
        tp: tp === "" ? null : Number(tp),
      }),
    });

    const j = await r.json().catch(() => ({}));
    setBusy(false);

    if (!j.ok) return setMsg(j.error || `error ${r.status}`);
    setMsg(`Opened @ ${j.price}`);
    onOpened?.();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-lg font-semibold mb-3">New order (Market)</div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-gray-300">
          Symbol
          <select
            className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            <option>US30</option>
            <option>XAUUSD</option>
            <option>EURUSD</option>
          </select>
        </label>

        <label className="text-sm text-gray-300">
          Side
          <select
            className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
            value={side}
            onChange={(e) => setSide(e.target.value)}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>

        <label className="text-sm text-gray-300">
          Lot
          <input
            className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
            type="number"
            step="0.01"
            value={lot}
            onChange={(e) => setLot(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-300">
            SL
            <input
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              placeholder="optional"
            />
          </label>

          <label className="text-sm text-gray-300">
            TP
            <input
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              placeholder="optional"
            />
          </label>
        </div>
      </div>

      <button
        onClick={open}
        disabled={busy}
        className="mt-4 w-full rounded-2xl bg-[#8b7306] text-black font-semibold py-2 hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Opening..." : "Open position"}
      </button>

      {msg && <div className="mt-3 text-sm text-gray-300">{msg}</div>}
    </div>
  );
}
