import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_URL = "https://informaticadojosy.lovable.app";

/**
 * Cria automaticamente uma preferência de pagamento no Mercado Pago
 * com base no preço cadastrado pelo admin. O webhook confirma o pagamento.
 */
export const createCourseCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ courseId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
    if (!token) throw new Error("Pagamentos ainda não configurados");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: course, error } = await supabaseAdmin
      .from("courses")
      .select("id, title, description, price, status, image_url")
      .eq("id", data.courseId)
      .maybeSingle();

    if (error || !course || course.status !== "published") {
      throw new Error("Curso não disponível para compra");
    }
    if (!course.price || Number(course.price) <= 0) {
      throw new Error("Este curso é gratuito");
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("checkout_sessions")
      .insert({
        user_id: context.userId,
        course_id: course.id,
        payment_method: "mercadopago",
        status: "pending",
      })
      .select("id")
      .single();

    if (sessionError || !session) throw new Error("Não foi possível iniciar a compra");

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: course.id,
            title: course.title,
            description: (course.description ?? "Curso digital em PDF").slice(0, 250),
            picture_url: course.image_url ?? undefined,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(course.price),
          },
        ],
        external_reference: session.id,
        notification_url: `${SITE_URL}/api/public/mercadopago-webhook`,
        back_urls: {
          success: `${SITE_URL}/courses/${course.id}`,
          pending: `${SITE_URL}/courses/${course.id}`,
          failure: `${SITE_URL}/courses/${course.id}`,
        },
        auto_return: "approved",
      }),
    });

    if (!response.ok) {
      console.error("Mercado Pago preference error:", await response.text());
      throw new Error("Não foi possível gerar o pagamento");
    }

    const preference = (await response.json()) as { id: string; init_point: string };

    await supabaseAdmin
      .from("checkout_sessions")
      .update({ external_checkout_id: preference.id })
      .eq("id", session.id);

    return { checkoutUrl: preference.init_point, sessionId: session.id };
  });

/** Consulta o status de compra do curso para o usuário logado. */
export const getCoursePurchaseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ courseId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("checkout_sessions")
      .select("id")
      .eq("course_id", data.courseId)
      .eq("user_id", context.userId)
      .eq("status", "completed")
      .limit(1);
    return { purchased: (rows?.length ?? 0) > 0 };
  });
