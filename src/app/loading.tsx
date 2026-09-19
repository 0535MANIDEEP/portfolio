export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 text-[#78716c]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e7e5e4] border-t-[#1c1917]" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
}