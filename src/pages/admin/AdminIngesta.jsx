import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Loader2, Zap, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const COMPANIAS = ['RUS', 'ANTARTIDA', 'SANCOR', 'FEDERACION PATRONAL', 'MAPFRE', 'LA CAJA', 'OTRA'];

export default function AdminIngesta() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // Array para soportar múltiples archivos
  const [compania, setCompania] = useState('');
  const [autoConfirm, setAutoConfirm] = useState(false); // Toggle de auto-confirmación

  // status: null | 'uploading' | 'processing' | 'review' | 'saving' | 'done' | 'error'
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);

  // Variables para controlar la revisión manual de un lote de PDFs
  const [extractedQueue, setExtractedQueue] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const fileInputRef = useRef();

  const isLotePDF = selectedFiles.length > 0 && selectedFiles[0].name.toLowerCase().endsWith('.pdf');

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      if (files[0].name.toLowerCase().endsWith('.pdf')) setCompania('');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      if (files[0].name.toLowerCase().endsWith('.pdf')) setCompania('');
    }
  };

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  // Función reutilizable para enviar a la Base de Datos
  const guardarPolizaEnBD = async (datos) => {
    // 1. Extraemos el token de sesión guardado para validar contra FastAPI
    const token = localStorage.getItem('hermes_token');

    if (!token) {
      throw new Error('No se encontró una sesión activa. Por favor, volvé a iniciar sesión.');
    }

    // 2. Disparamos la petición HTTP inyectando las cabeceras de autorización
    const resSave = await fetch(`${import.meta.env.VITE_API_URL}/save-poliza`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // INTERNALS: Pasamos el token firmado para que el backend deduzca la sucursal del admin
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datos)
    });

    // 3. Control de filtros de red y excepciones del backend
    if (resSave.status === 401) {
      throw new Error('No tenés permisos para realizar esta operación o tu sesión expiró.');
    }

    if (!resSave.ok) {
      const errorData = await resSave.json();
      throw new Error(errorData.detail || 'Error al guardar la póliza en la base de datos');
    }

    return resSave.json();
  };

  // --- FUNCIÓN PRINCIPAL DE INGESTA ---
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Seleccioná al menos un archivo');
      return;
    }

    if (!isLotePDF && !compania) {
      toast.error('Seleccioná una compañía para procesar el Excel/CSV');
      return;
    }

    setStatus('uploading');
    setProgress(10);
    setLogs([]);
    addLog(`Iniciando ingesta de ${selectedFiles.length} archivo(s)…`);

    try {
      if (isLotePDF) {
        // ==========================================
        // FLUJO 1: LOTE DE PDFs (Procesamiento IA)
        // ==========================================
        let tempQueue = [];
        let procesadosExitoDirecto = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          addLog(`[${i + 1}/${selectedFiles.length}] Analizando contenido de: ${file.name}…`);

          try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/upload-poliza`, {
              method: 'POST',
              body: formData
            });

            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.detail || 'Error en el servidor al leer el PDF');
            }

            const responseData = await res.json();
            const datosIa = responseData.datos;

            if (autoConfirm) {
              // Toggle ON: Se guarda directamente
              addLog(`⚡ Modo Auto-confirmar: Guardando póliza de ${datosIa.nombre || 'Cliente'}…`);
              await guardarPolizaEnBD(datosIa);
              procesadosExitoDirecto++;
              addLog(`✓ Póliza guardada con éxito: ${file.name}`, 'success');
            } else {
              // Toggle OFF: Se guarda en la cola para revisar
              tempQueue.push(datosIa);
              addLog(`→ Póliza de ${datosIa.nombre || 'Cliente'} lista para revisión manual.`);
            }

          } catch (fileError) {
            addLog(`❌ Error en archivo ${file.name}: ${fileError.message}`, 'error');
          }
        }

        // Definimos qué pasa al terminar de procesar todo el lote de PDFs
        if (autoConfirm) {
          setProgress(100);
          addLog(`📊 Lote terminado. Éxito: ${procesadosExitoDirecto} de ${selectedFiles.length}.`, 'success');
          setStatus('done');
          toast.success('Ingesta automática completada.');
        } else {
          if (tempQueue.length === 0) {
            throw new Error('Ningún PDF pudo ser procesado correctamente.');
          }
          setExtractedQueue(tempQueue);
          setCurrentReviewIndex(0);
          setProgress(100);
          setStatus('review'); // Pasamos a la pantalla de revisión
          toast.success(`IA finalizada. Tenés ${tempQueue.length} pólizas para revisar.`);
        }

      } else {
        // ==========================================
        // FLUJO 2: EXCEL / CSV MASIVO
        // ==========================================
        const excelFile = selectedFiles[0];
        // Respetamos tu integración original de Base44
        const { file_url } = await db.integrations.Core.UploadFile({ file: excelFile });
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

  // --- CONFIRMACIÓN MANUAL EN CASCADA (Desde la vista de Revisión) ---
  const handleConfirmPDF = async () => {
    setStatus('saving');
    const itemActual = extractedQueue[currentReviewIndex];
    addLog(`Guardando póliza de ${itemActual.nombre} en la base de datos...`);

    try {
      await guardarPolizaEnBD(itemActual);
      addLog(`✓ Póliza de ${itemActual.nombre} guardada con éxito.`, 'success');

      // Si quedan más archivos en la cola, pasamos al siguiente
      if (currentReviewIndex + 1 < extractedQueue.length) {
        setCurrentReviewIndex(prev => prev + 1);
        setStatus('review');
        toast.success('Guardado. Pasando a la siguiente póliza.');
      } else {
        setStatus('done');
        toast.success('Se guardaron todas las pólizas del lote revisado.');
      }
    } catch (error) {
      addLog(`Error al guardar: ${error.message}`, 'error');
      setStatus('review'); // Si falla, nos quedamos en la misma vista para corregir
    }
  };

  const reset = () => {
    setSelectedFiles([]);
    setCompania('');
    setStatus(null);
    setProgress(0);
    setExtractedQueue([]);
    setCurrentReviewIndex(0);
    setLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ==========================================
  // RENDER: PANTALLA DE REVISIÓN EN CASCADA
  // ==========================================
  if (status === 'review' || status === 'saving') {
    const dataActual = extractedQueue[currentReviewIndex];

    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Revisar Datos Extraídos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Controlando póliza <b>{currentReviewIndex + 1} de {extractedQueue.length}</b>.
            </p>
          </div>
          <Button variant="outline" onClick={reset} disabled={status === 'saving'}><X className="w-4 h-4 mr-2" /> Cancelar lote</Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(dataActual).map((key) => (
              <div key={key}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  {key.replace('_', ' ')}
                </label>
                <input
                  type="text"
                  value={dataActual[key] || ''}
                  onChange={(e) => {
                    const copiaCola = [...extractedQueue];
                    copiaCola[currentReviewIndex] = { ...dataActual, [key]: e.target.value };
                    setExtractedQueue(copiaCola);
                  }}
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
            {status === 'saving' ? 'Guardando...' : `Confirmar y Guardar (${currentReviewIndex + 1}/${extractedQueue.length})`}
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
      <div className="mb-6 flex items-center gap-2">
        <Zap className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Centro de Ingesta</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Subí archivos XLS, CSV o múltiples PDFs</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-4 space-y-4">

        {/* EL TOGGLE HERMOSO: Visible antes de elegir, o si el lote es de PDFs */}
        {(!selectedFiles.length || isLotePDF) && (
          <div className="flex items-center justify-between p-4 bg-muted/40 border border-border rounded-xl">
            <div className="flex items-start gap-3">
              <Settings2 className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <Label htmlFor="auto-confirm" className="font-semibold text-sm block cursor-pointer">Auto-confirmar ingresos</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Sube las pólizas a la base de datos directo sin pasar por la revisión manual.</p>
              </div>
            </div>
            <Switch
              id="auto-confirm"
              checked={autoConfirm}
              onCheckedChange={setAutoConfirm}
              disabled={!!status}
            />
          </div>
        )}

        {/* SELECTOR DE COMPAÑÍA: Condicional */}
        {selectedFiles.length > 0 && isLotePDF ? (
          <div className="p-3 bg-primary/5 border border-primary/20 text-primary rounded-xl text-xs font-medium">
            ✨ La Inteligencia Artificial identificará la compañía automáticamente leyendo el contenido del PDF.
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Compañía {selectedFiles.length > 0 && !isLotePDF && '*'}
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
        )}

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !status && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/20'
            } ${status ? 'pointer-events-none opacity-60' : ''}`}
        >
          {/* input MULTIPLE para agarrar muchos archivos */}
          <input ref={fileInputRef} type="file" accept=".xls,.xlsx,.csv,.pdf" multiple onChange={handleFileChange} className="hidden" />

          {selectedFiles.length > 0 ? (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="w-10 h-10 text-primary" />
              <p className="font-semibold text-foreground text-sm">
                {selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} archivos seleccionados`}
              </p>
              {!status && (
                <button onClick={e => { e.stopPropagation(); reset(); }} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Upload className="w-10 h-10" />
              <div>
                <p className="font-medium text-sm text-foreground">Arrastrá tus archivos aquí</p>
                <p className="text-xs mt-1">Soporta selección de lote (XLS, XLSX, CSV o PDFs)</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || (!isLotePDF && !compania) || !!status} className="w-full gap-2">
            {status === 'uploading' || status === 'processing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</> : <><Upload className="w-4 h-4" /> Iniciar Ingesta</>}
          </Button>
          {(status === 'done' || status === 'error') && (
            <Button variant="outline" onClick={reset}>Nueva carga</Button>
          )}
        </div>
      </div>

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