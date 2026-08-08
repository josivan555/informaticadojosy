import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/downloads')({
  component: AdminDownloads,
});

function AdminDownloads() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Histórico de Downloads</h1>
      <p className="text-slate-400">Página de histórico de downloads em construção.</p>
    </div>
  );
}
