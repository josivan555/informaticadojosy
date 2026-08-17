import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Acesso restrito a administradores");
  return supabaseAdmin;
}

export const adminListSoftwares = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context.userId);
    const { data, error } = await admin
      .from("softwares")
      .select("*, software_categories(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os softwares");
    return data ?? [];
  });

export const adminListCourses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context.userId);
    const { data, error } = await admin
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os cursos");
    return data ?? [];
  });
