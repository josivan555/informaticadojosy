import { useEffect, useState, type ReactNode } from "react";
import { getPublicAssetUrl } from "@/lib/storage.functions";

const cache = new Map<string, string>();

function isStorageRef(value: string) {
  return value.includes("/object/public/") || /^(softwares|courses)\//.test(value);
}

interface StorageImageProps {
  value: string | null | undefined;
  alt: string;
  className?: string;
  fallback: ReactNode;
}

/**
 * Renders an image stored in a private Cloud bucket by resolving a
 * short-lived signed URL. Plain external URLs are rendered directly.
 */
export function StorageImage({ value, alt, className, fallback }: StorageImageProps) {
  const [src, setSrc] = useState<string | null>(() => {
    if (!value) return null;
    if (!isStorageRef(value)) return value;
    return cache.get(value) ?? null;
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);

    if (!value) {
      setSrc(null);
      return;
    }
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
        if (!active) return;
        if (res.url) {
          cache.set(value, res.url);
          setSrc(res.url);
        } else {
          setFailed(true);
        }
      })
      .catch(() => active && setFailed(true));

    return () => {
      active = false;
    };
  }, [value]);

  if (!value || failed || !src) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
