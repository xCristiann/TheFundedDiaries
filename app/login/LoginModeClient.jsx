"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useLoginMode() {
  const sp = useSearchParams();
  return useMemo(() => (sp.get("mode") === "signup" ? "signup" : "login"), [sp]);
}

export default function LoginModeClient({ children }) {
  return children;
}
