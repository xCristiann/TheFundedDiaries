"use client";
import { useEffect, useState } from "react";

export default function AccountSelector({ accounts, value, onChange }) {
  const [local, setLocal] = useState(value || "");

  useEffect(() => setLocal(value || ""), [value]);

  if (!accounts?.length) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400">Account</span>
      <select
        className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
        value={local}
        onChange={(e) => {
          const v = e.target.value;
          setLocal(v);
          onChange?.(v);
          try { localStorage.setItem("activeAccountId", v); } catch {}
        }}
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {(a.account_login ?? a.id.slice(0, 8))} • {a.status} • {Number(a.balance ?? 0).toFixed(2)}
          </option>
        ))}
      </select>
    </div>
  );
}
