"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Payment Success</h1>
        <p className="text-gray-400">
          Session: {sessionId || "missing"}
        </p>
      </div>
    </div>
  );
}
