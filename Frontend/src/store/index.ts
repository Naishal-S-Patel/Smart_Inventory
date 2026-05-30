import { create } from 'zustand';
import { User, Product, Warehouse, Supplier, PurchaseOrder, Alert, Transaction, ProductForecast, AnalyticsSummary, AuditLogEntry, WarehouseTransfer, Report, AlertType, AlertSeverity } from '../types';
import { mockProducts, mockWarehouses, mockSuppliers, mockPurchaseOrders, mockAlerts, mockTransactions, mockForecasts, mockAnalyticsSummary, mockAuditLogs, mockWarehouseTransfers, mockReports, mockUsers } from '../mock/data';
import { toast } from 'sonner';

interface InventoryStore {
  // Auth State
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: User['role']) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  bulkUpdateStock: (productIds: string[], warehouseId: string, adjustment: number) => void;

  // Warehouses
  warehouses: Warehouse[];
  updateWarehouseCapacity: (id: string, usedCapacity: number) => void;

  // Suppliers
  suppliers: Supplier[];
  updateSupplierScore: (id: string, rating: number, reliability: number) => void;

  // Purchase Orders
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'timeline' | 'totalAmount'> & { items: { productId: string; quantity: number }[] }) => void;
  approvePurchaseOrder: (id: string, approvedBy: string) => void;
  receivePurchaseOrder: (id: string) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status'], note?: string) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'status'>) => void;
  updateAlertStatus: (id: string, status: Alert['status'], notes?: string) => void;
  clearAllAlerts: () => void;

  // Transactions
  transactions: Transaction[];
  addTransaction: (txn: Omit<Transaction, 'id' | 'timestamp'>) => void;

  // Forecasts & Analytics
  forecasts: ProductForecast[];
  analyticsSummary: AnalyticsSummary;
  triggerModelTraining: (productId: string) => Promise<void>;

  // Audit Logs
  auditLogs: AuditLogEntry[];

  // Warehouse Transfers
  warehouseTransfers: WarehouseTransfer[];

  // Reports
  reports: Report[];

  // Users list (for admin user management)
  users: User[];

  // Theme configuration
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Simulation Status
  isSimulating: boolean;
  toggleSimulation: () => void;
  runSimulationTick: () => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => {
  // Default admin session
  const defaultUser: User = {
    id: 'user-1',
    name: 'Alex Mercer',
    email: 'a.mercer@smartinventory.com',
    role: 'ADMIN',
    department: 'IT Operations',
    status: 'active',
  };

  return {
    currentUser: defaultUser,
    login: async (email, _password) => {
      await new Promise((r) => setTimeout(r, 600));
      // Map email to user persona
      const userMap: Record<string, { name: string; role: User['role']; department: string }> = {
        'a.mercer@smartinventory.com': { name: 'Alex Mercer', role: 'ADMIN', department: 'IT Operations' },
        's.jenkins@smartinventory.com': { name: 'Sarah Jenkins', role: 'MANAGER', department: 'Supply Chain' },
        'm.torres@smartinventory.com': { name: 'Mike Torres', role: 'STAFF', department: 'Warehouse Ops' },
        'c.oswald@smartinventory.com': { name: 'Clara Oswald', role: 'ANALYST', department: 'Business Intelligence' },
      };
      const persona = userMap[email] || { name: 'Demo User', role: 'STAFF' as const, department: 'General' };
      const user: User = {
        id: `user-${Math.floor(Math.random() * 1000)}`,
        name: persona.name,
        email,
        role: persona.role,
        department: persona.department,
        status: 'active',
      };
      set({ currentUser: user });
      toast.success(`Welcome back, ${user.name}`);
      return true;
    },
    logout: () => {
      set({ currentUser: null });
      toast.info('Signed out successfully');
    },
    setRole: (role) => {
      const user = get().currentUser;
      if (user) {
        const roleNames: Record<string, { name: string; department: string }> = {
          ADMIN: { name: 'Alex Mercer', department: 'IT Operations' },
          MANAGER: { name: 'Sarah Jenkins', department: 'Supply Chain' },
          STAFF: { name: 'Mike Torres', department: 'Warehouse Ops' },
          ANALYST: { name: 'Clara Oswald', department: 'Business Intelligence' },
        };
        const persona = roleNames[role] || { name: user.name, department: user.department };
        set({ currentUser: { ...user, role, name: persona.name, department: persona.department } });
        toast.info(`Switched to ${role} role`);
      }
    },

    // Products
    products: mockProducts,
    addProduct: (productData) => {
      const id = `prod-${get().products.length + 1}`;
      const newProduct: Product = {
        ...productData,
        id,
        lastUpdated: new Date().toISOString()
      };
      set((state) => ({ products: [newProduct, ...state.products] }));
      toast.success(`Product ${newProduct.name} created successfully.`);
    },
    updateProduct: (id, updates) => {
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString() } : p
        )
      }));
    },
    deleteProduct: (id) => {
      set((state) => ({
        products: state.products.filter((p) => p.id !== id)
      }));
      toast.warning('Product was deleted from records.');
    },
    bulkUpdateStock: (productIds, warehouseId, adjustment) => {
      set((state) => {
        const updatedProducts = state.products.map((p) => {
          if (productIds.includes(p.id)) {
            const currentWhStock = p.warehouseStockMap[warehouseId] || 0;
            const newWhStock = Math.max(0, currentWhStock + adjustment);
            const warehouseStockMap = { ...p.warehouseStockMap, [warehouseId]: newWhStock };
            const currentStock = Object.values(warehouseStockMap).reduce((sum, q) => sum + q, 0);
            
            let status: Product['status'] = 'In Stock';
            if (currentStock === 0) status = 'Out of Stock';
            else if (currentStock <= p.reorderPoint) status = 'Low Stock';
            else if (currentStock >= p.maxStock) status = 'Overstocked';

            return { ...p, warehouseStockMap, currentStock, status, lastUpdated: new Date().toISOString() };
          }
          return p;
        });
        return { products: updatedProducts };
      });
      toast.success(`Bulk stock adjustment of ${adjustment > 0 ? '+' : ''}${adjustment} completed.`);
    },

    // Warehouses
    warehouses: mockWarehouses,
    updateWarehouseCapacity: (id, usedCapacity) => {
      set((state) => ({
        warehouses: state.warehouses.map((wh) => {
          if (wh.id === id) {
            const status = usedCapacity >= wh.capacity ? 'full' : wh.status;
            return { ...wh, usedCapacity, status };
          }
          return wh;
        })
      }));
    },

    // Suppliers
    suppliers: mockSuppliers,
    updateSupplierScore: (id, rating, reliability) => {
      set((state) => ({
        suppliers: state.suppliers.map((s) =>
          s.id === id ? { ...s, rating, reliabilityScore: reliability } : s
        )
      }));
    },

    // Purchase Orders
    purchaseOrders: mockPurchaseOrders,
    addPurchaseOrder: (poData) => {
      const id = `po-${1000 + get().purchaseOrders.length + 1}`;
      const orderNumber = `PO-2026-${String(get().purchaseOrders.length + 1).padStart(3, '0')}`;
      
      const items = poData.items.map(item => {
        const p = get().products.find(prod => prod.id === item.productId);
        const name = p ? p.name : 'Unknown Product';
        const cost = p ? p.cost : 10.0;
        return {
          productId: item.productId, name, quantity: item.quantity,
          unitCost: cost, totalCost: parseFloat((cost * item.quantity).toFixed(2))
        };
      });

      const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

      const newPO: PurchaseOrder = {
        id, orderNumber, supplierId: poData.supplierId, items, status: 'Draft',
        totalAmount, orderDate: new Date().toISOString(),
        timeline: [{ status: 'Draft', date: new Date().toISOString(), note: 'Purchase Order generated in Draft mode.' }]
      };

      set((state) => ({ purchaseOrders: [newPO, ...state.purchaseOrders] }));
      toast.success(`Purchase Order ${orderNumber} created.`);
    },
    approvePurchaseOrder: (id, approvedBy) => {
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((po) => {
          if (po.id === id) {
            return { ...po, status: 'Approved' as const, approvedBy,
              timeline: [...po.timeline, { status: 'Approved' as const, date: new Date().toISOString(), note: `Approved by ${approvedBy}` }]
            };
          }
          return po;
        })
      }));
      toast.success(`Purchase Order approved.`);
    },
    updatePurchaseOrderStatus: (id, status, note) => {
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((po) => {
          if (po.id === id) {
            return { ...po, status,
              timeline: [...po.timeline, { status, date: new Date().toISOString(), note: note || `Status updated to ${status}` }]
            };
          }
          return po;
        })
      }));
      toast.info(`Purchase Order status: ${status}`);
    },
    receivePurchaseOrder: (id) => {
      const po = get().purchaseOrders.find((p) => p.id === id);
      if (!po || po.status === 'Received') return;

      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((p) => {
          if (p.id === id) {
            return { ...p, status: 'Received' as const, deliveryDate: new Date().toISOString(),
              timeline: [...p.timeline, { status: 'Received' as const, date: new Date().toISOString(), note: 'Shipment received and verified.' }]
            };
          }
          return p;
        })
      }));

      po.items.forEach((item) => {
        const product = get().products.find((p) => p.id === item.productId);
        if (product) {
          const currentWhStock = product.warehouseStockMap['wh-north'] || 0;
          const updatedWarehouseMap = { ...product.warehouseStockMap, 'wh-north': currentWhStock + item.quantity };
          const totalStock = Object.values(updatedWarehouseMap).reduce((sum, q) => sum + q, 0);
          let status: Product['status'] = 'In Stock';
          if (totalStock >= product.maxStock) status = 'Overstocked';

          get().updateProduct(item.productId, { warehouseStockMap: updatedWarehouseMap, currentStock: totalStock, status });
          get().addTransaction({ type: 'inbound', productId: item.productId, productName: item.name, quantity: item.quantity, source: 'Supplier Shipment', destination: 'North Central Hub', performedBy: 'System Receiver' });
        }
      });

      toast.success(`Purchase Order ${po.orderNumber} stock received.`);
    },

    // Alerts
    alerts: mockAlerts,
    addAlert: (alertData) => {
      const id = `alt-${get().alerts.length + 1}`;
      const newAlert: Alert = { ...alertData, id, timestamp: new Date().toISOString(), status: 'unread' };
      set((state) => ({ alerts: [newAlert, ...state.alerts] }));
    },
    updateAlertStatus: (id, status, notes) => {
      set((state) => ({
        alerts: state.alerts.map((a) => (a.id === id ? { ...a, status, notes } : a))
      }));
      toast.success(`Alert status updated to ${status}`);
    },
    clearAllAlerts: () => {
      set({ alerts: [] });
      toast.info('Alert console cleared');
    },

    // Transactions
    transactions: mockTransactions,
    addTransaction: (txnData) => {
      const id = `txn-${500 + get().transactions.length + 1}`;
      const newTxn: Transaction = { ...txnData, id, timestamp: new Date().toISOString() };
      set((state) => ({ transactions: [newTxn, ...state.transactions] }));
    },

    // Forecasting & Analytics
    forecasts: mockForecasts,
    analyticsSummary: mockAnalyticsSummary,
    triggerModelTraining: async (productId) => {
      toast.loading(`Re-training Prophet & XGBoost models...`, { id: 'train' });
      await new Promise((r) => setTimeout(r, 2000));
      
      set((state) => {
        const forecasts = state.forecasts.map(f => {
          if (f.productId === productId) {
            const nextAccuracy = parseFloat(Math.min(99.8, f.accuracy + (Math.random() * 0.8)).toFixed(2));
            return { ...f, accuracy: nextAccuracy,
              modelHealth: { ...f.modelHealth,
                rmse: parseFloat(Math.max(1.0, f.modelHealth.rmse * 0.9).toFixed(2)),
                mae: parseFloat(Math.max(0.8, f.modelHealth.mae * 0.9).toFixed(2)),
                lastTrained: new Date().toLocaleDateString()
              }
            };
          }
          return f;
        });
        return { forecasts };
      });
      
      toast.dismiss('train');
      toast.success(`Model training complete! Forecast accuracy improved.`);
    },

    // Audit Logs
    auditLogs: mockAuditLogs,

    // Warehouse Transfers
    warehouseTransfers: mockWarehouseTransfers,

    // Reports
    reports: mockReports,

    // Users
    users: mockUsers as User[],

    // Theme state
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    toggleTheme: () => {
      const nextTheme = get().theme === 'light' ? 'dark' : 'light';
      set({ theme: nextTheme });
      localStorage.setItem('theme', nextTheme);
    },

    // Real-Time Simulator
    isSimulating: false,
    toggleSimulation: () => {
      const nextSimulating = !get().isSimulating;
      set({ isSimulating: nextSimulating });
      if (nextSimulating) toast.success('Live simulator started');
      else toast.info('Live simulator stopped');
    },
    runSimulationTick: () => {
      const activeProducts = get().products.filter(p => p.currentStock > 5);
      if (activeProducts.length === 0) return;

      const randomProduct = activeProducts[Math.floor(Math.random() * activeProducts.length)];
      const warehousesWithStock = Object.keys(randomProduct.warehouseStockMap).filter(
        whId => randomProduct.warehouseStockMap[whId] > 0
      );

      if (warehousesWithStock.length === 0) return;
      const whId = warehousesWithStock[Math.floor(Math.random() * warehousesWithStock.length)];
      
      const rand = Math.random();
      if (rand < 0.70) {
        // Outbound sale
        const maxSale = Math.min(10, randomProduct.warehouseStockMap[whId]);
        const qty = Math.floor(1 + Math.random() * maxSale);
        
        const updatedWarehouseMap = { ...randomProduct.warehouseStockMap, [whId]: randomProduct.warehouseStockMap[whId] - qty };
        const totalStock = Object.values(updatedWarehouseMap).reduce((sum, q) => sum + q, 0);
        
        let status: Product['status'] = 'In Stock';
        if (totalStock === 0) status = 'Out of Stock';
        else if (totalStock <= randomProduct.reorderPoint) status = 'Low Stock';

        set((state) => ({
          products: state.products.map(p =>
            p.id === randomProduct.id 
              ? { ...p, warehouseStockMap: updatedWarehouseMap, currentStock: totalStock, status, lastUpdated: new Date().toISOString() } 
              : p
          )
        }));

        const targetWh = get().warehouses.find(w => w.id === whId);
        get().addTransaction({
          type: 'outbound', productId: randomProduct.id, productName: randomProduct.name,
          quantity: qty, source: targetWh ? targetWh.name : 'Unknown Warehouse',
          destination: `B2B Order #${Math.floor(8000 + Math.random() * 2000)}`, performedBy: 'Sales API Integration'
        });

        toast.info(`${qty}× ${randomProduct.name} shipped from ${targetWh?.name || whId}`, { duration: 3000 });

        if (status === 'Low Stock' && randomProduct.status !== 'Low Stock') {
          get().addAlert({
            type: 'low_stock', severity: 'critical', productId: randomProduct.id,
            productName: randomProduct.name,
            message: `Stock critical: ${randomProduct.name} down to ${totalStock} units (reorder point: ${randomProduct.reorderPoint}).`,
            warehouseId: whId
          });
        }
      } else if (rand < 0.90 && get().warehouses.length > 1) {
        // Transfer
        const otherWh = get().warehouses.find(w => w.id !== whId && w.status !== 'full');
        if (!otherWh) return;

        const maxTrans = Math.min(8, randomProduct.warehouseStockMap[whId]);
        const qty = Math.floor(1 + Math.random() * maxTrans);

        const updatedWarehouseMap = {
          ...randomProduct.warehouseStockMap,
          [whId]: randomProduct.warehouseStockMap[whId] - qty,
          [otherWh.id]: (randomProduct.warehouseStockMap[otherWh.id] || 0) + qty
        };
        const totalStock = Object.values(updatedWarehouseMap).reduce((sum, q) => sum + q, 0);

        set((state) => ({
          products: state.products.map(p =>
            p.id === randomProduct.id 
              ? { ...p, warehouseStockMap: updatedWarehouseMap, currentStock: totalStock, lastUpdated: new Date().toISOString() } 
              : p
          )
        }));

        const sourceWh = get().warehouses.find(w => w.id === whId);
        get().addTransaction({
          type: 'transfer', productId: randomProduct.id, productName: randomProduct.name,
          quantity: qty, source: sourceWh ? sourceWh.name : whId,
          destination: otherWh.name, performedBy: 'Logistics Router'
        });

        toast.message(`Transfer: ${qty}× ${randomProduct.name}`, {
          description: `${sourceWh?.name} → ${otherWh.name}`, duration: 3000
        });
      } else {
        // Anomaly
        const anomalyTypes: { type: AlertType; severity: AlertSeverity; msg: string }[] = [
          { type: 'anomaly', severity: 'high', msg: 'Stock variance detected: Physical count discrepancy.' },
          { type: 'forecast_drift', severity: 'medium', msg: 'AI detected seasonal model drift on category.' },
          { type: 'expiry', severity: 'high', msg: 'Warranty shelf-life limit triggered.' }
        ];
        const randomAnomaly = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
        
        get().addAlert({
          type: randomAnomaly.type, severity: randomAnomaly.severity,
          productId: randomProduct.id, productName: randomProduct.name,
          message: `${randomAnomaly.msg} [${randomProduct.name}]`, warehouseId: whId
        });

        toast.warning(`Anomaly: ${randomProduct.name}`, { description: randomAnomaly.msg });
      }
    }
  };
});
