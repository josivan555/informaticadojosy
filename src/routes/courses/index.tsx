import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { StoreShell } from "@/components/store/StoreShell";
import { StoreCard } from "@/components/store/StoreCard";

export const Route = createFileRoute("/courses/")({
  component: CoursesList,
  head: () => ({
    meta: [
      { title: "Todos os Cursos - Informática do Josy" },
      { name: "description", content: "Explore nossa lista completa de cursos em PDF." },
      { property: "og:title", content: "Cursos em PDF - Informática do Josy" },
      { property: "og:description", content: "Cursos práticos em PDF para aprender informática no seu ritmo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CoursesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: courses, isLoading } = useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, price, pages, level, status, created_at, updated_at, image_url, video_url, has_purchase_link, has_download")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filteredCourses = (courses || []).filter((course: any) => {
    const term = searchTerm.trim().toLowerCase();
    return !term || course.title.toLowerCase().includes(term) || course.description?.toLowerCase().includes(term);
  });

  return (
    <StoreShell
      active="courses"
      search={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Pesquisar cursos"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Cursos em PDF</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha um curso e aprenda no seu ritmo.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
        <span className="text-sm font-medium text-foreground">Todos os cursos</span>
        <span className="text-sm text-muted-foreground">
          {filteredCourses.length} {filteredCourses.length === 1 ? "curso" : "cursos"}
        </span>
      </div>

      <section aria-label="Lista de cursos">
        {isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Carregando cursos...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {filteredCourses.map((course: any) => (
              <StoreCard
                key={course.id}
                to="/courses/$courseId"
                params={{ courseId: course.id }}
                image={course.image_url}
                title={course.title}
                subtitle={course.level || "Curso em PDF"}
                price={course.price}
                meta={course.pages ? `${course.pages} páginas` : null}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredCourses.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-20 text-center">
            {searchTerm ? (
              <>
                <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <h2 className="font-medium text-foreground">Nenhum curso encontrado</h2>
                <p className="text-sm text-muted-foreground">Tente pesquisar outro nome.</p>
              </>
            ) : (
              <>
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <h2 className="font-medium text-foreground">Nenhum curso disponível no momento</h2>
              </>
            )}
          </div>
        )}
      </section>
    </StoreShell>
  );
}
