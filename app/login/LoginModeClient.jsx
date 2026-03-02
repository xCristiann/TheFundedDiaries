"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginModeClient({ children, onMode }) {
  const sp = useSearchParams();
  const router = useRouter();
  const mode = (sp.get("mode") || "login").toLowerCase();

  useEffect(() => {
    if (onMode) onMode(mode);
  }, [mode, onMode]);

  // dacă vine ceva dubios în URL, îl normalizăm
  useEffect(() => {
    if (mode !== "login" && mode !== "signup") {
      router.replace("/login?mode=login");
    }
  }, [mode, router]);

  return children;
}
