"use client";

import { useState, useEffect } from "react";

/**
 * Shared, fetch-once access to the public site settings.
 *
 * Previously each hook instance owned its own copy and only the caller that
 * *started* the request applied the result — any component that mounted while
 * the request was already in flight received the pending promise and then
 * silently kept the defaults forever. Settings are now broadcast to every
 * subscriber when they arrive.
 */

interface AppSettings {
  enableCustomCursor?: boolean;
  cursorMagneticSnap?: boolean;
  enableAutoEmbeds?: boolean;
  enableAnimations?: boolean;
  enableComments?: boolean;
  enableMusic?: boolean;
  musicUrl?: string;
  [key: string]: unknown;
}

const DEFAULTS: AppSettings = {
  enableCustomCursor: false,
  cursorMagneticSnap: true,
  enableAutoEmbeds: true,
  enableAnimations: true,
  enableComments: true,
};

let cachedSettings: AppSettings | null = null;
let inFlight: Promise<AppSettings> | null = null;
const subscribers = new Set<(s: AppSettings) => void>();

function loadSettings(): Promise<AppSettings> {
  if (cachedSettings) return Promise.resolve(cachedSettings);
  if (inFlight) return inFlight;

  inFlight = (async () => {
    let merged = DEFAULTS;
    try {
      const res = await fetch("/api/settings");
      if (res.ok) merged = { ...DEFAULTS, ...(await res.json()) };
    } catch {
      // Fall back to defaults — settings are presentational, never critical.
    }
    cachedSettings = merged;
    inFlight = null;
    subscribers.forEach((notify) => notify(merged));
    return merged;
  })();

  return inFlight;
}

export function useAppSettings(): AppSettings & { loading: boolean } {
  const [settings, setSettings] = useState<AppSettings>(cachedSettings ?? DEFAULTS);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    const notify = (s: AppSettings) => {
      setSettings(s);
      setLoading(false);
    };
    subscribers.add(notify);

    loadSettings().then(notify);

    return () => { subscribers.delete(notify); };
  }, []);

  return { ...settings, loading };
}

/** Quick check — can be used outside React. */
export function getSetting(key: string): boolean {
  return !!(cachedSettings?.[key] ?? DEFAULTS[key]);
}
