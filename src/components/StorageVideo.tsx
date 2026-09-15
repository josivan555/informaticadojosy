import { useEffect, useState } from "react";
import { getPublicAssetUrl } from "@/lib/storage.functions";

const cache = new Map<string, string>();

function isStorageRef(value: string) {
  return value.includes("/object/public/") || /^(softwares|courses)\//.test(value);
}

function toEmbed(value: string): string | null {
  if (/youtube\.com\/watch\?v=/.test(value)) {
    return value.replace("watch?v=", "embed/").split("&")[0]!;
  }
  if (/youtu\.be\//.test(value)) {
    return value.replace("youtu.be/", "www.youtube.com/embed/").split("?")[0]!;
  }
  if (/youtube\.com\/embed\//.test(value)) return value;
  if (/vimeo\.com\/\d+/.test(value)) {
    return value.replace("vimeo.com/", "player.vimeo.com/video/");
  }
  return null;
}

interface StorageVideoProps {
  value: string | null | undefined;
  className?: string;
  poster?: string | null;
}

/**
 * Plays a video stored in a private Cloud bucket (via signed URL) or an
 * embedded YouTube/Vimeo link.
 */
export function StorageVideo({ value, className, poster }: StorageVideoProps) {
  const embed = value ? toEmbed(value) : null;
  const [src, setSrc] = useState<string | null>(() => {
    if (!value || embed) return null;
    if (!isStorageRef(value)) return value;
    return cache.get(value) ?? null;
  });

  useEffect(() => {
    let active = true;
    if (!value || embed) return;
    if (!isStorageRef(value)) {
      setSrc(value);
      return;
    }
    const cached = cache.get(value);
    if (cached) {
      setSrc(cached);
      return;
    }
    setSrc(null);
    getPublicAssetUrl({ data: { value } })
      .then((res) => {
        if (!active || !res.url) return;
        cache.set(value, res.url);
        setSrc(res.url);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [value, embed]);

  if (!value) return null;

  if (embed) {
    return <iframe src={embed} className={className} allowFullScreen />;
  }

  if (!src) return null;

  return <video src={src} controls className={className} poster={poster ?? undefined} />;
}
