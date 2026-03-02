import { Suspense } from "react";

export const dynamic = "force-dynamic";

function LoginInner() {
  // IMPORTANT: useSearchParams trebuie sa stea intr-un Client Component,
  // dar ca sa NU mai pice build-ul, pastram pagina simpla aici.
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Login</h1>
        <p className="text-gray-400">Login page (dynamic).</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading...</div>}>
      <LoginInner />
    </Suspense>
  );
}
