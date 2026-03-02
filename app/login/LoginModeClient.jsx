"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

// IMPORTANT: Aici NU îți stric loginul existent.
// Doar îți dă un helper sigur pentru mode.
// Tu integrezi în UI-ul tău: const mode = useLoginMode();
export function useLoginMode() {
  const sp = useSearchParams();
  return useMemo(() => (sp.get("mode") === "signup" ? "signup" : "login"), [sp]);
}

export default function LoginModeClient({ children }) {
  return children;
}
