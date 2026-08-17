import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "files";

/** Extract the storage object path from a stored public URL. */
function toStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const raw = url.slice(idx + marker.length).split("?")[0] ?? "";
  return raw ? decodeURIComponent(raw) : null;
}

async function signPath(path: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error || !data?.signedUrl) throw new Error("Não foi possível gerar o link de download");
  return data.signedUrl;
}

/** Free software downloads: no auth needed, but the file must be free. */
export const getFreeSoftwareDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ softwareId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sw, error } = await supabaseAdmin
      .from("softwares")
      .select("id, price, file_url, external_download_url, status")
      .eq("id", data.softwareId)
      .eq("status", "published")
      .maybeSingle();

    if (error || !sw) throw new Error("Software não encontrado");
    if ((sw.price ?? 0) > 0) throw new Error("Este software requer compra");

    if ((sw as any).external_download_url) return { url: (sw as any).external_download_url as string };

    const path = toStoragePath(sw.file_url);
    if (!path) throw new Error("Arquivo não disponível");
    return { url: await signPath(path) };
  });

/** Paid software / course downloads: requires a completed checkout session. */
export const getPurchasedDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        kind: z.enum(["course", "software"]),
        itemId: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const column = data.kind === "course" ? "course_id" : "software_id";

    const { data: purchase } = await context.supabase
      .from("checkout_sessions")
      .select("id")
      .eq(column, data.itemId)
      .eq("user_id", context.userId)
      .eq("status", "completed")
      .maybeSingle();

    if (!purchase) throw new Error("Compra não encontrada para este item");

    const table = data.kind === "course" ? "courses" : "softwares";
    const { data: item } = await context.supabase
      .from(table)
      .select("file_url, external_download_url")
      .eq("id", data.itemId)
      .maybeSingle();

    if (!item) throw new Error("Item não encontrado");

    if ((item as any).external_download_url) {
      return { url: (item as any).external_download_url };
    }

    const path = toStoragePath((item as any)?.file_url);
    if (!path) throw new Error("Arquivo não disponível");
    return { url: await signPath(path) };
  });