import * as React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Breadcrumbs } from './Breadcrumbs';
import { useInventoryStore } from '@/store';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';

export function Layout() {
  const currentUser = useInventoryStore((state) => state.currentUser);
  const theme = useInventoryStore((state) => state.theme);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  // Sync theme class
  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auth Guard
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Navbar setMobileOpen={setMobileSidebarOpen} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto px-6 md:px-8 py-6 no-scrollbar">
          <Breadcrumbs />

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton duration={4000} />
    </div>
  );
}
