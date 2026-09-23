import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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

export const adminListCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context.userId);
    const { data, error } = await admin
      .from("software_categories")
      .select("*, softwares(count)")
      .order("name", { ascending: true });
    if (error) throw new Error("Não foi possível carregar as categorias");
    return (data ?? []).map((c: any) => ({
      id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      description: (c.description ?? null) as string | null,
      software_count: (c.softwares?.[0]?.count ?? 0) as number,
    }));
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id?: string | undefined; name: string; description?: string | null }) => data)
  .handler(async ({ context, data }) => {
    const admin = await requireAdmin(context.userId);
    const slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const payload = { name: data.name, slug, description: data.description ?? null };
    const query = data.id
      ? admin.from("software_categories").update(payload).eq("id", data.id)
      : admin.from("software_categories").insert(payload);
    const { error } = await query;
    if (error) throw new Error("Não foi possível salvar a categoria");
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ context, data }) => {
    const admin = await requireAdmin(context.userId);
    const { error } = await admin.from("software_categories").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível remover a categoria");
    return { ok: true };
  });

const downloadPeriodSchema = z.enum(["7d", "30d", "90d", "all"]);

export const adminListDownloads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ period: downloadPeriodSchema }).parse(data))
  .handler(async ({ context, data: input }) => {
    const admin = await requireAdmin(context.userId);
    const days = input.period === "all" ? null : Number.parseInt(input.period, 10);
    const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() : null;
    const allRows: any[] = [];
    const pageSize = 1000;

    for (let from = 0; ; from += pageSize) {
      let query = admin
        .from("download_history")
        .select("id, downloaded_at, user_id, software_id, softwares(name)")
        .order("downloaded_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (since) query = query.gte("downloaded_at", since);
      const { data, error } = await query;
      if (error) throw new Error("Não foi possível carregar as métricas de downloads");
      allRows.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
    }

    const emails = new Map<string, string>();
    try {
      for (let page = 1; ; page += 1) {
        const { data: users } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        users?.users?.forEach((u) => emails.set(u.id, u.email ?? ""));
        if (!users?.users || users.users.length < 1000) break;
      }
    } catch {
      // ignora falha ao buscar e-mails
    }

    const counts = new Map<string, { software_id: string; name: string; count: number }>();
    allRows.forEach((row: any) => {
      const current = counts.get(row.software_id);
      if (current) current.count += 1;
      else counts.set(row.software_id, {
        software_id: row.software_id as string,
        name: (row.softwares?.name ?? "Programa removido") as string,
        count: 1,
      });
    });
    const ranking = [...counts.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .map((item) => ({ ...item, percentage: allRows.length ? Math.round((item.count / allRows.length) * 100) : 0 }));

    const history = allRows.slice(0, 200).map((row: any) => ({
      id: row.id as string,
      downloaded_at: row.downloaded_at as string,
      software_name: (row.softwares?.name ?? "Programa removido") as string,
      user_email: row.user_id ? emails.get(row.user_id) || "Usuário" : "Visitante",
    }));

    return {
      total: allRows.length,
      programs: ranking.length,
      topProgram: ranking[0] ?? null,
      ranking,
      history,
    };
  });
