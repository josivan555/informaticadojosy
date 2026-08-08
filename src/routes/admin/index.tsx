import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Painel de Controle</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0d1b33] p-6 rounded-xl border border-slate-800">
          <h3 className="text-slate-400 text-sm font-medium">Total de Downloads</h3>
          <p className="text-3xl font-bold text-white mt-2">0</p>
        </div>
        <div className="bg-[#0d1b33] p-6 rounded-xl border border-slate-800">
          <h3 className="text-slate-400 text-sm font-medium">Softwares</h3>
          <p className="text-3xl font-bold text-white mt-2">0</p>
        </div>
        <div className="bg-[#0d1b33] p-6 rounded-xl border border-slate-800">
          <h3 className="text-slate-400 text-sm font-medium">Cursos</h3>
          <p className="text-3xl font-bold text-white mt-2">0</p>
        </div>
        <div className="bg-[#0d1b33] p-6 rounded-xl border border-slate-800">
          <h3 className="text-slate-400 text-sm font-medium">Vendas</h3>
          <p className="text-3xl font-bold text-white mt-2">R$ 0,00</p>
        </div>
      </div>
    </div>
  );
}
