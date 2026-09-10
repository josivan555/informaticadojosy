import { Link } from "@tanstack/react-router";
import { Laptop, Menu } from "lucide-react";
import { StorageImage } from "@/components/StorageImage";

interface SoftwaresSidebarProps {
  softwares: any[];
  activeId?: string;
  title?: string;
}

export function SoftwaresSidebar({ softwares, activeId, title = "Todos os Softwares" }: SoftwaresSidebarProps) {
  return (
    <aside className="lg:col-span-1">
      <div className="lg:sticky lg:top-24 rounded-2xl border border-slate-800 bg-[#112240] p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Menu className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-white">{title}</h2>
        </div>
        <nav className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-1 space-y-2">
          {(softwares || []).map((item: any) => {
            const isActive = item.id === activeId;
            return (
              <Link
                key={item.id}
                to="/softwares/$softwareId"
                params={{ softwareId: item.id }}
                className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${
                  isActive
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-[#162a4a] border border-transparent"
                }`}
              >
                <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                  <StorageImage
                    value={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    fallback={<Laptop className="h-4 w-4 text-primary/30" />}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-medium truncate ${isActive ? "text-primary" : "text-slate-200"}`}>
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {item.category || "Software"}
                    {item.price > 0 && " • Pago"}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
