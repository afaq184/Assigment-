import { ChartDataPoint, KPI, ActivityLog, Shipment, SystemStatus, InventoryItem, SalesOrder, PurchaseOrder, ReturnRequest, ExportDoc } from '../types';

export const getInitialKPIs = (): KPI[] => [
  {
    id: 'fillRate',
    label: 'Order Fill Rate',
    value: '98.5%',
    change: 1.2,
    trend: 'up',
    iconName: 'CheckCircle',
    sentiment: 'positive'
  },
  {
    id: 'variance',
    label: 'Inventory Variance',
    value: '0.04%',
    change: -0.01,
    trend: 'down',
    iconName: 'AlertOctagon',
    sentiment: 'positive' // Lower variance is better
  },
  {
    id: 'openOrders',
    label: 'Open Order Volume',
    value: '450',
    change: 8.5,
    trend: 'up',
    iconName: 'ClipboardList',
    sentiment: 'neutral'
  },
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: 'PKR 34.8M',
    change: 12.5,
    trend: 'up',
    iconName: 'DollarSign'
  }
];

export const getSystemHealth = (): SystemStatus[] => [
  { 
    id: '1', 
    module: 'Financial Module', 
    status: 'operational', 
    lastSync: 'Just now', 
    message: 'Credit Checks: Active', 
    latency: '45ms' 
  },
  { 
    id: '2', 
    module: 'CRM Integration', 
    status: 'operational', 
    lastSync: '30s ago', 
    message: 'Sales Orders: Synced', 
    latency: '120ms' 
  },
  { 
    id: '3', 
    module: 'WMS Core', 
    status: 'operational', 
    lastSync: 'Real-time', 
    message: 'Inventory: Live', 
    latency: '12ms' 
  },
  { 
    id: '4', 
    module: 'Carrier Gateway', 
    status: 'degraded', 
    lastSync: '5m ago', 
    message: 'API Latency High', 
    latency: '850ms' 
  },
];

export const getRevenueData = (): ChartDataPoint[] => [
  { name: '09:00', value: 1120000, secondary: 98 },
  { name: '10:00', value: 840000, secondary: 97 },
  { name: '11:00', value: 560000, secondary: 95 },
  { name: '12:00', value: 778000, secondary: 98 },
  { name: '13:00', value: 529000, secondary: 99 },
  { name: '14:00', value: 669000, secondary: 96 },
  { name: '15:00', value: 977000, secondary: 98 },
];

export const getInventoryData = (): ChartDataPoint[] => [
  { name: 'Electronics', value: 400 },
  { name: 'Apparel', value: 300 },
  { name: 'Home', value: 300 },
  { name: 'Garden', value: 200 },
  { name: 'Sports', value: 278 },
  { name: 'Auto', value: 189 },
];

export const getRecentActivity = (): ActivityLog[] => [
  { id: '1', action: 'Order #4920 credit approved', user: 'Financial Mod', timestamp: '2 mins ago', type: 'system' },
  { id: '2', action: 'Variance detected: SKU-992', user: 'Inventory Bot', timestamp: '15 mins ago', type: 'inventory' },
  { id: '3', action: 'Bulk Order #8821 received', user: 'CRM Sync', timestamp: '1 hour ago', type: 'order' },
  { id: '4', action: 'Cycle count completed: Row A', user: 'Warehouse Mgr', timestamp: '2 hours ago', type: 'inventory' },
];

export const getShipments = (): Shipment[] => [
  { id: '1', trackingId: 'TRK-9821', recipient: 'TechSolutions Inc.', destination: 'Karachi, Sindh', status: 'In Transit', eta: 'Today', carrier: 'TCS', type: 'Outbound' },
  { id: '2', trackingId: 'TRK-9822', recipient: 'Global Gadgets', destination: 'Lahore, Punjab', status: 'Delayed', eta: 'Nov 26', carrier: 'Leopards', type: 'Outbound' },
  { id: '3', trackingId: 'TRK-9823', recipient: 'Warehouse A', destination: 'Islamabad HQ', status: 'Delivered', eta: 'Yesterday', carrier: 'M&P', type: 'Inbound' },
  { id: '4', trackingId: 'TRK-9824', recipient: 'Retail Chain X', destination: 'Faisalabad, Punjab', status: 'Pending', eta: 'Nov 25', carrier: 'Call Courier', type: 'Outbound' },
  { id: '5', trackingId: 'TRK-9825', recipient: 'Warehouse B', destination: 'Multan, Punjab', status: 'In Transit', eta: 'Nov 28', carrier: 'Trax', type: 'Inbound' },
  { id: '6', trackingId: 'TRK-9826', recipient: 'ElectroCity', destination: 'Peshawar, KPK', status: 'In Transit', eta: 'Nov 25', carrier: 'PostEx', type: 'Outbound' },
  { id: '7', trackingId: 'TRK-9827', recipient: 'RapidSupply', destination: 'Quetta, Balochistan', status: 'Exception', eta: 'Unknown', carrier: 'TCS', type: 'Outbound' },
];

export const getInventoryItems = (): InventoryItem[] => [
  { 
    id: '1', 
    sku: 'ELEC-2023-001', 
    name: 'Wireless Noise Cancelling Headphones', 
    category: 'Electronics', 
    onHand: 150, 
    allocated: 30, 
    reorderPoint: 50, 
    unitPrice: 85000, 
    location: 'Zone A-12',
    compliance: { tariffCode: '8518.30.2000', countryOfOrigin: 'China', regulatoryCategory: 'FCC, CE', lastAuditDate: '2023-10-15' },
    batches: [
      { id: 'b1', batchNumber: 'BN-8821', lotNumber: 'L-2201', expiryDate: '2025-12-31', quantity: 100, complianceStatus: 'Compliant', receivedDate: '2023-09-01' },
      { id: 'b2', batchNumber: 'BN-8822', lotNumber: 'L-2202', expiryDate: '2026-01-15', quantity: 50, complianceStatus: 'Pending Review', receivedDate: '2023-10-01' }
    ]
  },
  { 
    id: '2', 
    sku: 'ELEC-2023-004', 
    name: 'Smartwatch Series 5 - Black', 
    category: 'Electronics', 
    onHand: 42, 
    allocated: 10, 
    reorderPoint: 40, 
    unitPrice: 56000, 
    location: 'Zone A-08',
    compliance: { tariffCode: '8517.62.0090', countryOfOrigin: 'Vietnam', regulatoryCategory: 'RoHS', lastAuditDate: '2023-08-20' },
    batches: [
      { id: 'b3', batchNumber: 'BN-9901', lotNumber: 'L-3310', expiryDate: '2025-06-30', quantity: 42, complianceStatus: 'Compliant', receivedDate: '2023-08-15' }
    ]
  },
  { 
    id: '3', 
    sku: 'HOME-2023-112', 
    name: 'Ergonomic Office Chair', 
    category: 'Home Office', 
    onHand: 8, 
    allocated: 2, 
    reorderPoint: 15, 
    unitPrice: 125000, 
    location: 'Zone B-02',
    compliance: { tariffCode: '9401.30.8031', countryOfOrigin: 'Malaysia', regulatoryCategory: 'ANSI/BIFMA', lastAuditDate: '2023-01-10' },
    batches: [
      { id: 'b4', batchNumber: 'BN-1029', lotNumber: 'L-0012', expiryDate: 'N/A', quantity: 8, complianceStatus: 'Compliant', receivedDate: '2023-02-01' }
    ]
  },
  { 
    id: '4', 
    sku: 'ACC-2023-088', 
    name: 'USB-C Fast Charger 65W', 
    category: 'Accessories', 
    onHand: 500, 
    allocated: 120, 
    reorderPoint: 100, 
    unitPrice: 8500, 
    location: 'Zone A-22',
    compliance: { tariffCode: '8504.40.8500', countryOfOrigin: 'China', regulatoryCategory: 'UL, CE', lastAuditDate: '2023-11-01' },
    batches: [
      { id: 'b5', batchNumber: 'BN-5510', lotNumber: 'L-5001', expiryDate: '2028-01-01', quantity: 300, complianceStatus: 'Compliant', receivedDate: '2023-09-10' },
      { id: 'b6', batchNumber: 'BN-5511', lotNumber: 'L-5002', expiryDate: '2028-02-01', quantity: 200, complianceStatus: 'Non-Compliant', receivedDate: '2023-10-10' }
    ]
  },
  { 
    id: '5', 
    sku: 'GARD-2023-005', 
    name: 'Solar Garden Lights (Pack of 4)', 
    category: 'Garden', 
    onHand: 200, 
    allocated: 0, 
    reorderPoint: 50, 
    unitPrice: 12500, 
    location: 'Zone C-15',
    compliance: { tariffCode: '9405.40.8440', countryOfOrigin: 'India', regulatoryCategory: 'IP65', lastAuditDate: '2023-05-22' },
    batches: [
      { id: 'b7', batchNumber: 'BN-2201', lotNumber: 'L-1100', expiryDate: '2026-05-20', quantity: 200, complianceStatus: 'Compliant', receivedDate: '2023-06-01' }
    ]
  },
  { 
    id: '6', 
    sku: 'ELEC-2023-099', 
    name: '4K Ultra HD Monitor 27"', 
    category: 'Electronics', 
    onHand: 18, 
    allocated: 15, 
    reorderPoint: 20, 
    unitPrice: 98000, 
    location: 'Zone A-05',
    compliance: { tariffCode: '8528.52.0000', countryOfOrigin: 'South Korea', regulatoryCategory: 'Energy Star', lastAuditDate: '2023-07-30' },
    batches: [
      { id: 'b8', batchNumber: 'BN-3392', lotNumber: 'L-8821', expiryDate: 'N/A', quantity: 18, complianceStatus: 'Compliant', receivedDate: '2023-08-01' }
    ]
  },
  { 
    id: '7', 
    sku: 'AUTO-2023-012', 
    name: 'Car Dashboard Phone Mount', 
    category: 'Automotive', 
    onHand: 85, 
    allocated: 5, 
    reorderPoint: 30, 
    unitPrice: 4500, 
    location: 'Zone D-01',
    compliance: { tariffCode: '3926.90.9990', countryOfOrigin: 'China', regulatoryCategory: 'General', lastAuditDate: '2023-02-14' },
    batches: [
      { id: 'b9', batchNumber: 'BN-4401', lotNumber: 'L-4410', expiryDate: 'N/A', quantity: 85, complianceStatus: 'Compliant', receivedDate: '2023-03-01' }
    ]
  },
  { 
    id: '8', 
    sku: 'ELEC-2023-045', 
    name: 'Bluetooth Portable Speaker', 
    category: 'Electronics', 
    onHand: 0, 
    allocated: 0, 
    reorderPoint: 25, 
    unitPrice: 22500, 
    location: 'Zone A-14',
    compliance: { tariffCode: '8518.21.0000', countryOfOrigin: 'Vietnam', regulatoryCategory: 'FCC', lastAuditDate: '2023-09-12' },
    batches: []
  },
];

export const getSalesOrders = (): SalesOrder[] => [
  {
    id: 'so-1001',
    orderNumber: 'ORD-8821',
    customerName: 'TechSolutions Inc.',
    channel: 'CRM',
    status: 'Confirmed',
    date: '2023-11-20',
    totalAmount: 5180000,
    priority: 'High',
    items: [
      { sku: 'ELEC-2023-001', name: 'Wireless Headphones', quantity: 20, unitPrice: 85000 },
      { sku: 'ELEC-2023-099', name: '4K Monitor', quantity: 10, unitPrice: 348000 }
    ]
  },
  {
    id: 'so-1002',
    orderNumber: 'ORD-8822',
    customerName: 'Global Gadgets',
    channel: 'Web',
    status: 'Credit Check',
    date: '2023-11-21',
    totalAmount: 1075000,
    priority: 'Normal',
    items: [
      { sku: 'ACC-2023-088', name: 'USB-C Charger', quantity: 100, unitPrice: 8500 },
      { sku: 'AUTO-2023-012', name: 'Phone Mount', quantity: 50, unitPrice: 4500 }
    ]
  },
  {
    id: 'so-1003',
    orderNumber: 'ORD-8823',
    customerName: 'Retail Chain X',
    channel: 'EDI',
    status: 'Warehouse Pick',
    date: '2023-11-19',
    totalAmount: 3750000,
    priority: 'Critical',
    items: [
      { sku: 'HOME-2023-112', name: 'Office Chair', quantity: 20, unitPrice: 125000 },
      { sku: 'GARD-2023-005', name: 'Garden Lights', quantity: 100, unitPrice: 12500 }
    ]
  },
  {
    id: 'so-1004',
    orderNumber: 'ORD-8824',
    customerName: 'Direct Buyer LLC',
    channel: 'Direct',
    status: 'Shipped',
    date: '2023-11-18',
    totalAmount: 280000,
    priority: 'Normal',
    items: [
      { sku: 'ELEC-2023-004', name: 'Smartwatch', quantity: 5, unitPrice: 56000 }
    ]
  },
  {
    id: 'so-1005',
    orderNumber: 'ORD-8825',
    customerName: 'ElectroCity',
    channel: 'CRM',
    status: 'Invoiced',
    date: '2023-11-15',
    totalAmount: 6600000,
    priority: 'High',
    items: [
      { sku: 'ELEC-2023-099', name: '4K Monitor', quantity: 50, unitPrice: 98000 },
      { sku: 'ACC-2023-088', name: 'USB-C Charger', quantity: 200, unitPrice: 8500 }
    ]
  },
  {
    id: 'so-1006',
    orderNumber: 'ORD-8826',
    customerName: 'StartUp Hub',
    channel: 'Web',
    status: 'Compliance Screening',
    date: '2023-11-22',
    totalAmount: 362000,
    priority: 'Normal',
    items: [
      { sku: 'HOME-2023-112', name: 'Office Chair', quantity: 2, unitPrice: 125000 },
      { sku: 'ELEC-2023-004', name: 'Smartwatch', quantity: 2, unitPrice: 56000 }
    ]
  }
];

export const getPurchaseOrders = (): PurchaseOrder[] => [
  {
    id: 'po-101',
    poNumber: 'PO-2023-001',
    supplier: 'MegaTron Electronics',
    expectedDate: '2023-11-25',
    status: 'Pending',
    items: [
      { sku: 'ELEC-2023-001', name: 'Wireless Headphones', expectedQty: 50, receivedQty: 0, status: 'Pending' },
      { sku: 'ACC-2023-088', name: 'USB-C Charger', expectedQty: 200, receivedQty: 0, status: 'Pending' }
    ]
  },
  {
    id: 'po-102',
    poNumber: 'PO-2023-005',
    supplier: 'HomeStyles Global',
    expectedDate: '2023-11-26',
    status: 'Partial',
    items: [
      { sku: 'HOME-2023-112', name: 'Office Chair', expectedQty: 20, receivedQty: 5, status: 'Pending' },
      { sku: 'GARD-2023-005', name: 'Solar Garden Lights', expectedQty: 100, receivedQty: 100, status: 'Received' }
    ]
  },
  {
    id: 'po-103',
    poNumber: 'PO-2023-008',
    supplier: 'AutoParts Express',
    expectedDate: '2023-11-28',
    status: 'Pending',
    items: [
      { sku: 'AUTO-2023-012', name: 'Dashboard Mount', expectedQty: 500, receivedQty: 0, status: 'Pending' }
    ]
  }
];

export const getReturns = (): ReturnRequest[] => [
  {
    id: 'ret-1',
    rmaNumber: 'RMA-2023-001',
    orderNumber: 'ORD-8821',
    customerName: 'TechSolutions Inc.',
    requestDate: '2023-11-25',
    status: 'QC Inspection',
    reason: 'Defective Unit',
    items: [{ sku: 'ELEC-2023-001', name: 'Wireless Headphones', qty: 2 }],
    finalAction: 'Pending'
  },
  {
    id: 'ret-2',
    rmaNumber: 'RMA-2023-002',
    orderNumber: 'ORD-8824',
    customerName: 'Direct Buyer LLC',
    requestDate: '2023-11-26',
    status: 'Requested',
    reason: 'Wrong Item Sent',
    items: [{ sku: 'ELEC-2023-004', name: 'Smartwatch', qty: 1 }],
    finalAction: 'Pending'
  }
];

export const getExportDocuments = (): ExportDoc[] => [
  { id: 'doc-1', shipmentId: '1', trackingId: 'TRK-9821', type: 'Commercial Invoice', dateGenerated: '2023-11-20', status: 'Filed', destinationCountry: 'Pakistan (Domestic)' },
  { id: 'doc-2', shipmentId: '1', trackingId: 'TRK-9821', type: 'Shipping Label', dateGenerated: '2023-11-20', status: 'Generated', destinationCountry: 'Pakistan (Domestic)' },
  { id: 'doc-3', shipmentId: '2', trackingId: 'TRK-9822', type: 'Commercial Invoice', dateGenerated: '2023-11-21', status: 'Filed', destinationCountry: 'Pakistan (Domestic)' },
];

// Helper to simulate live data updates
export const simulateLiveUpdate = (currentData: ChartDataPoint[]): ChartDataPoint[] => {
  const lastItem = currentData[currentData.length - 1];
  const newValue = Math.max(100000, Math.min(1500000, lastItem.value + (Math.random() - 0.5) * 100000));
  
  const newData = [...currentData.slice(1), { ...lastItem, value: Math.floor(newValue) }];
  return newData;
};
