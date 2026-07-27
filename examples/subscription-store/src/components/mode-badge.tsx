"use client";

import { useEffect, useState } from "react";

export function ModeBadge({ className }: { className?: string }) {
  const [mode, setMode] = useState<"sandbox" | "hosted" | null>(null);

  useEffect(() => {
    void fetch("/api/meta")
      .then((r) => r.json())
      .then((data: { mode?: "sandbox" | "hosted" }) => {
        if (data.mode) setMode(data.mode);
      })
      .catch(() => setMode("sandbox"));
  }, []);

  if (!mode) {
    return <span className={`badge ${className ?? ""}`.trim()}>…</span>;
  }

  return (
    <span className={`badge ${mode === "sandbox" ? "sandbox" : "hosted"} ${className ?? ""}`.trim()}>
      {mode === "sandbox" ? "Sandbox mode" : "Hosted API mode"}
    </span>
  );
}
