import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Zap, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/courses/")({
  component: CoursesList,
  head: () => ({
    title: "Todos os Cursos - INFORMÁTICA do Josy",
    meta: [
      { name: "description", content: "Explore nossa lista completa de cursos em PDF." },
    ],
  }),
});

function CoursesList() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-[#0a192f] text-slate-200">
      <header className="border-b border-primary/10 bg-[#0a192f]/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto h-16 flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
            <Zap className="h-5 w-5 text-primary" fill="currentColor" />
            <span>INFORMÁTICA <span className="text-primary">do Josy</span></span>
          </Link>

          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8 text-white">Nossos Cursos</h1>
        
        {isLoading ? (
          <div className="text-center py-20">Carregando cursos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses?.map((course: any) => (
              <Link 
                key={course.id} 
                to="/courses/$courseId" 
                params={{ courseId: course.id }}
                className="group flex flex-col bg-[#112240] border border-slate-800 rounded-2xl overflow-hidden hover:border-primary/50 transition-all"
              >
                <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                  {course.image_url ? (
                    <img 
                      src={course.image_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge>{course.level}</Badge>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {course.description}
                  </p>
                  <div className="pt-4 flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">R$ {course.price?.toFixed(2)}</span>
                    <Button size="sm">Ver Detalhes</Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && courses?.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            Nenhum curso disponível no momento.
          </div>
        )}
      </main>
    </div>
  );
}
