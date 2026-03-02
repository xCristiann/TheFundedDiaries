import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading...</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
