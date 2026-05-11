import React, { useState } from 'react';
import { Phone, ChevronDown, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmergencySection({ polizas }) {
  const [open, setOpen] = useState(false);

  // Filtramos las pólizas para obtener solo las que tienen teléfono de asistencia
  const asistencias = polizas
    ?.filter(p => p.asistencia_telefono)
    ?.map(p => ({ compania: p.compania, telefono: p.asistencia_telefono })) || [];

  // Si el cliente no tiene pólizas con asistencia, no mostramos el botón
  if (asistencias.length === 0) return null;

  return (
    <div className="px-5 mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform duration-150"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">Auxilio Mecánico</p>
            <p className="text-xs text-muted-foreground">Asistencia 24hs</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {asistencias.map((a, i) => (
                <a
                  key={i}
                  href={`tel:${a.telefono.replace(/\D/g, '')}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3.5 active:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Asistencia {a.compania}</p>
                    <p className="font-semibold text-foreground text-sm">{a.telefono}</p>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}