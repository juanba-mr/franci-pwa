import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminBottomNav from './AdminBottomNav';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar solo en desktop */}
      <div className="hidden md:flex">
        <AdminSidebar />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav solo en mobile */}
      <div className="md:hidden">
        <AdminBottomNav />
      </div>
    </div>
  );
}