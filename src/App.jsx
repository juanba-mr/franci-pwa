import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';

import Ingreso from '@/pages/Ingreso';
import Dashboard from '@/pages/Dashboard';
import PolicyDetail from '@/pages/PolicyDetail';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminClientes from '@/pages/admin/AdminClientes';
import AdminRenovaciones from '@/pages/admin/AdminRenovaciones';
import AdminIngesta from '@/pages/admin/AdminIngesta';
import AdminConfiguracion from '@/pages/admin/AdminConfiguracion';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<Ingreso />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/poliza/:index" element={<PolicyDetail />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="clientes" element={<AdminClientes />} />
              <Route path="renovaciones" element={<AdminRenovaciones />} />
              <Route path="ingesta" element={<AdminIngesta />} />
              <Route path="configuracion" element={<AdminConfiguracion />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App