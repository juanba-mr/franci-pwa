import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Home, Heart, Briefcase, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import PaymentStatusBadge from './PaymentStatusBadge';
import VigenciaBadge from './VigenciaBadge';

const tipoIcons = {
  'RCA': Car,
  'Todo Riesgo': Car,
  'Terceros Completo': Car,
  'Hogar': Home,
  'Vida': Heart,
  'AP Laboral': Briefcase,
};

export default function PolicyCard({ poliza, index, dni }) {
  const navigate = useNavigate();
  const Icon = tipoIcons[poliza.tipo_seguro] || Car;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onClick={() => navigate(`/poliza/${index}?dni=${dni}`)}
      className="bg-card rounded-2xl p-4 shadow-sm border border-border cursor-pointer active:scale-[0.98] transition-transform duration-150"
    >
      <div className="flex items-start gap-3">
        {/* Company icon area */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary leading-tight text-center">
            {poliza.compania?.substring(0, 3).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {poliza.compania}
            </p>
            <VigenciaBadge estado={poliza.estado} />
          </div>

          <p className="font-semibold text-foreground mt-1 text-sm">
            Póliza N° {poliza.numero_poliza}
          </p>

          {poliza.vehiculo && (
            <div className="flex items-center gap-2 mt-1.5">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {poliza.vehiculo}
              </span>
              {poliza.patente && (
                <span className="text-xs font-mono font-semibold bg-muted px-1.5 py-0.5 rounded text-foreground">
                  {poliza.patente}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <PaymentStatusBadge status={poliza.estado_pago} />
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}