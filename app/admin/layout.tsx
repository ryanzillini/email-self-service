'use client';

import { usePathname } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { Sidebar } from '../components/admin/Sidebar';
import { Header } from '../components/admin/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Exclude both dashboard and settings pages from the standard layout
  const isCustomPage = pathname === '/admin/dashboard' || pathname === '/admin/settings';
  
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      {isCustomPage ? (
        // For custom pages, just render the children without the layout
        <>{children}</>
      ) : (
        // For other admin pages, use the standard admin layout
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
              {children}
            </main>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
} 