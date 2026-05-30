import { Product, Warehouse, Supplier, PurchaseOrder, Alert, Transaction, ProductForecast, ForecastPoint, AuditLogEntry, WarehouseTransfer, Report, AnalyticsSummary } from '../types';

// ─── Warehouses ────────────────────────────────────────────────
export const mockWarehouses: Warehouse[] = [
  { id: 'wh-north', name: 'North Central Hub', location: 'Chicago, IL', capacity: 50000, usedCapacity: 38200, managerName: 'David Miller', status: 'active' },
  { id: 'wh-south', name: 'Southern Distribution', location: 'Dallas, TX', capacity: 40000, usedCapacity: 39500, managerName: 'Sarah Jenkins', status: 'full' },
  { id: 'wh-east', name: 'Eastern Port Terminal', location: 'Newark, NJ', capacity: 60000, usedCapacity: 42000, managerName: 'James Chen', status: 'active' },
  { id: 'wh-west', name: 'Pacific Logistics Center', location: 'Oakland, CA', capacity: 55000, usedCapacity: 28000, managerName: 'Robert Vance', status: 'active' },
  { id: 'wh-central', name: 'Heartland Sorting Facility', location: 'Kansas City, MO', capacity: 30000, usedCapacity: 9200, managerName: 'Amanda Ross', status: 'maintenance' }
];

// ─── Suppliers ─────────────────────────────────────────────────
export const mockSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Apex Semiconductors Corp', contactPerson: 'John Davis', email: 'j.davis@apex-semi.com', phone: '+1 (555) 019-2834', address: 'San Jose, CA', rating: 4.8, leadTimeDays: 7, reliabilityScore: 97, activeOrders: 3, productsSuppliedCount: 45 },
  { id: 'sup-2', name: 'LogiTech Global Industries', contactPerson: 'Elena Rostova', email: 'sales@logitech-global.net', phone: '+1 (555) 021-9876', address: 'Seattle, WA', rating: 4.6, leadTimeDays: 5, reliabilityScore: 92, activeOrders: 2, productsSuppliedCount: 30 },
  { id: 'sup-3', name: 'OptiCore Memory Systems', contactPerson: 'Kenji Sato', email: 'k.sato@opticore.co.jp', phone: '+81 3-5555-0143', address: 'Tokyo, Japan', rating: 4.9, leadTimeDays: 12, reliabilityScore: 99, activeOrders: 4, productsSuppliedCount: 60 },
  { id: 'sup-4', name: 'Vortex Cooling Solutions', contactPerson: 'Markus Weber', email: 'm.weber@vortex-cooling.de', phone: '+49 89 555-7890', address: 'Munich, Germany', rating: 4.2, leadTimeDays: 9, reliabilityScore: 84, activeOrders: 1, productsSuppliedCount: 15 },
  { id: 'sup-5', name: 'DisplayTech International', contactPerson: 'Li Wei', email: 'li.wei@displaytech.cn', phone: '+86 21 5555 0188', address: 'Shenzhen, China', rating: 4.5, leadTimeDays: 14, reliabilityScore: 89, activeOrders: 5, productsSuppliedCount: 80 },
  { id: 'sup-6', name: 'SoundWave Audio Lab', contactPerson: 'Alice Cooper', email: 'info@soundwave-labs.com', phone: '+1 (555) 034-5612', address: 'Austin, TX', rating: 4.7, leadTimeDays: 4, reliabilityScore: 95, activeOrders: 0, productsSuppliedCount: 22 },
  { id: 'sup-7', name: 'Quantum Energy & Power', contactPerson: 'David Patel', email: 'd.patel@quantum-power.io', phone: '+1 (555) 045-6789', address: 'Boston, MA', rating: 4.3, leadTimeDays: 6, reliabilityScore: 88, activeOrders: 2, productsSuppliedCount: 18 },
  { id: 'sup-8', name: 'AeroShell Plastic Moldings', contactPerson: 'Franco Rossi', email: 'f.rossi@aeroshell.it', phone: '+39 02 555 1234', address: 'Milan, Italy', rating: 3.9, leadTimeDays: 18, reliabilityScore: 78, activeOrders: 1, productsSuppliedCount: 35 }
];

// ─── Product Generation ────────────────────────────────────────
const CATEGORIES = ['Processors', 'Memory', 'Storage', 'Displays', 'Audio', 'Peripherals', 'Power Units', 'Cooling Systems', 'Accessories', 'Networking'];
const BRAND_BY_CATEGORY: Record<string, string[]> = {
  'Processors': ['Apex', 'Intellect', 'AMD Dynamics', 'CoreTech'],
  'Memory': ['OptiCore', 'Corsair', 'Kingston', 'Crucial'],
  'Storage': ['Samsung Evo', 'WesternDigital', 'Seagate', 'SanDisk'],
  'Displays': ['Quantum', 'LG Ultra', 'Sony Bravia', 'Dell UltraSharp'],
  'Audio': ['SoundWave', 'Bose Tech', 'Sony ANC', 'Sennheiser'],
  'Peripherals': ['LogiTech', 'Razer', 'SteelSeries', 'Keychron'],
  'Power Units': ['EVGA', 'Seasoning', 'Corsair Power', 'Thermaltake'],
  'Cooling Systems': ['Vortex', 'Noctua', 'CoolerMaster', 'NZXT'],
  'Accessories': ['Belkin', 'Anker', 'Ugreen', 'Satechi'],
  'Networking': ['Cisco Link', 'Netgear Nighthawk', 'TP-Link Deco', 'Ubiquiti']
};

const PRODUCT_NOUNS: Record<string, string[]> = {
  'Processors': ['CPU Ryzen v9', 'OctaCore Extreme', 'Server Chip E5', 'AI Accelerator Card', 'Mobile Processor Nano'],
  'Memory': ['DDR5 Dual Channel 32GB', 'DDR4 Gaming Stick 16GB', 'SO-DIMM Laptop Module 8GB', 'High-Speed Server ECC 64GB', 'VRAM Module Pro'],
  'Storage': ['NVMe PCIe Gen5 SSD 2TB', 'SATA Solid State Drive 1TB', 'Enterprise SAS HDD 8TB', 'Portable Rugged Drive 500GB', 'NAS Red Drive 4TB'],
  'Displays': ['Curved Gaming Screen 34"', '4K Professional Panel 27"', 'Portable IPS Display 15"', 'OLED Reference Monitor 32"', 'High-Refresh Flat Panel 24"'],
  'Audio': ['ANC Wireless Over-Ear', 'Studio Reference Monitor Pair', 'USB Cardioid Mic Set', 'Dolby Atmos Soundbar System', 'Hi-Fi DAC Headphone Amp'],
  'Peripherals': ['Mechanical Keyboard RGB', 'Ergonomic Vertical Mouse', 'Premium HD Webcam 60fps', 'Dual-Protocol Trackpad', 'Macro Deck Controller'],
  'Power Units': ['80+ Gold Fully Modular 750W', '80+ Platinum Silent 1000W', 'SFX Compact Chassis PSU 650W', 'Industrial Rackmount Power 1200W', 'Standard ATX Box 550W'],
  'Cooling Systems': ['AIO Liquid CPU Cooler 360mm', 'Dual-Tower Silent Air Cooler', 'High-Static Pressure Case Fan 120mm', 'Custom Waterloop Reservoir', 'Thermal Compound Premium'],
  'Accessories': ['Thunderbolt 4 Docking Station', 'USB-C Fast Charging Hub 100W', 'Braided DisplayPort Cable 8K', 'Vertical Multi-Device Stand', 'Premium Desk Pad Medium'],
  'Networking': ['Enterprise Managed Switch 24p', 'Wi-Fi 7 Tri-Band Router', 'Gigabit PoE Injector', 'Outdoor Mesh Node', 'SFP+ Transceiver Module']
};

function generateBarcode(sku: string): string {
  let code = '';
  for (let i = 0; i < sku.length; i++) {
    const charCode = sku.charCodeAt(i);
    if (charCode >= 48 && charCode <= 57) code += charCode - 48;
    else code += (charCode % 10).toString();
  }
  while (code.length < 12) code += Math.floor(Math.random() * 10);
  return code.substring(0, 12);
}

export const generateMockProducts = (): Product[] => {
  const products: Product[] = [];
  let index = 1;

  CATEGORIES.forEach((category) => {
    const brands = BRAND_BY_CATEGORY[category];
    const nouns = PRODUCT_NOUNS[category];

    brands.forEach((brand) => {
      nouns.forEach((noun) => {
        const id = `prod-${index}`;
        const name = `${brand} ${noun}`;
        const sku = `${category.substring(0, 3).toUpperCase()}-${brand.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const cost = parseFloat((20 + Math.random() * 800).toFixed(2));
        const price = parseFloat((cost * (1.25 + Math.random() * 0.4)).toFixed(2));
        const supplierId = `sup-${Math.floor(1 + Math.random() * 8)}`;

        const minStock = Math.floor(20 + Math.random() * 100);
        const maxStock = Math.floor(minStock * (3 + Math.random() * 5));
        const reorderPoint = Math.floor(minStock * 1.5);

        const warehouseStockMap: Record<string, number> = {};
        let currentStock = 0;
        mockWarehouses.forEach(wh => {
          if (Math.random() > 0.25) {
            const qty = Math.floor(5 + Math.random() * (maxStock / 4));
            warehouseStockMap[wh.id] = qty;
            currentStock += qty;
          } else {
            warehouseStockMap[wh.id] = 0;
          }
        });

        let status: Product['status'] = 'In Stock';
        if (currentStock === 0) status = 'Out of Stock';
        else if (currentStock <= reorderPoint) status = 'Low Stock';
        else if (currentStock >= maxStock * 0.95) status = 'Overstocked';

        const description = `High-reliability enterprise class ${brand} ${category.toLowerCase()} module designed for continuous operation, high-temperature tolerance, and seamless platform compatibility. Supported by full manufacturer warranty.`;

        products.push({
          id, sku, name, description, category, price, cost, supplierId,
          status, reorderPoint, currentStock, minStock, maxStock,
          unitOfMeasure: 'units',
          barcode: generateBarcode(sku),
          warehouseStockMap,
          tags: [category.toLowerCase(), brand.toLowerCase(), currentStock > reorderPoint * 2 ? 'stable' : 'monitored'],
          lastUpdated: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
        });

        index++;
      });
    });
  });

  while (products.length < 520) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const brand = BRAND_BY_CATEGORY[category][Math.floor(Math.random() * BRAND_BY_CATEGORY[category].length)];
    const noun = PRODUCT_NOUNS[category][Math.floor(Math.random() * PRODUCT_NOUNS[category].length)];
    const id = `prod-${index}`;
    const name = `${brand} ${noun} ${index}`;
    const sku = `${category.substring(0, 3).toUpperCase()}-${brand.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cost = parseFloat((15 + Math.random() * 400).toFixed(2));
    const price = parseFloat((cost * 1.3).toFixed(2));
    const supplierId = `sup-${Math.floor(1 + Math.random() * 8)}`;
    const minStock = Math.floor(10 + Math.random() * 50);
    const maxStock = Math.floor(minStock * 4);
    const reorderPoint = Math.floor(minStock * 1.4);
    const warehouseStockMap: Record<string, number> = {};
    let currentStock = 0;
    mockWarehouses.forEach(wh => {
      if (Math.random() > 0.3) {
        const qty = Math.floor(2 + Math.random() * (maxStock / 4));
        warehouseStockMap[wh.id] = qty;
        currentStock += qty;
      }
    });

    const status: Product['status'] = currentStock === 0 ? 'Out of Stock' : currentStock <= reorderPoint ? 'Low Stock' : currentStock >= maxStock ? 'Overstocked' : 'In Stock';

    products.push({
      id, sku, name,
      description: `Secondary enterprise auxiliary ${category.toLowerCase()} item, serial key: ${sku}.`,
      category, price, cost, supplierId,
      status, reorderPoint, currentStock, minStock, maxStock,
      unitOfMeasure: 'units',
      barcode: generateBarcode(sku),
      warehouseStockMap,
      tags: [category.toLowerCase(), 'auxiliary'],
      lastUpdated: new Date().toISOString()
    });

    index++;
  }

  return products;
};

export const mockProducts = generateMockProducts();

// ─── Purchase Orders ───────────────────────────────────────────
export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1001', orderNumber: 'PO-2026-001', supplierId: 'sup-1',
    items: [
      { productId: 'prod-1', name: 'Apex CPU Ryzen v9', quantity: 200, unitCost: 120.00, totalCost: 24000.00 },
      { productId: 'prod-2', name: 'Apex OctaCore Extreme', quantity: 150, unitCost: 85.00, totalCost: 12750.00 }
    ],
    status: 'Received', totalAmount: 36750.00, orderDate: '2026-05-10T10:00:00Z', deliveryDate: '2026-05-17T14:30:00Z',
    timeline: [
      { status: 'Draft', date: '2026-05-10T09:15:00Z', note: 'Created by Manager' },
      { status: 'Approved', date: '2026-05-10T14:00:00Z', note: 'Approved by Administrator' },
      { status: 'Sent', date: '2026-05-11T08:00:00Z', note: 'PO dispatched to Apex Semiconductors' },
      { status: 'Received', date: '2026-05-17T14:30:00Z', note: 'Shipment unloaded, scanned, inventory updated' }
    ],
    approvedBy: 'Admin'
  },
  {
    id: 'po-1002', orderNumber: 'PO-2026-002', supplierId: 'sup-3',
    items: [
      { productId: 'prod-6', name: 'OptiCore DDR5 Dual Channel 32GB', quantity: 500, unitCost: 45.00, totalCost: 22500.00 },
      { productId: 'prod-7', name: 'OptiCore DDR4 Gaming Stick 16GB', quantity: 800, unitCost: 22.00, totalCost: 17600.00 }
    ],
    status: 'Sent', totalAmount: 40100.00, orderDate: '2026-05-22T11:30:00Z',
    timeline: [
      { status: 'Draft', date: '2026-05-21T16:45:00Z', note: 'Auto-triggered by low-stock threshold alert' },
      { status: 'Approved', date: '2026-05-22T09:00:00Z', note: 'Approved by Admin' },
      { status: 'Sent', date: '2026-05-22T11:30:00Z', note: 'Dispatched electronically' }
    ],
    approvedBy: 'Admin'
  },
  {
    id: 'po-1003', orderNumber: 'PO-2026-003', supplierId: 'sup-5',
    items: [
      { productId: 'prod-16', name: 'Quantum Curved Gaming Screen 34"', quantity: 80, unitCost: 240.00, totalCost: 19200.00 },
      { productId: 'prod-17', name: 'Quantum 4K Professional Panel 27"', quantity: 120, unitCost: 180.00, totalCost: 21600.00 }
    ],
    status: 'Approved', totalAmount: 40800.00, orderDate: '2026-05-27T08:00:00Z',
    timeline: [
      { status: 'Draft', date: '2026-05-26T17:00:00Z', note: 'Seasonal forecast stocking plan' },
      { status: 'Approved', date: '2026-05-27T08:00:00Z', note: 'Approved by Admin (Credit terms OK)' }
    ],
    approvedBy: 'Admin'
  },
  {
    id: 'po-1004', orderNumber: 'PO-2026-004', supplierId: 'sup-2',
    items: [
      { productId: 'prod-26', name: 'LogiTech Mechanical Keyboard RGB', quantity: 300, unitCost: 35.00, totalCost: 10500.00 },
      { productId: 'prod-27', name: 'LogiTech Ergonomic Vertical Mouse', quantity: 200, unitCost: 28.00, totalCost: 5600.00 }
    ],
    status: 'Draft', totalAmount: 16100.00, orderDate: '2026-05-28T14:00:00Z',
    timeline: [
      { status: 'Draft', date: '2026-05-28T14:00:00Z', note: 'Created by Manager (Replenishment request)' }
    ]
  }
];

// ─── Forecasting ───────────────────────────────────────────────
export const generateForecastForProduct = (productId: string, name: string): ProductForecast => {
  const seed = productId.split('-')[1];
  const factor = (parseInt(seed) % 10) * 15 + 80;

  const statuses: ProductForecast['status'][] = ['stable', 'high_volatility', 'growth', 'decline'];
  const trends: ProductForecast['trendIndicator'][] = ['up', 'down', 'flat'];
  const status = statuses[parseInt(seed) % 4];
  const trendIndicator = status === 'growth' ? 'up' : status === 'decline' ? 'down' : trends[parseInt(seed) % 3];

  const accuracy = parseFloat((90 + (parseInt(seed) % 10) * 0.9 + Math.random() * 0.5).toFixed(2));
  const riskScore = Math.floor(Math.random() * 30) + (status === 'high_volatility' ? 45 : 10);

  const historicalAndForecast: ForecastPoint[] = [];
  const startYear = 2025;
  const startMonth = 5;

  for (let i = 0; i < 18; i++) {
    const curDate = new Date(startYear, startMonth + i, 1);
    const dateStr = curDate.toLocaleString('default', { month: 'short', year: '2-digit' });
    const monthNum = curDate.getMonth();
    const seasonalMultiplier = monthNum === 10 || monthNum === 11 ? 1.4 : monthNum === 1 || monthNum === 2 ? 0.75 : 1.0;
    const growthTrend = status === 'growth' ? (1 + i * 0.04) : status === 'decline' ? (1 - i * 0.03) : 1.0;
    const baseVal = factor * seasonalMultiplier * growthTrend;
    const noise = (Math.sin(i) * 15) + (Math.cos(i * 1.5) * 5);
    const actualVal = i < 12 ? Math.round(baseVal + noise) : null;
    const prophetVal = Math.round(baseVal + noise * 0.8 + (Math.sin(i * 2) * 5));
    const xgboostVal = Math.round(baseVal + noise * 0.95 + (Math.cos(i * 1.2) * 7));
    const lower = Math.round(prophetVal * (1 - (0.05 + (i - 12 > 0 ? (i - 12) * 0.02 : 0))));
    const upper = Math.round(prophetVal * (1 + (0.05 + (i - 12 > 0 ? (i - 12) * 0.02 : 0))));

    historicalAndForecast.push({
      date: dateStr, actualDemand: actualVal, prophetPredictedDemand: prophetVal,
      xgboostPredictedDemand: xgboostVal, confidenceLower: lower, confidenceUpper: upper
    });
  }

  const recRestock = status === 'growth' ? Math.round(factor * 1.6) : status === 'decline' ? Math.round(factor * 0.8) : Math.round(factor * 1.2);
  const recMsg = status === 'growth'
    ? `Demand is rising at ~4% monthly. Accelerate PO pipeline by 3 days to avoid stockouts during Q3.`
    : status === 'decline'
    ? `System detects declining trend. Hold inventory replenishment below safety limits to save working capital.`
    : `Stable seasonal demand. Maintain standard 1.2x safety stock coverage.`;

  return {
    productId, name, accuracy, status, trendIndicator, recommendation: recMsg,
    recommendedRestockQty: recRestock, riskScore,
    modelHealth: {
      rmse: parseFloat((3.2 + Math.random() * 2).toFixed(2)),
      mae: parseFloat((2.1 + Math.random() * 1.5).toFixed(2)),
      lastTrained: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString()
    },
    historicalAndForecast
  };
};

export const mockForecasts: ProductForecast[] = [
  generateForecastForProduct('prod-1', 'Apex CPU Ryzen v9'),
  generateForecastForProduct('prod-6', 'OptiCore DDR5 Dual Channel 32GB'),
  generateForecastForProduct('prod-11', 'Samsung Evo NVMe PCIe Gen5 SSD 2TB'),
  generateForecastForProduct('prod-16', 'Quantum Curved Gaming Screen 34"'),
  generateForecastForProduct('prod-21', 'SoundWave ANC Wireless Over-Ear'),
  generateForecastForProduct('prod-26', 'LogiTech Mechanical Keyboard RGB')
];

// ─── Alerts ────────────────────────────────────────────────────
export const mockAlerts: Alert[] = [
  { id: 'alt-1', type: 'low_stock', severity: 'critical', productId: 'prod-6', productName: 'OptiCore DDR5 Dual Channel 32GB', message: 'Stock has fallen to 12 units in Dallas WH (Minimum threshold is 50). Critical risk of stockout.', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), status: 'unread', warehouseId: 'wh-south' },
  { id: 'alt-2', type: 'anomaly', severity: 'high', productId: 'prod-11', productName: 'Samsung Evo NVMe PCIe Gen5 SSD 2TB', message: 'Sudden demand spike: Outbound orders exceeded the historical 3-sigma limits by 340% within 4 hours.', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), status: 'unread', warehouseId: 'wh-east' },
  { id: 'alt-3', type: 'forecast_drift', severity: 'medium', productId: 'prod-16', productName: 'Quantum Curved Gaming Screen 34"', message: 'AI Forecast drift detected: Prophet prediction model variance exceeds 8% over actual sales for 2 weeks.', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), status: 'read', warehouseId: 'wh-north' },
  { id: 'alt-4', type: 'overstock', severity: 'low', productId: 'prod-21', productName: 'SoundWave ANC Wireless Over-Ear', message: 'Overstocked: West Coast WH capacity has reached 98% with 1,200 slow-moving items.', timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), status: 'investigating', warehouseId: 'wh-west' },
  { id: 'alt-5', type: 'expiry', severity: 'critical', productId: 'prod-26', productName: 'LogiTech Mechanical Keyboard RGB', message: 'Batch LOT-2026-X9 containing 45 units in Chicago WH is nearing its custom warranty storage shelf-life.', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'resolved', warehouseId: 'wh-north', notes: 'Transferred and discounted items.' }
];

// ─── Transactions ──────────────────────────────────────────────
export const mockTransactions: Transaction[] = [
  { id: 'txn-501', type: 'inbound', productId: 'prod-1', productName: 'Apex CPU Ryzen v9', quantity: 200, source: 'Apex Semiconductors Corp', destination: 'North Central Hub', timestamp: new Date(Date.now() - 20 * 60000).toISOString(), performedBy: 'David Miller' },
  { id: 'txn-502', type: 'outbound', productId: 'prod-11', productName: 'Samsung Evo NVMe PCIe Gen5 SSD 2TB', quantity: 45, source: 'Eastern Port Terminal', destination: 'Fulfillment Order #9213', timestamp: new Date(Date.now() - 40 * 60000).toISOString(), performedBy: 'James Chen' },
  { id: 'txn-503', type: 'transfer', productId: 'prod-26', productName: 'LogiTech Mechanical Keyboard RGB', quantity: 50, source: 'Southern Distribution', destination: 'Heartland Sorting Facility', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), performedBy: 'Sarah Jenkins' },
  { id: 'txn-504', type: 'outbound', productId: 'prod-6', productName: 'OptiCore DDR5 Dual Channel 32GB', quantity: 80, source: 'Southern Distribution', destination: 'B2B Client TechStore', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), performedBy: 'System Auto-Route' },
  { id: 'txn-505', type: 'inbound', productId: 'prod-16', productName: 'Quantum Curved Gaming Screen 34"', quantity: 40, source: 'DisplayTech International', destination: 'Eastern Port Terminal', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), performedBy: 'James Chen' },
  { id: 'txn-506', type: 'transfer', productId: 'prod-21', productName: 'SoundWave ANC Wireless Over-Ear', quantity: 25, source: 'Pacific Logistics Center', destination: 'North Central Hub', timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), performedBy: 'Robert Vance' },
];

// ─── Analytics Summary ─────────────────────────────────────────
export const mockAnalyticsSummary: AnalyticsSummary = {
  revenueTrend: [
    { month: 'Dec 25', sales: 120000, profit: 32000, forecast: 118000 },
    { month: 'Jan 26', sales: 145000, profit: 39000, forecast: 140000 },
    { month: 'Feb 26', sales: 110000, profit: 28000, forecast: 115000 },
    { month: 'Mar 26', sales: 165000, profit: 46000, forecast: 160000 },
    { month: 'Apr 26', sales: 180000, profit: 51000, forecast: 175000 },
    { month: 'May 26', sales: 210000, profit: 60000, forecast: 200000 }
  ],
  warehouseDistribution: [
    { name: 'North Central Hub', value: 38200 },
    { name: 'Southern Distribution', value: 39500 },
    { name: 'Eastern Port Terminal', value: 42000 },
    { name: 'Pacific Logistics Center', value: 28000 },
    { name: 'Heartland Sorting Facility', value: 9200 }
  ],
  supplierPerformance: [
    { name: 'Apex Semiconductors', rating: 4.8, deliveryRate: 97, orderCount: 22 },
    { name: 'LogiTech Global', rating: 4.6, deliveryRate: 92, orderCount: 18 },
    { name: 'OptiCore Memory', rating: 4.9, deliveryRate: 99, orderCount: 42 },
    { name: 'Vortex Cooling', rating: 4.2, deliveryRate: 84, orderCount: 8 },
    { name: 'DisplayTech Int.', rating: 4.5, deliveryRate: 89, orderCount: 30 },
    { name: 'SoundWave Audio', rating: 4.7, deliveryRate: 95, orderCount: 12 }
  ],
  categoryPerformance: [
    { category: 'Processors', revenue: 485000, units: 2340, growth: 12.5 },
    { category: 'Memory', revenue: 320000, units: 8900, growth: 8.2 },
    { category: 'Storage', revenue: 290000, units: 3200, growth: 15.1 },
    { category: 'Displays', revenue: 410000, units: 1800, growth: -2.3 },
    { category: 'Audio', revenue: 180000, units: 4100, growth: 6.7 },
    { category: 'Peripherals', revenue: 150000, units: 6200, growth: 4.1 },
    { category: 'Power Units', revenue: 95000, units: 1200, growth: -1.5 },
    { category: 'Cooling Systems', revenue: 78000, units: 900, growth: 3.2 },
    { category: 'Accessories', revenue: 120000, units: 7500, growth: 9.8 },
    { category: 'Networking', revenue: 210000, units: 1600, growth: 18.4 },
  ],
  deadStockValue: 142300,
  turnoverRatio: 6.8,
  totalRevenue: 2338000,
  totalOrders: 1847,
};

// ─── Audit Logs ────────────────────────────────────────────────
export const mockAuditLogs: AuditLogEntry[] = [
  { id: 'audit-1', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), userId: 'user-1', userName: 'Alex Mercer', userRole: 'ADMIN', action: 'APPROVE', resource: 'Purchase Order', resourceId: 'PO-2026-003', details: 'Approved purchase order for DisplayTech International', ipAddress: '192.168.1.45' },
  { id: 'audit-2', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), userId: 'user-2', userName: 'Sarah Jenkins', userRole: 'MANAGER', action: 'CREATE', resource: 'Purchase Order', resourceId: 'PO-2026-004', details: 'Created new purchase order for LogiTech Global Industries', ipAddress: '192.168.1.82' },
  { id: 'audit-3', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), userId: 'user-1', userName: 'Alex Mercer', userRole: 'ADMIN', action: 'UPDATE', resource: 'System Settings', details: 'Updated notification preferences for low stock alerts', ipAddress: '192.168.1.45' },
  { id: 'audit-4', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), userId: 'user-3', userName: 'Mike Torres', userRole: 'STAFF', action: 'UPDATE', resource: 'Inventory', resourceId: 'prod-11', details: 'Received 45 units of Samsung Evo NVMe SSD at Eastern Port Terminal', ipAddress: '192.168.1.103' },
  { id: 'audit-5', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), userId: 'user-4', userName: 'Clara Oswald', userRole: 'ANALYST', action: 'EXPORT', resource: 'Analytics Report', details: 'Exported Q2 demand forecast report as PDF', ipAddress: '192.168.1.67' },
  { id: 'audit-6', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), userId: 'user-1', userName: 'Alex Mercer', userRole: 'ADMIN', action: 'CREATE', resource: 'User', resourceId: 'user-25', details: 'Created new staff account for warehouse operations', ipAddress: '192.168.1.45' },
  { id: 'audit-7', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), userId: 'user-2', userName: 'Sarah Jenkins', userRole: 'MANAGER', action: 'UPDATE', resource: 'Supplier', resourceId: 'sup-4', details: 'Updated Vortex Cooling Solutions reliability score to 84%', ipAddress: '192.168.1.82' },
  { id: 'audit-8', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), userId: 'user-3', userName: 'Mike Torres', userRole: 'STAFF', action: 'CREATE', resource: 'Warehouse Transfer', details: 'Initiated transfer of 50 units from Southern to Heartland', ipAddress: '192.168.1.103' },
  { id: 'audit-9', timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), userId: 'user-1', userName: 'Alex Mercer', userRole: 'ADMIN', action: 'DELETE', resource: 'Product', resourceId: 'prod-512', details: 'Removed discontinued product from catalog', ipAddress: '192.168.1.45' },
  { id: 'audit-10', timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), userId: 'user-4', userName: 'Clara Oswald', userRole: 'ANALYST', action: 'LOGIN', resource: 'System', details: 'Logged in from new device', ipAddress: '10.0.0.55' },
  { id: 'audit-11', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), userId: 'user-2', userName: 'Sarah Jenkins', userRole: 'MANAGER', action: 'APPROVE', resource: 'Purchase Order', resourceId: 'PO-2026-002', details: 'Approved restocking order for OptiCore Memory Systems', ipAddress: '192.168.1.82' },
  { id: 'audit-12', timestamp: new Date(Date.now() - 36 * 3600000).toISOString(), userId: 'user-1', userName: 'Alex Mercer', userRole: 'ADMIN', action: 'IMPORT', resource: 'Products', details: 'Bulk imported 45 new products from CSV file', ipAddress: '192.168.1.45' },
];

// ─── Warehouse Transfers ───────────────────────────────────────
export const mockWarehouseTransfers: WarehouseTransfer[] = [
  { id: 'wt-1', transferNumber: 'WT-2026-001', sourceWarehouseId: 'wh-south', sourceWarehouseName: 'Southern Distribution', destinationWarehouseId: 'wh-central', destinationWarehouseName: 'Heartland Sorting Facility', items: [{ productId: 'prod-26', productName: 'LogiTech Mechanical Keyboard RGB', quantity: 50 }, { productId: 'prod-27', productName: 'LogiTech Ergonomic Vertical Mouse', quantity: 30 }], status: 'completed', createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), completedAt: new Date(Date.now() - 1 * 3600000).toISOString(), createdBy: 'Mike Torres', notes: 'Routine redistribution' },
  { id: 'wt-2', transferNumber: 'WT-2026-002', sourceWarehouseId: 'wh-west', sourceWarehouseName: 'Pacific Logistics Center', destinationWarehouseId: 'wh-north', destinationWarehouseName: 'North Central Hub', items: [{ productId: 'prod-21', productName: 'SoundWave ANC Wireless Over-Ear', quantity: 25 }], status: 'in_transit', createdAt: new Date(Date.now() - 8 * 3600000).toISOString(), createdBy: 'Robert Vance' },
  { id: 'wt-3', transferNumber: 'WT-2026-003', sourceWarehouseId: 'wh-east', sourceWarehouseName: 'Eastern Port Terminal', destinationWarehouseId: 'wh-south', destinationWarehouseName: 'Southern Distribution', items: [{ productId: 'prod-6', productName: 'OptiCore DDR5 Dual Channel 32GB', quantity: 100 }, { productId: 'prod-11', productName: 'Samsung Evo NVMe SSD 2TB', quantity: 60 }], status: 'pending', createdAt: new Date(Date.now() - 1 * 3600000).toISOString(), createdBy: 'James Chen', notes: 'Urgent restocking for Dallas WH' },
  { id: 'wt-4', transferNumber: 'WT-2026-004', sourceWarehouseId: 'wh-north', sourceWarehouseName: 'North Central Hub', destinationWarehouseId: 'wh-west', destinationWarehouseName: 'Pacific Logistics Center', items: [{ productId: 'prod-1', productName: 'Apex CPU Ryzen v9', quantity: 75 }], status: 'completed', createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), completedAt: new Date(Date.now() - 24 * 3600000).toISOString(), createdBy: 'David Miller' },
  { id: 'wt-5', transferNumber: 'WT-2026-005', sourceWarehouseId: 'wh-south', sourceWarehouseName: 'Southern Distribution', destinationWarehouseId: 'wh-east', destinationWarehouseName: 'Eastern Port Terminal', items: [{ productId: 'prod-16', productName: 'Quantum Curved Gaming Screen 34"', quantity: 20 }], status: 'cancelled', createdAt: new Date(Date.now() - 72 * 3600000).toISOString(), createdBy: 'Sarah Jenkins', notes: 'Cancelled — source WH at capacity' },
];

// ─── Reports ───────────────────────────────────────────────────
export const mockReports: Report[] = [
  { id: 'rpt-1', title: 'Q2 2026 Demand Forecast Summary', description: 'Comprehensive demand prediction analysis across all product categories with seasonal adjustments and model accuracy metrics.', category: 'demand', generatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), generatedBy: 'Clara Oswald', format: 'PDF', size: '2.4 MB', status: 'ready' },
  { id: 'rpt-2', title: 'Monthly Inventory Turnover Report', description: 'Inventory turnover ratios, dead stock analysis, and warehouse utilization metrics for May 2026.', category: 'inventory', generatedAt: new Date(Date.now() - 5 * 86400000).toISOString(), generatedBy: 'Clara Oswald', format: 'XLSX', size: '1.8 MB', status: 'ready' },
  { id: 'rpt-3', title: 'Revenue & Profitability Analysis', description: 'Month-over-month revenue trends, gross margin analysis, and category-level profitability breakdown.', category: 'financial', generatedAt: new Date(Date.now() - 7 * 86400000).toISOString(), generatedBy: 'Clara Oswald', format: 'PDF', size: '3.1 MB', status: 'ready' },
  { id: 'rpt-4', title: 'Supplier Performance Scorecard', description: 'Quarterly supplier evaluation covering delivery rates, quality metrics, and SLA compliance scores.', category: 'performance', generatedAt: new Date(Date.now() - 10 * 86400000).toISOString(), generatedBy: 'Clara Oswald', format: 'PDF', size: '1.5 MB', status: 'ready' },
  { id: 'rpt-5', title: 'Dead Stock Liquidation Analysis', description: 'Identification of slow-moving inventory items with recommended liquidation strategies and projected capital recovery.', category: 'inventory', generatedAt: new Date(Date.now() - 14 * 86400000).toISOString(), generatedBy: 'Clara Oswald', format: 'CSV', size: '890 KB', status: 'ready' },
  { id: 'rpt-6', title: 'Warehouse Capacity Optimization', description: 'Cross-warehouse capacity analysis with redistribution recommendations based on demand patterns.', category: 'performance', generatedAt: new Date().toISOString(), generatedBy: 'System', format: 'PDF', size: '', status: 'generating' },
];

// ─── Mock Users for User Management ────────────────────────────
export const mockUsers = [
  { id: 'user-1', name: 'Alex Mercer', email: 'a.mercer@smartinventory.com', role: 'ADMIN' as const, department: 'IT Operations', status: 'active' as const, lastLogin: new Date(Date.now() - 5 * 60000).toISOString(), createdAt: '2025-01-15T10:00:00Z' },
  { id: 'user-2', name: 'Sarah Jenkins', email: 's.jenkins@smartinventory.com', role: 'MANAGER' as const, department: 'Supply Chain', status: 'active' as const, lastLogin: new Date(Date.now() - 15 * 60000).toISOString(), createdAt: '2025-02-01T10:00:00Z' },
  { id: 'user-3', name: 'Mike Torres', email: 'm.torres@smartinventory.com', role: 'STAFF' as const, department: 'Warehouse Ops', status: 'active' as const, lastLogin: new Date(Date.now() - 1 * 3600000).toISOString(), createdAt: '2025-03-10T10:00:00Z' },
  { id: 'user-4', name: 'Clara Oswald', email: 'c.oswald@smartinventory.com', role: 'ANALYST' as const, department: 'Business Intelligence', status: 'active' as const, lastLogin: new Date(Date.now() - 2 * 3600000).toISOString(), createdAt: '2025-02-20T10:00:00Z' },
  { id: 'user-5', name: 'David Miller', email: 'd.miller@smartinventory.com', role: 'MANAGER' as const, department: 'Logistics', status: 'active' as const, lastLogin: new Date(Date.now() - 3 * 3600000).toISOString(), createdAt: '2025-01-20T10:00:00Z' },
  { id: 'user-6', name: 'James Chen', email: 'j.chen@smartinventory.com', role: 'STAFF' as const, department: 'Warehouse Ops', status: 'active' as const, lastLogin: new Date(Date.now() - 6 * 3600000).toISOString(), createdAt: '2025-04-05T10:00:00Z' },
  { id: 'user-7', name: 'Robert Vance', email: 'r.vance@smartinventory.com', role: 'STAFF' as const, department: 'Warehouse Ops', status: 'active' as const, lastLogin: new Date(Date.now() - 8 * 3600000).toISOString(), createdAt: '2025-03-15T10:00:00Z' },
  { id: 'user-8', name: 'Amanda Ross', email: 'a.ross@smartinventory.com', role: 'MANAGER' as const, department: 'Operations', status: 'active' as const, lastLogin: new Date(Date.now() - 12 * 3600000).toISOString(), createdAt: '2025-04-20T10:00:00Z' },
  { id: 'user-9', name: 'Kevin Park', email: 'k.park@smartinventory.com', role: 'ANALYST' as const, department: 'Data Science', status: 'active' as const, lastLogin: new Date(Date.now() - 24 * 3600000).toISOString(), createdAt: '2025-05-01T10:00:00Z' },
  { id: 'user-10', name: 'Linda Nguyen', email: 'l.nguyen@smartinventory.com', role: 'STAFF' as const, department: 'Receiving', status: 'active' as const, lastLogin: new Date(Date.now() - 4 * 3600000).toISOString(), createdAt: '2025-06-10T10:00:00Z' },
  { id: 'user-11', name: 'Tom Bradley', email: 't.bradley@smartinventory.com', role: 'STAFF' as const, department: 'Shipping', status: 'inactive' as const, lastLogin: new Date(Date.now() - 30 * 86400000).toISOString(), createdAt: '2025-02-15T10:00:00Z' },
  { id: 'user-12', name: 'Rachel Kim', email: 'r.kim@smartinventory.com', role: 'MANAGER' as const, department: 'Procurement', status: 'active' as const, lastLogin: new Date(Date.now() - 2 * 3600000).toISOString(), createdAt: '2025-07-01T10:00:00Z' },
];
