import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, AlertTriangle, DollarSign, RefreshCw, ArrowUpRight, LogOut, Loader2 } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  // Conexión real a tu backend FastAPI
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`http://${window.location.hostname}:8000/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Error al cargar estadísticas');
      return res.json();
    }
  });

  const handleLogout = () => {
    // Redirige al login
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Obtenemos los datos para el gráfico que manda el backend
  const chartData = stats?.distribucion_companias || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen de tu cartera de seguros</p>
        </div>
        <Button variant="outline" className="w-fit gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Cerrar Sesión
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Clientes en Cartera"
          value={stats?.clientes_activos || 0}
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Venc. en 30 días"
          value={stats?.renovaciones_pendientes || 0}
          icon={AlertTriangle}
          trend="neutral"
        />
        <MetricCard
          title="Saldos Pendientes"
          value={`$${(stats?.total_a_cobrar || 0).toLocaleString('es-AR')}`}
          icon={DollarSign}
          trend="down"
        />
        <MetricCard
          title="Pólizas Activas"
          value={stats?.polizas_vigentes || 0}
          icon={RefreshCw}
          trend="up"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Gráfico de Distribución de Pólizas */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-6">Distribución por Compañía</h2>
          {chartData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] w-full flex items-center justify-center text-sm text-muted-foreground">
              Cargando gráfico...
            </div>
          )}
        </div>

        {/* Acceso rápido */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Acceso Rápido</h2>
          <div className="space-y-2">
            <Link to="/admin/ingesta"
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm font-medium text-foreground">
              Subir archivo de compañía
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link to="/admin/renovaciones"
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm font-medium text-foreground">
              Revisar renovaciones
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link to="/admin/clientes"
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm font-medium text-foreground">
              Explorar clientes
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}