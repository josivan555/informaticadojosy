import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Registra uma visita ao site (público; dados mínimos, sem identificar o visitante)
export const recordVisit = createServerFn({ method: "POST" })
  .inputValidator((data: { path: string }) => ({
    path: typeof data?.path === "string" ? data.path.slice(0, 200) : "/",
  }))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("site_visits").insert({ path: data.path || "/" });
    } catch {
      // nunca quebrar a navegação por causa do contador
    }
    return { ok: true };
  });

// Estatísticas de visitas para o painel do admin
export const adminVisitStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Acesso restrito a administradores");

    const since = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
    const [total, today, week, month] = await Promise.all([
      supabaseAdmin.from("site_visits").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("site_visits").select("id", { count: "exact", head: true }).gte("visited_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabaseAdmin.from("site_visits").select("id", { count: "exact", head: true }).gte("visited_at", since(7)),
      supabaseAdmin.from("site_visits").select("id", { count: "exact", head: true }).gte("visited_at", since(30)),
    ]);

    return {
      total: total.count ?? 0,
      today: today.count ?? 0,
      week: week.count ?? 0,
      month: month.count ?? 0,
    };
  });
