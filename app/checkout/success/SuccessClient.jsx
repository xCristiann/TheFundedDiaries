"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id") || sp.get("sessionId") || "";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Payment success</h1>
        <p className="text-gray-400">Client-only page (no prerender crash).</p>
        <div className="mt-4 text-sm text-gray-300">
          session_id: <span className="font-mono">{sessionId || "-"}</span>
        </div>
      </div>
    </div>
  );
}
