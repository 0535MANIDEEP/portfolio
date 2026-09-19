"use client";

"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#fafaf9]">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-[#1c1917] mb-2">Something went wrong</h1>
        <p className="text-sm text-[#78716c] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-[#1c1917] px-4 py-2 text-sm font-medium text-[#fafaf9] hover:bg-[#44403c] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-md border border-[#e7e5e4] px-4 py-2 text-sm font-medium text-[#1c1917] hover:bg-[#f5f5f4] transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
