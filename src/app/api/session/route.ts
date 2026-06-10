import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const { action, sessionId, subject } = await request.json();

  if (action === "start") {
    const { data, error } = await supabase
      .from("sessions")
      .insert({ subject })
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ sessionId: data.id });
  }

  if (action === "end" && sessionId) {
    const now = new Date().toISOString();
    const { data: session } = await supabase
      .from("sessions")
      .update({ ended_at: now })
      .eq("id", sessionId)
      .select()
      .single();

    if (session?.started_at) {
      const minutes = Math.round(
        (Date.now() - new Date(session.started_at).getTime()) / 60000
      );
      const today = new Date().toISOString().split("T")[0];
      await supabase.rpc("increment_daily_usage", { p_date: today, p_minutes: minutes });
    }

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
