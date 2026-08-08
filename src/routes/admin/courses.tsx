import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/courses')({
  component: AdminCourses,
});

function AdminCourses() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Gerenciar Cursos</h1>
      <p className="text-slate-400">Página de gerenciamento de cursos em construção.</p>
    </div>
  );
}
