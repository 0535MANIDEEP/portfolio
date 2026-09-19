import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("portfolio_sections")
      .select("section, data");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const map: Record<string, unknown> = {};
    for (const row of data ?? []) {
      map[row.section] = row.data;
    }

    return NextResponse.json(map);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { section, data } = body as { section?: string; data?: unknown };

    if (!section || data === undefined) {
      return NextResponse.json(
        { error: "section and data are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("portfolio_sections")
      .upsert(
        { section, data },
        { onConflict: "section" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
