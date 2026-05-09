import React, { useState } from 'react';
import { CheckCircle2, XCircle, Settings2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API_CONFIGS = [
  {
    id: 'rus',
    name: 'RUS Seguros',
    description: 'API REST para consulta de pólizas y cuotas',
    docUrl: 'https://rus.com.ar',
    fields: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'base_url', label: 'Base URL', type: 'text' }]
  },
  {
    id: 'antartida',
    name: 'Antártida Seguros',
    description: 'API de integración para datos de producción',
    docUrl: 'https://antartida.com.ar',
    fields: [{ key: 'user', label: 'Usuario', type: 'text' }, { key: 'password', label: 'Contraseña', type: 'password' }, { key: 'base_url', label: 'Base URL', type: 'text' }]
  },
  {
    id: 'sancor',
    name: 'Sancor Seguros',
    description: 'Integración via credenciales de portal',
    docUrl: 'https://sancorseguros.com.ar',
    fields: [{ key: 'user', label: 'Usuario', type: 'text' }, { key: 'token', label: 'Token', type: 'password' }]
  },
  {
    id: 'fedpat',
    name: 'Federación Patronal',
    description: 'API para consulta de endosos y coberturas',
    docUrl: 'https://fedpat.com.ar',
    fields: [{ key: 'api_key', label: 'API Key', type: 'password' }, { key: 'codigo_productor', label: 'Código Productor', type: 'text' }]
  },
];

export default function AdminConfiguracion() {
  const [configs, setConfigs] = useState(() => {
    const saved = {};
    API_CONFIGS.forEach(c => { saved[c.id] = {}; });
    return saved;
  });
  const [showFields, setShowFields] = useState({});
  const [savedStatus, setSavedStatus] = useState({});

  const handleChange = (apiId, key, value) => {
    setConfigs(prev => ({ ...prev, [apiId]: { ...prev[apiId], [key]: value } }));
  };

  const handleSave = (apiId) => {
    setSavedStatus(prev => ({ ...prev, [apiId]: true }));
    toast.success('Configuración guardada (simulación local)');
    setTimeout(() => setSavedStatus(prev => ({ ...prev, [apiId]: false })), 3000);
  };

  const toggleShow = (key) => {
    setShowFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isConfigured = (apiId) => {
    const conf = configs[apiId] || {};
    return Object.values(conf).some(v => !!v);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Configuración de APIs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestioná las conexiones con las compañías de seguros</p>
      </div>

      <div className="space-y-4">
        {API_CONFIGS.map(api => (
          <div key={api.id} className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{api.name}</p>
                  <p className="text-xs text-muted-foreground">{api.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConfigured(api.id) ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configurado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <XCircle className="w-3.5 h-3.5" /> Sin configurar
                  </span>
                )}
                <a href={api.docUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Fields */}
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {api.fields.map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">{field.label}</label>
                    <div className="relative">
                      <Input
                        type={field.type === 'password' && !showFields[`${api.id}-${field.key}`] ? 'password' : 'text'}
                        value={configs[api.id]?.[field.key] || ''}
                        onChange={e => handleChange(api.id, field.key, e.target.value)}
                        placeholder={field.type === 'password' ? '••••••••••••' : `Ingresá ${field.label.toLowerCase()}`}
                        className="h-9 text-sm pr-9"
                      />
                      {field.type === 'password' && (
                        <button
                          type="button"
                          onClick={() => toggleShow(`${api.id}-${field.key}`)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showFields[`${api.id}-${field.key}`] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => handleSave(api.id)}
                  className={savedStatus[api.id] ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                >
                  {savedStatus[api.id] ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Guardado</> : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Las credenciales se guardan localmente. Integrá con un backend seguro para producción.
      </p>
    </div>
  );
}