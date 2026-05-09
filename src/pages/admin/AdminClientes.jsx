const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Search, ChevronUp, ChevronDown, User, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PaymentStatusBadge from '@/components/dashboard/PaymentStatusBadge';
import VigenciaBadge from '@/components/dashboard/VigenciaBadge';

export default function AdminClientes() {
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [sortKey, setSortKey] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['admin-clientes'],
    queryFn: () => db.entities.Cliente.list(),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clientes
      .filter(c => c.nombre?.toLowerCase().includes(q) || c.dni?.includes(q))
      .sort((a, b) => {
        const va = (a[sortKey] || '').toLowerCase();
        const vb = (b[sortKey] || '').toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
  }, [clientes, search, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Explorador de Clientes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{clientes.length} clientes en cartera</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o DNI…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 h-9 text-sm w-full"
        />
      </div>

      {/* En mobile: lista de cards. En desktop: tabla + panel lateral */}
      <div className="block lg:hidden space-y-2">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-40 mb-2" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          ))
        ) : paginated.map(c => (
          <div
            key={c.id}
            onClick={() => setSelectedCliente(selectedCliente?.id === c.id ? null : c)}
            className={`bg-card border rounded-xl p-4 cursor-pointer transition-colors ${selectedCliente?.id === c.id ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-foreground">{c.nombre}</p>
                <p className="text-xs text-muted-foreground font-mono">DNI {c.dni}</p>
              </div>
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {c.polizas?.length || 0}
              </span>
            </div>
            {selectedCliente?.id === c.id && (
              <div className="mt-3 pt-3 border-t border-border">
                <ClienteDetail cliente={c} />
              </div>
            )}
          </div>
        ))}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-7 h-7 rounded text-xs font-medium ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: tabla + panel lateral */}
      <div className="hidden lg:grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('nombre')}>
                  <span className="flex items-center gap-1">Nombre <SortIcon k="nombre" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('dni')}>
                  <span className="flex items-center gap-1">DNI <SortIcon k="dni" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pólizas</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-8" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-24" /></td>
                  </tr>
                ))
              ) : paginated.map(c => (
                <tr key={c.id} onClick={() => setSelectedCliente(c)}
                  className={`border-b border-border cursor-pointer transition-colors ${selectedCliente?.id === c.id ? 'bg-primary/5' : 'hover:bg-muted/40'}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{c.nombre}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{c.dni}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {c.polizas?.length || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.telefono || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-7 h-7 rounded text-xs font-medium ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          {selectedCliente ? (
            <ClienteDetail cliente={selectedCliente} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <User className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Seleccioná un cliente para ver su perfil</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClienteDetail({ cliente }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{cliente.nombre}</p>
          <p className="text-xs text-muted-foreground font-mono">DNI {cliente.dni}</p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {cliente.telefono && (
          <a href={`tel:${cliente.telefono}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <Phone className="w-3 h-3" /> {cliente.telefono}
          </a>
        )}
        {cliente.email && (
          <a href={`mailto:${cliente.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <Mail className="w-3 h-3" /> {cliente.email}
          </a>
        )}
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pólizas</p>
      <div className="space-y-2">
        {(cliente.polizas || []).map((p, i) => (
          <div key={i} className="bg-muted/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-foreground">{p.tipo_seguro}</p>
              <VigenciaBadge estado={p.estado} />
            </div>
            <p className="text-xs text-muted-foreground">{p.compania} · {p.numero_poliza}</p>
            {p.vehiculo && <p className="text-xs text-muted-foreground mt-0.5">{p.vehiculo}</p>}
            <div className="mt-1.5">
              <PaymentStatusBadge status={p.estado_pago} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}