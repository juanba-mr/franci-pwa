import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Loader2, ChevronUp, ChevronDown, User, Phone, Mail, Filter, X, Edit, Save, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import PaymentStatusBadge from '@/components/dashboard/PaymentStatusBadge';
import VigenciaBadge from '@/components/dashboard/VigenciaBadge';

export default function AdminClientes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);

  // Estados para Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filterCompania, setFilterCompania] = useState('');
  const [filterFormaPago, setFilterFormaPago] = useState('');
  const [filterVigencia, setFilterVigencia] = useState('');

  // Estados para Paginación y Orden
  const [sortKey, setSortKey] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Estados para el Modal ABM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState(null); // null = Crear Nuevo, object = Editar

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['admin-clientes'],
    queryFn: async () => {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/clientes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Error al cargar clientes');
      return res.json();
    }
  });

  // Extraemos opciones únicas
  const opcionesCompanias = React.useMemo(() => {
    const set = new Set();
    clientes.forEach(c => c.companias?.forEach(comp => set.add(comp)));
    return Array.from(set).filter(Boolean).sort();
  }, [clientes]);

  const opcionesFormaPago = React.useMemo(() => {
    const set = new Set();
    clientes.forEach(c => c.formas_pago?.forEach(fp => set.add(fp)));
    return Array.from(set).filter(Boolean).sort();
  }, [clientes]);

  // Aplicamos Búsqueda y Filtros
  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return clientes
      .filter(c => {
        const matchSearch = c.nombre?.toLowerCase().includes(q) || c.dni?.includes(q);
        if (!matchSearch) return false;
        if (filterCompania && (!c.companias || !c.companias.includes(filterCompania))) return false;
        if (filterFormaPago && (!c.formas_pago || !c.formas_pago.includes(filterFormaPago))) return false;
        if (filterVigencia) {
          if (filterVigencia === 'VIGENTE' && (!c.estados_polizas || !c.estados_polizas.includes('VIGENTE'))) return false;
          if (filterVigencia === 'VENCIDA' && (!c.estados_polizas || !c.estados_polizas.includes('VENCIDA'))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const va = (a[sortKey] || '').toLowerCase();
        const vb = (b[sortKey] || '').toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
  }, [clientes, search, filterCompania, filterFormaPago, filterVigencia, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const totalFiltrosActivos = (filterCompania ? 1 : 0) + (filterFormaPago ? 1 : 0) + (filterVigencia ? 1 : 0);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const resetFilters = () => {
    setFilterCompania('');
    setFilterFormaPago('');
    setFilterVigencia('');
    setPage(1);
  };

  const openCreateModal = () => {
    setClienteToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (clienteData) => {
    setClienteToEdit(clienteData);
    setIsModalOpen(true);
  };

  const Pagination = () => totalPages > 1 ? (
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
  ) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explorador de Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} clientes encontrados</p>
        </div>
        <Button className="w-fit" onClick={openCreateModal}>
          <UserPlus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      {/* BARRA DE BÚSQUEDA Y BOTÓN DE FILTROS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters || totalFiltrosActivos > 0 ? "default" : "outline"}
          className="gap-2 shrink-0 w-full sm:w-auto"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
          Filtros {totalFiltrosActivos > 0 && `(${totalFiltrosActivos})`}
        </Button>
      </div>

      {/* PANEL DESPLEGABLE DE FILTROS */}
      {showFilters && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
          {/* ... (Filtros: se mantienen igual que tu código original) ... */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Compañía</label>
            <select value={filterCompania} onChange={e => { setFilterCompania(e.target.value); setPage(1); }} className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Todas</option>
              {opcionesCompanias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Forma de Pago</label>
            <select value={filterFormaPago} onChange={e => { setFilterFormaPago(e.target.value); setPage(1); }} className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Cualquiera</option>
              {opcionesFormaPago.map(fp => <option key={fp} value={fp}>{fp}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Estado de Pólizas</label>
            <select value={filterVigencia} onChange={e => { setFilterVigencia(e.target.value); setPage(1); }} className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Todos</option>
              <option value="VIGENTE">Con pólizas Vigentes</option>
              <option value="VENCIDA">Con pólizas Vencidas</option>
            </select>
          </div>
          {totalFiltrosActivos > 0 && (
            <div className="sm:col-span-3 flex justify-end mt-1">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 gap-2 text-xs text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" /> Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Desktop & Mobile Views */}
      <div className="block lg:hidden space-y-2 pt-2">
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
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {c.cant_polizas || 0}
                </span>
              </div>
            </div>
            {selectedCliente?.id === c.id && (
              <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                <ClienteDetail cliente={c} onEdit={openEditModal} />
              </div>
            )}
          </div>
        ))}
        <Pagination />
      </div>

      <div className="hidden lg:grid grid-cols-3 gap-5 pt-2">
        <div className="col-span-2 bg-card border border-border rounded-xl overflow-hidden h-fit">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('nombre')}>
                  <span className="flex items-center gap-1">Nombre <SortIcon k="nombre" /></span>
                </th >
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('dni')}>
                  <span className="flex items-center gap-1">DNI <SortIcon k="dni" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pólizas</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
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
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-24 text-center text-muted-foreground">No se encontraron clientes.</td>
                </tr>
              ) : paginated.map(c => (
                <tr key={c.id} onClick={() => setSelectedCliente(c)}
                  className={`border-b border-border cursor-pointer transition-colors hover:bg-muted/50 ${selectedCliente?.id === c.id ? 'bg-primary/5' : ''}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{c.nombre}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{c.dni}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="font-normal">
                      {c.cant_polizas || 0} {c.cant_polizas === 1 ? 'póliza' : 'pólizas'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${c.estado === 'Activo' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-muted-foreground">{c.estado}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border">
            <Pagination />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 sticky top-6 h-fit">
          {selectedCliente ? (
            <ClienteDetail cliente={selectedCliente} onEdit={openEditModal} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <User className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Seleccioná un cliente para ver su perfil</p>
            </div>
          )}
        </div>
      </div>

      {/* RENDERIZADO DEL MODAL */}
      {isModalOpen && (
        <ClienteABMModal
          cliente={clienteToEdit}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries(['admin-clientes']);
            if (clienteToEdit) queryClient.invalidateQueries(['cliente-detalle', clienteToEdit.dni]);
          }}
        />
      )}
    </div>
  );
}

// =========================================
// COMPONENTE DETALLE DE CLIENTE
// =========================================
function ClienteDetail({ cliente, onEdit }) {
  const { data: clienteCompleto, isLoading } = useQuery({
    queryKey: ['cliente-detalle', cliente.dni],
    queryFn: async () => {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/clientes/${cliente.dni}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar detalle');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  // Combinamos los datos básicos con los completos para pasarlos al modal
  const dataParaEditar = clienteCompleto ? { ...cliente, ...clienteCompleto } : cliente;

  return (
    <div className="animate-in fade-in duration-300 relative">
      {/* BOTÓN DE EDITAR EN LA ESQUINA SUPERIOR DERECHA */}
      <button
        onClick={() => onEdit(dataParaEditar)}
        className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-primary transition-colors bg-muted/50 hover:bg-primary/10 rounded-lg"
        title="Editar Cliente"
      >
        <Edit className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border pr-10">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm leading-tight">{cliente.nombre}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">DNI {cliente.dni}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {clienteCompleto?.telefono ? (
          <a href={`tel:${clienteCompleto.telefono}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <Phone className="w-3 h-3" /> {clienteCompleto.telefono}
          </a>
        ) : (
          <p className="flex items-center gap-2 text-xs text-muted-foreground/50"><Phone className="w-3 h-3" /> Sin teléfono</p>
        )}

        {clienteCompleto?.email ? (
          <a href={`mailto:${clienteCompleto.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <Mail className="w-3 h-3" /> {clienteCompleto.email}
          </a>
        ) : (
          <p className="flex items-center gap-2 text-xs text-muted-foreground/50"><Mail className="w-3 h-3" /> Sin email</p>
        )}
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6">Pólizas Registradas</p>
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {(!clienteCompleto?.polizas || clienteCompleto.polizas.length === 0) ? (
          <p className="text-xs text-muted-foreground text-center py-4 bg-muted/30 rounded-lg border border-dashed border-border">No hay pólizas registradas</p>
        ) : (
          clienteCompleto.polizas.map((p, i) => (
            <div key={i} className="bg-muted/40 rounded-lg p-3 border border-border/50">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-foreground">{p.tipo_seguro}</p>
                <VigenciaBadge estado={p.estado} />
              </div>
              <p className="text-xs text-muted-foreground">{p.compania} · {p.numero_poliza}</p>
              {p.vehiculo && <p className="text-xs text-muted-foreground mt-0.5">{p.vehiculo}</p>}
              <div className="mt-1.5 flex flex-col gap-1.5">
                <PaymentStatusBadge status={p.estado_pago} />
                {p.forma_pago && p.forma_pago !== 'S/D' && (
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground">Pago: {p.forma_pago}</span>
                )}
              </div>
            </div>
          )))}
      </div>
    </div>
  );
}

// =========================================
// COMPONENTE MODAL DE ABM (CREAR/EDITAR)
// =========================================
function ClienteABMModal({ cliente, onClose, onSuccess }) {
  const isEditing = !!cliente;

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: cliente?.nombre || '',
    dni: cliente?.dni || '',
    telefono: cliente?.telefono || '',
    email: cliente?.email || '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('hermes_token');

      // Acá definimos si es POST (Crear) o PUT (Editar)
      // *NOTA: Asegurate de tener configurados estos endpoints en FastAPI*
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/admin/clientes/${cliente.dni}`
        : `${import.meta.env.VITE_API_URL}/admin/clientes`;

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al guardar el cliente');
      }

      toast.success(`Cliente ${isEditing ? 'actualizado' : 'creado'} correctamente`);
      onSuccess(); // Cierra el modal y recarga la lista
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al cliente ${cliente.nombre}? Esta acción no se puede deshacer.`)) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('hermes_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/clientes/${cliente.dni}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al eliminar el cliente');

      toast.success('Cliente eliminado correctamente');
      onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header del Modal */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-bold text-foreground">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Nombre Completo *</label>
            <Input
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">DNI *</label>
            <Input
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="Sin puntos ni espacios"
              required
              disabled={isEditing} // Generalmente el DNI no se edita porque es la clave única, si quieres que se edite, quita esto.
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Teléfono</label>
              <Input
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 2664123456"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          {/* Footer / Botones */}
          <div className="pt-4 flex items-center justify-between mt-2">
            {isEditing ? (
              <Button type="button" variant="destructive" size="icon" onClick={handleDelete} disabled={isLoading} title="Eliminar Cliente">
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : <div />} {/* Espaciador si no hay botón de borrar */}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}