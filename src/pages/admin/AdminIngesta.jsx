const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef } from 'react';

import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const COMPANIAS = ['RUS Seguros', 'Antártida Seguros', 'Sancor Seguros', 'Federación Patronal', 'MAPFRE', 'La Caja', 'Otra'];

export default function AdminIngesta() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [compania, setCompania] = useState('');
  const [status, setStatus] = useState(null); // null | 'uploading' | 'processing' | 'done' | 'error'
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const fileInputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !compania) {
      toast.error('Seleccioná un archivo y una compañía');
      return;
    }
    setStatus('uploading');
    setProgress(10);
    setLogs([]);
    addLog(`Subiendo archivo: ${selectedFile.name}…`);

    const { file_url } = await db.integrations.Core.UploadFile({ file: selectedFile });
    setProgress(30);
    addLog('Archivo subido correctamente.', 'success');
    addLog(`Procesando datos de ${compania}…`);
    setStatus('processing');

    const result = await db.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: 'object',
        properties: {
          clientes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dni: { type: 'string' },
                nombre: { type: 'string' },
                numero_poliza: { type: 'string' },
                tipo_seguro: { type: 'string' },
                vigencia_desde: { type: 'string' },
                vigencia_hasta: { type: 'string' },
                cuota_actual: { type: 'number' },
                patente: { type: 'string' },
                vehiculo: { type: 'string' }
              }
            }
          }
        }
      }
    });

    setProgress(70);

    if (result.status === 'error') {
      addLog(`Error al procesar: ${result.details}`, 'error');
      setStatus('error');
      setProgress(0);
      return;
    }

    const records = result.output?.clientes || [];
    addLog(`${records.length} registros extraídos. Integrando en base de datos…`);
    setProgress(85);

    let created = 0;
    let updated = 0;
    for (const rec of records) {
      if (!rec.dni) continue;
      const existing = await db.entities.Cliente.filter({ dni: rec.dni });
      const polizaNueva = {
        numero_poliza: rec.numero_poliza,
        compania,
        tipo_seguro: rec.tipo_seguro,
        vehiculo: rec.vehiculo || '',
        patente: rec.patente || '',
        vigencia_desde: rec.vigencia_desde,
        vigencia_hasta: rec.vigencia_hasta,
        cuota_actual: rec.cuota_actual || 0,
        estado: 'vigente',
        estado_pago: 'al_dia'
      };
      if (existing.length > 0) {
        const cliente = existing[0];
        const polizas = cliente.polizas || [];
        const idx = polizas.findIndex(p => p.numero_poliza === rec.numero_poliza);
        if (idx >= 0) polizas[idx] = { ...polizas[idx], ...polizaNueva };
        else polizas.push(polizaNueva);
        await db.entities.Cliente.update(cliente.id, { polizas });
        updated++;
      } else {
        await db.entities.Cliente.create({
          dni: rec.dni,
          nombre: rec.nombre || 'Sin nombre',
          polizas: [polizaNueva]
        });
        created++;
      }
    }

    setProgress(100);
    addLog(`✓ ${created} clientes nuevos · ${updated} actualizados.`, 'success');
    addLog('Ingesta completada.', 'success');
    setStatus('done');
    toast.success('Ingesta completada exitosamente');
  };

  const reset = () => {
    setSelectedFile(null);
    setCompania('');
    setStatus(null);
    setProgress(0);
    setLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Centro de Ingesta</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Subí archivos XLS o CSV de las compañías para actualizar la base de datos</p>
      </div>

      {/* Upload Zone */}
      <div className="bg-card border border-border rounded-xl p-6 mb-4">
        <div className="mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Compañía *
          </label>
          <select
            value={compania}
            onChange={e => setCompania(e.target.value)}
            disabled={!!status}
            className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Seleccioná la compañía…</option>
            {COMPANIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !status && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/20'
          } ${status ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="w-10 h-10 text-primary" />
              <p className="font-semibold text-foreground text-sm">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              {!status && (
                <button
                  onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Upload className="w-10 h-10" />
              <div>
                <p className="font-medium text-sm text-foreground">Arrastrá tu archivo aquí</p>
                <p className="text-xs mt-1">o hacé clic para seleccionar · XLS, XLSX, CSV</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress */}
        {status && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {status === 'uploading' ? 'Subiendo…' : status === 'processing' ? 'Procesando…' : status === 'done' ? 'Completado' : 'Error'}
              </span>
              <span className="text-xs font-semibold text-foreground">{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${status === 'error' ? 'bg-red-500' : status === 'done' ? 'bg-emerald-500' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !compania || !!status}
            className="flex-1 gap-2"
          >
            {status === 'uploading' || status === 'processing' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</>
            ) : (
              <><Upload className="w-4 h-4" /> Iniciar Ingesta</>
            )}
          </Button>
          {(status === 'done' || status === 'error') && (
            <Button variant="outline" onClick={reset}>Nueva carga</Button>
          )}
        </div>
      </div>

      {/* Log */}
      {logs.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Log de procesamiento</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {logs.map((l, i) => (
              <div key={i} className="flex items-start gap-2">
                {l.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />}
                {l.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
                {l.type === 'info' && <div className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /></div>}
                <p className={`text-xs ${l.type === 'error' ? 'text-red-600' : l.type === 'success' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  <span className="text-muted-foreground/50 mr-1">[{l.ts}]</span>{l.msg}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}