import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ALLOWED_BUCKETS = ["softwares", "courses"] as const;

/** Accepts a full Supabase public URL or a "bucket/path" string. */
function parseRef(value: string): { bucket: string; path: string } | null {
  const marker = "/object/public/";
  const idx = value.indexOf(marker);
  const raw = idx === -1 ? value : value.slice(idx + marker.length).split("?")[0]!;
  const decoded = decodeURIComponent(raw).replace(/^\/+/, "");
  const [bucket, ...rest] = decoded.split("/");
  const path = rest.join("/");
  if (!bucket || !path) return null;
  if (!(ALLOWED_BUCKETS as readonly string[]).includes(bucket)) return null;
  // Only media folders are exposed publicly through signed links.
  if (!/^(covers|videos)\//.test(path)) return null;
  return { bucket, path };
}

/** Returns a short-lived signed URL for a public cover/video asset. */
export const getPublicAssetUrl = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ value: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const ref = parseRef(data.value);
    if (!ref) return { url: null as string | null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(ref.bucket)
      .createSignedUrl(ref.path, 60 * 60);

    if (error || !signed?.signedUrl) return { url: null as string | null };
    return { url: signed.signedUrl };
  });
