const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Loader2, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// DNIs de empleados mock (en producción reemplazar con entidad real)
const EMPLEADOS_MOCK = ['99000001', '99000002', '99000003'];

export default function Ingreso() {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!dni.trim()) {
      toast.error('Ingresá tu número de DNI');
      return;
    }

    // Verificar si es empleado
    if (EMPLEADOS_MOCK.includes(dni.trim())) {
      navigate('/admin');
      return;
    }

    setLoading(true);
    const clientes = await db.entities.Cliente.filter({ dni: dni.trim() });
    setLoading(false);
    if (clientes.length === 0) {
      toast.error('No encontramos un cliente con ese DNI');
      return;
    }
    navigate(`/dashboard?dni=${dni.trim()}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent" />
      <div className="absolute top-20 right-[-50px] w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-32 left-[-30px] w-32 h-32 rounded-full bg-primary/8 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-sm z-10"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6"
          >
            <Shield className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            Hermes
          </h1>
          <p className="text-sm text-primary font-semibold tracking-widest uppercase mt-1">
            Asesores de Seguros
          </p>
          <p className="text-muted-foreground text-sm mt-4">
            Consultá tus pólizas de forma rápida y segura
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Número de DNI
            </label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Ej: 30456789"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
              className="h-14 text-lg text-center font-medium bg-card border-border rounded-xl tracking-widest placeholder:tracking-normal placeholder:text-sm"
              maxLength={10}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !dni.trim()}
            className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Ingresar
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Si no podés acceder, contactá a tu productor
        </p>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground/50">
            Empleados: usá tu DNI de acceso interno
          </p>
        </div>
      </motion.div>
    </div>
  );
}