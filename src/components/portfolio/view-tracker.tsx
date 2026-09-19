"use client";

import { useEffect } from "react";

export function ViewTracker() {
  useEffect(() => {
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "/" }),
    }).catch(() => {});
  }, []);
  return null;
}
