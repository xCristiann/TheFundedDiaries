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
import { Wallet, BarChart3 } from "lucide-react";

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.06] flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#8b7306]" />
        </div>
        <div className="leading-tight">
          <div className="text-xs text-gray-400">{label}</div>
          <div className="text-lg font-semibold text-white tabular-nums">{value}</div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const ok = status === "active";
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
      <span className="text-xs text-gray-300">{status || "-"}</span>
    </div>
  );
}

export default function TerminalPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState("");
  const [positions, setPositions] = useState([]);
  const [symbol, setSymbol] = useState("US30");

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

  // ✅ TICK LOOP (silent): recalculates equity server-side, refresh UI
  useEffect(() => {
    if (!activeAccountId) return;

    let stop = false;

    async function tick() {
      if (stop) return;

      await fetch("/api/trading/tick", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ account_id: activeAccountId }),
      }).catch(() => {});

      await refreshAccounts(false);
      await refreshPositions(activeAccountId);
    }

    tick();
    const t = setInterval(tick, 1000);

    return () => {
      stop = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccountId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const bal = Number(activeAcc?.balance ?? 0).toFixed(2);
  const eq = Number(activeAcc?.equity ?? 0).toFixed(2);

  return (
    <TerminalLayout
      title="Trading Terminal"
      subtitle="Simulator (MT5-style) • Multi-accounts • Prop rules next"
      right={
        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <StatusDot status={activeAcc?.status} />
          </div>

          <div className="hidden md:flex items-center gap-3">
            <StatPill icon={Wallet} label="Balance" value={bal} />
            <StatPill icon={BarChart3} label="Equity" value={eq} />
          </div>

          <AccountSelector
            accounts={accounts}
            value={activeAccountId}
            onChange={async (id) => {
              setActiveAccountId(id);
              await refreshPositions(id);
            }}
          />
        </div>
      }
    >
      {/* Mobile stats */}
      <div className="md:hidden grid grid-cols-2 gap-3 mb-4">
        <StatPill icon={Wallet} label="Balance" value={bal} />
        <StatPill icon={BarChart3} label="Equity" value={eq} />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <Watchlist value={symbol} onChange={setSymbol} />
        </div>

        <div className="lg:col-span-6 space-y-6">
          <ChartCard symbol={symbol} />
          <PositionsTable
            positions={positions}
            accountId={activeAccountId}
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
              <StatusDot status={activeAcc?.status} />
            </div>

            <div className="text-sm text-gray-300 space-y-1">
              <div>Login: <span className="text-white">{activeAcc?.account_login ?? "-"}</span></div>
              <div>Balance: <span className="text-white tabular-nums">{bal}</span></div>
              <div>Equity: <span className="text-white tabular-nums">{eq}</span></div>
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

