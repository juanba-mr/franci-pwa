import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const COMPANIAS = ['RUS', 'ANTARTIDA', 'SANCOR', 'FEDERACION PATRONAL', 'MAPFRE', 'LA CAJA', 'OTRA'];

export default function AdminIngesta() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [compania, setCompania] = useState('');

  // status: null | 'uploading' | 'processing' | 'review' | 'saving' | 'done' | 'error'
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [extractedData, setExtractedData] = useState(null); // Solo se usa para PDF

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

  // --- FUNCIÓN PRINCIPAL DE INGESTA ---
  const handleUpload = async () => {
    if (!selectedFile || !compania) {
      toast.error('Seleccioná un archivo y una compañía');
      return;
    }

    setStatus('uploading');
    setProgress(10);
    setLogs([]);
    addLog(`Iniciando ingesta: ${selectedFile.name}…`);

    const isPDF = selectedFile.name.toLowerCase().endsWith('.pdf');

    try {
      if (isPDF) {
        // ==========================================
        // FLUJO 1: PDF (Requiere revisión humana)
        // ==========================================
        addLog(`Analizando PDF con Inteligencia Artificial…`);
        setProgress(50);

        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await fetch(`${import.meta.env.VITE_API_URL}/upload-poliza`, {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Error en el servidor al leer el PDF');
        }

        const responseData = await res.json();

        // Guardamos los datos extraídos y pasamos a la pantalla de revisión
        setExtractedData(responseData.datos);
        setProgress(100);
        setStatus('review'); // <--- ACÁ CORTA EL FLUJO Y MUESTRA LA PANTALLA
        toast.success("PDF procesado. Por favor revisá los datos.");

      } else {
        // ==========================================
        // FLUJO 2: EXCEL / CSV (Directo, sin revisión)
        // ==========================================
        const { file_url } = await db.integrations.Core.UploadFile({ file: selectedFile });
        setProgress(30);
        addLog('Archivo subido. Procesando Excel masivo…');
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
                    dni: { type: 'string' }, nombre: { type: 'string' }, numero_poliza: { type: 'string' },
                    tipo_seguro: { type: 'string' }, vigencia_desde: { type: 'string' }, vigencia_hasta: { type: 'string' },
                    patente: { type: 'string' }, vehiculo: { type: 'string' }
                  }
                }
              }
            }
          }
        });

        if (result.status === 'error') throw new Error(result.details);
        const records = result.output?.clientes || [];

        setProgress(70);
        addLog(`${records.length} registro(s) encontrados. Guardando en base de datos…`);

        // Guardamos todo el Excel en la BD usando tu endpoint
        let procesados = 0;
        for (const rec of records) {
          if (!rec.dni) continue;
          const resSave = await fetch(`${import.meta.env.VITE_API_URL}/save-poliza`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: rec.nombre || 'Sin nombre', dni: String(rec.dni), poliza: String(rec.numero_poliza),
              tipo_seguro: rec.tipo_seguro || 'Automotor', patente: rec.patente || '', vehiculo: rec.vehiculo || '',
              vigencia_desde: rec.vigencia_desde, vigencia_hasta: rec.vigencia_hasta, compania: compania
            })
          });
          if (resSave.ok) procesados++;
        }

        setProgress(100);
        addLog(`✓ ${procesados} póliza(s) guardada(s) en Neon DB.`, 'success');
        setStatus('done');
        toast.success('Ingesta de Excel completada');
      }

    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
      setStatus('error');
      setProgress(0);
    }
  };

  // --- FUNCIÓN PARA GUARDAR EL PDF DESPUÉS DE REVISARLO ---
  const handleConfirmPDF = async () => {
    setStatus('saving');
    addLog(`Guardando póliza de ${extractedData.nombre} en la base de datos...`);

    try {
      const resSave = await fetch(`${import.meta.env.VITE_API_URL}/save-poliza`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extractedData,
          compania: compania
        })
      });

      if (!resSave.ok) {
        const errorData = await resSave.json();
        throw new Error(errorData.detail || 'Error al guardar la póliza');
      }

      addLog(`✓ Póliza guardada con éxito en Neon DB.`, 'success');
      setStatus('done');
      toast.success('Póliza guardada correctamente');
    } catch (error) {
      addLog(`Error al guardar: ${error.message}`, 'error');
      setStatus('error'); // Vuelve al error, pero no pierde los datos
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setCompania('');
    setStatus(null);
    setProgress(0);
    setLogs([]);
    setExtractedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ==========================================
  // RENDER: PANTALLA DE REVISIÓN (SOLO PDF)
  // ==========================================
  if (status === 'review' || status === 'saving') {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Revisar Datos Extraídos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Controlá los datos que leyó la IA antes de subirlos.</p>
          </div>
          <Button variant="outline" onClick={reset} disabled={status === 'saving'}><X className="w-4 h-4 mr-2" /> Cancelar</Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(extractedData).map((key) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  {key.replace('_', ' ')}
                </label>
                <input
                  type="text"
                  value={extractedData[key]}
                  onChange={(e) => setExtractedData({ ...extractedData, [key]: e.target.value })}
                  disabled={status === 'saving'}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={handleConfirmPDF}
            disabled={status === 'saving'}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {status === 'saving' ? 'Guardando en la base de datos...' : 'Confirmar y Guardar Póliza'}
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: PANTALLA PRINCIPAL DE INGESTA
  // ==========================================
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Centro de Ingesta</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Subí archivos XLS, CSV o PDF de las compañías</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-4">
        <div className="mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Compañía *</label>
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

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !status && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/20'
            } ${status ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input ref={fileInputRef} type="file" accept=".xls,.xlsx,.csv,.pdf" onChange={handleFileChange} className="hidden" />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="w-10 h-10 text-primary" />
              <p className="font-semibold text-foreground text-sm">{selectedFile.name}</p>
              {!status && (
                <button onClick={e => { e.stopPropagation(); setSelectedFile(null); }} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Upload className="w-10 h-10" />
              <div>
                <p className="font-medium text-sm text-foreground">Arrastrá tu archivo aquí</p>
                <p className="text-xs mt-1">o hacé clic para seleccionar · XLS, XLSX, CSV o PDF</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleUpload} disabled={!selectedFile || !compania || !!status} className="flex-1 gap-2">
            {status === 'uploading' || status === 'processing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</> : <><Upload className="w-4 h-4" /> Iniciar Ingesta</>}
          </Button>
          {(status === 'done' || status === 'error') && (
            <Button variant="outline" onClick={reset}>Nueva carga</Button>
          )}
        </div>
      </div>

      {logs.length > 0 && (
        /* Acá va la caja de los LOGS exactamente igual a la tuya (la mantuve para que quede el historial) */
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