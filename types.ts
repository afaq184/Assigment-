
export enum View {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  SALES = 'SALES',
  WAREHOUSE = 'WAREHOUSE',
  LOGISTICS = 'LOGISTICS',
  PROFILE = 'PROFILE'
}

export interface AdminProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  location: string;
  bio: string;
  lastLogin: string;
  avatarUrl?: string; // Optional URL or Base64 string for profile picture
}

export interface KPI {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  iconName: string;
  sentiment?: 'positive' | 'negative' | 'neutral'; // Explicit sentiment override
}

export interface SystemStatus {
  id: string;
  module: string;
  status: 'operational' | 'degraded' | 'down';
  lastSync: string;
  message: string;
  latency: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  secondary?: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  type: 'order' | 'inventory' | 'system';
}

export interface GeminiInsight {
  summary: string;
  actionableItems: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface Shipment {
  id: string;
  trackingId: string;
  destination: string;
  recipient: string;
  status: 'In Transit' | 'Pending' | 'Delivered' | 'Delayed' | 'Exception';
  eta: string;
  carrier: string;
  type: 'Outbound' | 'Inbound';
  linkedOrderId?: string; // Link back to Sales Order
}

export interface BatchInfo {
  id: string;
  batchNumber: string;
  lotNumber: string;
  expiryDate: string; // ISO Date
  quantity: number;
  complianceStatus: 'Compliant' | 'Non-Compliant' | 'Pending Review';
  receivedDate: string;
}

export interface ComplianceInfo {
  tariffCode: string; // HS Code
  countryOfOrigin: string;
  regulatoryCategory: string; // e.g., 'RoHS', 'FCC', 'CE'
  lastAuditDate: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  onHand: number;     // Physically in the warehouse
  allocated: number;  // Reserved for confirmed orders
  reorderPoint: number; // Threshold for low stock alert
  unitPrice: number;
  location: string;
  compliance: ComplianceInfo;
  batches: BatchInfo[];
}

export type OrderStatus = 'Confirmed' | 'Credit Check' | 'Compliance Screening' | 'Warehouse Pick' | 'Shipped' | 'Invoiced';

export interface OrderItem {
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
}

export interface SalesOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    channel: 'CRM' | 'Web' | 'Direct' | 'EDI';
    status: OrderStatus;
    date: string;
    totalAmount: number;
    items: OrderItem[];
    priority: 'Normal' | 'High' | 'Critical';
    shippingAddress?: string; // Added field
}

// --- Warehouse Types ---

export interface POItem {
  sku: string;
  name: string;
  expectedQty: number;
  receivedQty: number;
  status: 'Pending' | 'Received';
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  expectedDate: string;
  status: 'Pending' | 'Partial' | 'Completed';
  items: POItem[];
}

export interface PutawayTask {
  id: string;
  poNumber: string;
  sku: string;
  productName: string;
  batchNumber: string;
  quantity: number;
  sourceLocation: string;
  suggestedLocation: string;
  status: 'Pending' | 'Completed';
  priority: 'High' | 'Normal';
}

export type PickStrategy = 'Wave' | 'Batch' | 'Zone';

export interface PickingTask {
  id: string; // Unique task ID
  orderId: string;
  orderNumber: string;
  sku: string;
  productName: string;
  location: string;
  quantity: number;
  zone: string;
  status: 'Pending' | 'Picked';
  priority: 'Normal' | 'High' | 'Critical';
}

// --- Logistics Types ---

export type ReturnStatus = 'Requested' | 'Received' | 'QC Inspection' | 'Approved' | 'Rejected' | 'Completed';
export type ReturnAction = 'Restock' | 'Repair' | 'Disposal' | 'Refund Only' | 'Pending';

export interface ReturnRequest {
  id: string;
  rmaNumber: string;
  orderNumber: string;
  customerName: string;
  requestDate: string;
  status: ReturnStatus;
  reason: string;
  items: { sku: string; name: string; qty: number; condition?: string }[];
  qcNotes?: string;
  finalAction: ReturnAction;
}

export interface ExportDoc {
  id: string;
  shipmentId: string;
  trackingId: string;
  type: 'Commercial Invoice' | 'Packing List' | 'Bill of Lading' | 'Shipping Label';
  dateGenerated: string;
  status: 'Generated' | 'Filed' | 'Pending';
  destinationCountry: string;
}
