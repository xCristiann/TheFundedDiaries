"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function LoginClient() {
  const sp = useSearchParams();
  const mode = useMemo(() => sp.get("mode") || "login", [sp]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">{mode === "signup" ? "Create account" : "Login"}</h1>
        <p className="text-gray-400">Replace this placeholder with your real login UI.</p>
      </div>
    </div>
  );
}
