import { supabase } from "@/lib/supabase";

export async function GET() {
  const [{ data: progress }, { data: usage }] = await Promise.all([
    supabase.from("progress").select("*").order("subject"),
    supabase
      .from("daily_usage")
      .select("*")
      .order("date", { ascending: false })
      .limit(30),
  ]);

  const totalStars = progress?.reduce((s, p) => s + p.total_stars, 0) ?? 0;

  // Streak: consecutive days with usage
  let streak = 0;
  if (usage && usage.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    let check = today;
    for (const day of usage) {
      if (day.date === check) {
        streak++;
        const d = new Date(check);
        d.setDate(d.getDate() - 1);
        check = d.toISOString().split("T")[0];
      } else break;
    }
  }

  return Response.json({ progress, totalStars, streak, usage });
}
