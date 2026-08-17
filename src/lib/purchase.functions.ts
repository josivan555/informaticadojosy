import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Purchase links are hidden from public reads; signed-in buyers fetch them here. */
export const getPurchaseLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        kind: z.enum(["course", "software"]),
        itemId: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.kind === "course" ? "courses" : "softwares";
    const { data: item, error } = await supabaseAdmin
      .from(table)
      .select("mercadopago_link, paddle_price_id, status")
      .eq("id", data.itemId)
      .maybeSingle();

    if (error || !item || (item as any).status !== "published") {
      throw new Error("Item não disponível para compra");
    }

    return {
      mercadopago_link: (item as any).mercadopago_link as string | null,
      paddle_price_id: (item as any).paddle_price_id as string | null,
    };
  });
