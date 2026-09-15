import { Link } from "@tanstack/react-router";
import { Laptop } from "lucide-react";
import { StorageImage } from "@/components/StorageImage";

interface StoreCardProps {
  to: string;
  params: Record<string, string>;
  image?: string | null;
  title: string;
  subtitle?: string | null;
  price?: number | null;
  meta?: string | null;
}

export function StoreCard({ to, params, image, title, subtitle, price, meta }: StoreCardProps) {
  return (
    <Link
      // @ts-ignore - rota dinâmica tipada em tempo de execução
      to={to}
      params={params}
      className="group flex flex-col rounded-lg border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-3 aspect-square w-full overflow-hidden rounded-md bg-secondary">
        <StorageImage
          value={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <Laptop className="h-10 w-10 text-muted-foreground/40" />
            </div>
          }
        />
      </div>
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground">{title}</h3>
      {subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-auto pt-2 text-sm font-medium text-card-foreground">
        {price && price > 0 ? "Pago" : "Grátis"}
        {meta && <span className="ml-2 text-xs font-normal text-muted-foreground">{meta}</span>}
      </div>
    </Link>
  );
}
