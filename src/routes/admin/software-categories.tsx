import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/software-categories')({
  component: AdminSoftwareCategories,
});

function AdminSoftwareCategories() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Categorias de Softwares</h1>
      <p className="text-muted-foreground">Página de gerenciamento de categorias em construção.</p>
    </div>
  );
}
