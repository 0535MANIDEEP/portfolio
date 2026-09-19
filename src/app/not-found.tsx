import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#1c1917]">404</h1>
        <p className="mt-2 text-[#78716c]">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-md bg-[#1c1917] px-4 py-2 text-sm font-medium text-[#fafaf9] hover:bg-[#44403c] transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}