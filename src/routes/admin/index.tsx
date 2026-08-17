import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Laptop, BookOpen, Download, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [softwares, courses, downloads] = await Promise.all([
        supabase.from('softwares').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('download_history').select('*', { count: 'exact', head: true }),
      ]);
      
      return {
        softwares: softwares.count || 0,
        courses: courses.count || 0,
        downloads: downloads.count || 0,
        sales: 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Painel de Controle</h1>
          <p className="text-slate-400">Bem-vindo de volta, Josy.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-cyan-600 hover:bg-cyan-700 gap-2">
            <Link to="/admin/softwares">
              <Plus className="h-4 w-4" />
              Novo Software
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-slate-700 text-white hover:bg-slate-800 gap-2">
            <Link to="/admin/courses">
              <Plus className="h-4 w-4" />
              Novo Curso
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0d1b33] p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Download className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-slate-400 text-sm font-medium">Total de Downloads</h3>
              <p className="text-2xl font-bold text-white mt-1">{stats?.downloads || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1b33] p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Laptop className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-slate-400 text-sm font-medium">Softwares</h3>
              <p className="text-2xl font-bold text-white mt-1">{stats?.softwares || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1b33] p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-slate-400 text-sm font-medium">Cursos</h3>
              <p className="text-2xl font-bold text-white mt-1">{stats?.courses || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1b33] p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-slate-400 text-sm font-medium">Vendas</h3>
              <p className="text-2xl font-bold text-white mt-1">R$ {stats?.sales?.toFixed(2) || '0,00'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

