import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { RoleGuard } from '@/components/RoleGuard';

// Pages
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import OTPVerification from '@/pages/OTPVerification';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Inventory from '@/pages/Inventory';
import Warehouses from '@/pages/Warehouses';
import PurchaseOrders from '@/pages/PurchaseOrders';
import Suppliers from '@/pages/Suppliers';
import Forecasting from '@/pages/Forecasting';
import Analytics from '@/pages/Analytics';
import Alerts from '@/pages/Alerts';
import Users from '@/pages/Users';
import AuditLogs from '@/pages/AuditLogs';
import Settings from '@/pages/Settings';
import Reports from '@/pages/Reports';
import WarehouseTransfers from '@/pages/WarehouseTransfers';
import ReceivePurchaseOrders from '@/pages/ReceivePurchaseOrders';

export const router = createBrowserRouter([
  // Public Routes
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/otp-verification', element: <OTPVerification /> },
  { path: '/reset-password', element: <ResetPassword /> },

  // Protected Routes (wrapped in Layout which acts as auth guard)
  {
    element: <Layout />,
    children: [
      // Dashboard — all roles
      { path: '/dashboard', element: <Dashboard /> },

      // Products — ADMIN, MANAGER, STAFF
      {
        path: '/products',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
            <Products />
          </RoleGuard>
        ),
      },

      // Inventory — ADMIN, MANAGER, STAFF
      {
        path: '/inventory',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'STAFF']}>
            <Inventory />
          </RoleGuard>
        ),
      },

      // Warehouses — ADMIN, MANAGER
      {
        path: '/warehouses',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <Warehouses />
          </RoleGuard>
        ),
      },

      // Purchase Orders — ADMIN, MANAGER
      {
        path: '/purchase-orders',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <PurchaseOrders />
          </RoleGuard>
        ),
      },

      // Suppliers — ADMIN, MANAGER
      {
        path: '/suppliers',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <Suppliers />
          </RoleGuard>
        ),
      },

      // Forecasting — ADMIN, MANAGER, ANALYST
      {
        path: '/forecasting',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'ANALYST']}>
            <Forecasting />
          </RoleGuard>
        ),
      },

      // Analytics — ADMIN, ANALYST
      {
        path: '/analytics',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'ANALYST']}>
            <Analytics />
          </RoleGuard>
        ),
      },

      // Alerts — ADMIN, MANAGER
      {
        path: '/alerts',
        element: (
          <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
            <Alerts />
          </RoleGuard>
        ),
      },

      // Users — ADMIN only
      {
        path: '/users',
        element: (
          <RoleGuard allowedRoles={['ADMIN']}>
            <Users />
          </RoleGuard>
        ),
      },

      // Audit Logs — ADMIN only
      {
        path: '/audit-logs',
        element: (
          <RoleGuard allowedRoles={['ADMIN']}>
            <AuditLogs />
          </RoleGuard>
        ),
      },

      // Settings — ADMIN only
      {
        path: '/settings',
        element: (
          <RoleGuard allowedRoles={['ADMIN']}>
            <Settings />
          </RoleGuard>
        ),
      },

      // Reports — ANALYST only
      {
        path: '/reports',
        element: (
          <RoleGuard allowedRoles={['ANALYST']}>
            <Reports />
          </RoleGuard>
        ),
      },

      // Warehouse Transfers — STAFF only
      {
        path: '/warehouse-transfers',
        element: (
          <RoleGuard allowedRoles={['STAFF']}>
            <WarehouseTransfers />
          </RoleGuard>
        ),
      },

      // Receive Purchase Orders — STAFF only
      {
        path: '/receive-orders',
        element: (
          <RoleGuard allowedRoles={['STAFF']}>
            <ReceivePurchaseOrders />
          </RoleGuard>
        ),
      },

      // Catch-all redirect to dashboard when authenticated, layout will redirect to /login if not.
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
