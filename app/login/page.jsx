import { Suspense } from "react";
import LoginModeClient from "./LoginModeClient";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

function Shell() {
  // page server component: păstrează doar UI wrapper
  return (
    <LoginModeClient
      onMode={(m) => {
        // no-op (client handles), păstrat pt compat
      }}
    >
      {/* LoginClient va citi mode din URL via wrapper logic din page? */}
      {/* Simplu: folosim doar link-uri ?mode=... și renderăm implicit login */}
      <LoginClient />
    </LoginModeClient>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading...</div>}>
      <Shell />
    </Suspense>
  );
}
