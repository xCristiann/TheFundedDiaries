import { Suspense } from "react";
import LoginModeClient from "./LoginModeClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading...</div>}>
      <LoginModeClient>
        {/* TODO: aici pui componenta ta reală de login */}
        <div className="min-h-[70vh] flex items-center justify-center px-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
            <h1 className="text-3xl font-bold mb-2">Login</h1>
            <p className="text-gray-400">Replace this placeholder with your existing login UI.</p>
          </div>
        </div>
      </LoginModeClient>
    </Suspense>
  );
}
