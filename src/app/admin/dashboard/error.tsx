"use client";

import { useEffect } from "react";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#fafaf9]">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-[#1c1917] mb-2">Dashboard Error</h1>
        <p className="text-sm text-[#78716c] mb-6">
          Failed to load the admin dashboard. Please try again or log out.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-[#1c1917] px-4 py-2 text-sm font-medium text-[#fafaf9] hover:bg-[#44403c] transition-colors"
          >
            Retry
          </button>
          <a
            href="/admin"
            className="rounded-md border border-[#e7e5e4] px-4 py-2 text-sm font-medium text-[#1c1917] hover:bg-[#f5f5f4] transition-colors"
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
