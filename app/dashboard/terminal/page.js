"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import GlassCard from "@/components/glass-card";
import TerminalLayout from "@/components/terminal/TerminalLayout";
import AccountSelector from "@/components/terminal/AccountSelector";
import Watchlist from "@/components/terminal/Watchlist";
import ChartCard from "@/components/terminal/ChartCard";
import OrderPanel from "@/components/terminal/OrderPanel";
import PositionsTable from "@/components/terminal/PositionsTable";

function Badge({ children, tone = "neutral" }) {
  const cls =
    tone === "ok"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : tone === "warn"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
      : tone === "bad"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
      : "border-white/10 bg-white/5 text-gray-200";
  return <span className={`text-xs rounded-full border px-2 py-1 ${cls}`}>{children}</span>;
}

export default function DashboardTerminalPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState("");
  const [positions, setPositions] = useState([]);
  const [symbol, setSymbol] = useState("US30");

  const [tickOk, setTickOk] = useState(true);
  const [tickMsg, setTickMsg] = useState("");

  const activeAcc = useMemo(
    () => accounts.find((a) => a.id === activeAccountId),
    [accounts, activeAccountId]
  );

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      await refreshAccounts(true);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAccounts(first = false) {
    const r = await fetch("/api/trading/accounts");
    const j = await r.json().catch(() => ({}));
    if (!j.ok) return;

    setAccounts(j.accounts || []);

    if (first) {
      let saved = "";
      try { saved = localStorage.getItem("activeAccountId") || ""; } catch {}

      const next =
        saved && (j.accounts || []).some((a) => a.id === saved)
          ? saved
          : (j.accounts?.[0]?.id || "");

      setActiveAccountId(next);
      if (next) await refreshPositions(next);
    }
  }

  async function refreshPositions(accountId = activeAccountId) {
    if (!accountId) return setPositions([]);

    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("account_id", accountId)
      .order("opened_at", { ascending: false });

    if (!error) setPositions(data || []);
  }

  // ✅ TICK LOOP: update equity server-side + refresh UI
  useEffect(() => {
    if (!activeAccountId) return;

    let stop = false;

    async function tick() {
      if (stop) return;

      try {
        const r = await fetch("/api/trading/tick", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ account_id: activeAccountId }),
        });

        const j = await r.json().catch(() => ({}));

        if (!r.ok || !j.ok) {
          setTickOk(false);
          setTickMsg(j?.error || `tick error ${r.status}`);
        } else {
          setTickOk(true);
          setTickMsg("");
        }

        await refreshAccounts(false);
        await refreshPositions(activeAccountId);
      } catch (e) {
        setTickOk(false);
        setTickMsg(String(e?.message || e));
      }
    }

    tick();
    const t = setInterval(tick, 1000);

    return () => {
      stop = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccountId]);

  const statusTone = (activeAcc?.status === "active") ? "ok" : "warn";

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <TerminalLayout
      title="Trading Terminal"
      subtitle="Simulator (MT5-style) • Multi-accounts • Prop rules next"
      right={
        <>
          {activeAcc && (
            <div className="hidden md:flex items-center gap-2">
              <Badge tone={statusTone}>{activeAcc.status}</Badge>
              <Badge>Bal: {Number(activeAcc.balance ?? 0).toFixed(2)}</Badge>
              <Badge>Eq: {Number(activeAcc.equity ?? 0).toFixed(2)}</Badge>
              <Badge tone={tickOk ? "ok" : "bad"}>{tickOk ? "Tick: ok" : "Tick: error"}</Badge>
            </div>
          )}
          <AccountSelector
            accounts={accounts}
            value={activeAccountId}
            onChange={async (id) => {
              setActiveAccountId(id);
              await refreshPositions(id);
            }}
          />
        </>
      }
    >
      {!tickOk && tickMsg && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          {tickMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <Watchlist value={symbol} onChange={setSymbol} />
        </div>

        <div className="lg:col-span-6 space-y-6">
          <ChartCard symbol={symbol} />
          <PositionsTable
            positions={positions}
            onClosed={async () => {
              await refreshAccounts(false);
              await refreshPositions(activeAccountId);
            }}
          />
        </div>

        <div className="lg:col-span-3 space-y-6">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Account</div>
              <Badge tone={statusTone}>{activeAcc?.status ?? "-"}</Badge>
            </div>

            <div className="text-sm text-gray-300 space-y-1">
              <div>Login: <span className="text-white">{activeAcc?.account_login ?? "-"}</span></div>
              <div>Balance: <span className="text-white">{Number(activeAcc?.balance ?? 0).toFixed(2)}</span></div>
              <div>Equity: <span className="text-white">{Number(activeAcc?.equity ?? 0).toFixed(2)}</span></div>
              <div className="pt-2 text-xs text-gray-500">
                Account ID: {activeAcc?.id ?? "-"}
              </div>
            </div>
          </GlassCard>

          <OrderPanel
            accountId={activeAccountId}
            onOpened={async () => {
              await refreshPositions(activeAccountId);
            }}
          />
        </div>
      </div>
    </TerminalLayout>
  );
}
