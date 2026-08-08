import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/softwares')({
  component: AdminSoftwares,
});

function AdminSoftwares() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Gerenciar Softwares</h1>
      <p className="text-slate-400">Página de gerenciamento de programas em construção.</p>
    </div>
  );
}
