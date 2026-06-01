import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function DashboardHeader({ nombre }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const firstName = nombre?.split(' ')[0] || 'Cliente';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-foreground text-sm tracking-tight">
            Hermes Asesores
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      <div>
        <p className="text-muted-foreground text-sm">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          Hola, {firstName} 👋
        </h1>
      </div>
    </div>
  );
}