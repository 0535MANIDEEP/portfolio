import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { path = "/" } = (await req.json().catch(() => ({}))) as { path?: string };
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ip_hash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
    const supabase = getSupabaseAdmin();
    await supabase.from("portfolio_views").insert({ path, ip_hash });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { count } = await supabase.from("portfolio_views").select("id", { count: "exact", head: true });
    const { data } = await supabase.from("portfolio_sections").select("updated_at").order("updated_at", { ascending: false }).limit(1);
    return NextResponse.json({ views: count ?? 0, lastUpdated: data?.[0]?.updated_at ?? null });
  } catch {
    return NextResponse.json({ views: 0, lastUpdated: null });
  }
}
