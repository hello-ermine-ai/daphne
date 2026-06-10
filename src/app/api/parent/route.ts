import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get("parent_auth")?.value !== "ok") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: progress }, { data: usage }, { data: recentAttempts }] = await Promise.all([
    supabase.from("progress").select("*").order("subject"),
    supabase.from("daily_usage").select("*").order("date", { ascending: false }).limit(14),
    supabase.from("attempts").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const totalStars = progress?.reduce((s, p) => s + p.total_stars, 0) ?? 0;
  const totalMinutes = usage?.reduce((s, d) => s + d.minutes_spent, 0) ?? 0;
  const todayUsage = usage?.find(d => d.date === new Date().toISOString().split("T")[0]);

  return Response.json({ progress, usage, recentAttempts, totalStars, totalMinutes, todayUsage });
}
