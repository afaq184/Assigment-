import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  CheckCircle, 
  Truck, 
  FileText, 
  Filter, 
  Search, 
  Plus, 
  ChevronRight,
  CreditCard,
  ShieldAlert,
  Package, 
  ArrowRight,
  X,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Ban,
  Printer,
  Mail,
  Check,
  XCircle,
  Send,
  MapPin,
  Trash2
} from 'lucide-react';
import { getSalesOrders, getInventoryItems } from '../services/mockData';
import { SalesOrder, OrderStatus, InventoryItem } from '../types';

const statusSteps: OrderStatus[] = [
  'Confirmed',
  'Credit Check',
  'Compliance Screening',
  'Warehouse Pick',
  'Shipped',
  'Invoiced'
];

const StatusTracker: React.FC<{ currentStatus: OrderStatus }> = ({ currentStatus }) => {
  const currentIndex = statusSteps.indexOf(currentStatus);

  return (
    <div className="w-full py-2 pl-2">
      {statusSteps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        let Icon = CheckCircle;
        if (step === 'Credit Check') Icon = CreditCard;
        if (step === 'Compliance Screening') Icon = ShieldAlert;
        if (step === 'Warehouse Pick') Icon = Package;
        if (step === 'Shipped') Icon = Truck;
        if (step === 'Invoiced') Icon = FileText;

        return (
          <div key={step} className="relative flex items-start">
            {/* Connector Line */}
            {index !== statusSteps.length - 1 && (
              <div 
                className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] z-0
                  ${index < currentIndex ? 'bg-indigo-600' : 'bg-slate-200'}
                `} 
              />
            )}

            {/* Icon Bubble */}
            <div 
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white flex-shrink-0
                ${isCompleted ? 'border-indigo-600 text-indigo-600' : 'border-slate-300 text-slate-300'}
                ${isCurrent ? 'ring-4 ring-indigo-100' : ''}
              `}
            >
              <Icon size={14} strokeWidth={isCompleted ? 2.5 : 2} />
            </div>

            {/* Label */}
            <div className={`ml-4 pt-1 pb-6 ${index === statusSteps.length - 1 ? 'pb-0' : ''}`}>
              <span 
                className={`text-sm font-medium block transition-colors
                  ${isCurrent ? 'text-indigo-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'}
                `}
              >
                {step}
              </span>
              {isCurrent && (
                <span className="text-xs text-indigo-500 mt-1 block font-medium animate-pulse">
                  In Progress...
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const SalesOrders: React.FC = () => {
  // Persistence State: Load from localStorage or fall back to mock data
  const [orders, setOrders] = useState<SalesOrder[]>(() => {
    try {
      const saved = localStorage.getItem('sales_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load orders", e);
    }
    return getSalesOrders();
  });

  // Save to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem('sales_orders', JSON.stringify(orders));
  }, [orders]);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Detailed Validation Status State
  const [validationStatus, setValidationStatus] = useState<{
    inventory: 'pending' | 'running' | 'success' | 'error';
    credit: 'pending' | 'running' | 'success' | 'error';
    compliance: 'pending' | 'running' | 'success' | 'error';
  }>({
    inventory: 'pending',
    credit: 'pending',
    compliance: 'pending'
  });

  // New Order Form State
  const [newOrder, setNewOrder] = useState<{
    customerName: string;
    channel: string;
    priority: string;
    amount: string;
    shippingAddress: string;
  }>({
    customerName: '',
    channel: 'Direct',
    priority: 'Normal',
    amount: '',
    shippingAddress: ''
  });

  // Action Modal States
  const [showInvoice, setShowInvoice] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Reset validation status when a new order is selected
  useEffect(() => {
    setValidationStatus({ inventory: 'pending', credit: 'pending', compliance: 'pending' });
    setValidationError(null);
    setIsProcessing(false);
  }, [selectedOrder?.id]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-700';
      case 'Credit Check': return 'bg-amber-100 text-amber-700';
      case 'Compliance Screening': return 'bg-purple-100 text-purple-700';
      case 'Warehouse Pick': return 'bg-orange-100 text-orange-700';
      case 'Shipped': return 'bg-emerald-100 text-emerald-700';
      case 'Invoiced': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const handleDeleteOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
        const updatedOrders = orders.filter(o => o.id !== id);
        setOrders(updatedOrders);
        if (selectedOrder?.id === id) {
            setSelectedOrder(null);
        }
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName || !newOrder.shippingAddress) {
      alert("Customer Name and Shipping Address are required");
      return;
    }

    const totalAmount = parseFloat(newOrder.amount) || 0;
    
    // Pick a random real item from ACTUAL inventory (from localStorage if available)
    let currentInventory: InventoryItem[] = [];
    const savedInv = localStorage.getItem('inventory_data');
    if (savedInv) {
      currentInventory = JSON.parse(savedInv);
    }
    // Fallback to mock if empty
    if (currentInventory.length === 0) {
      currentInventory = getInventoryItems();
    }

    const randomItem = currentInventory[Math.floor(Math.random() * currentInventory.length)];

    const newOrderObj: SalesOrder = {
      id: `so-${Date.now()}`,
      orderNumber: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: newOrder.customerName,
      channel: newOrder.channel as any,
      status: 'Confirmed',
      date: new Date().toISOString().split('T')[0],
      totalAmount: totalAmount,
      priority: newOrder.priority as 'Normal' | 'High' | 'Critical',
      shippingAddress: newOrder.shippingAddress,
      items: [
        {
          sku: randomItem.sku,
          name: randomItem.name,
          quantity: Math.floor(Math.random() * 5) + 1, // Random qty 1-5
          unitPrice: randomItem.unitPrice
        }
      ]
    };

    setOrders([newOrderObj, ...orders]);
    setIsCreateModalOpen(false);
    setNewOrder({ customerName: '', channel: 'Direct', priority: 'Normal', amount: '', shippingAddress: '' });
    // Automatically select the new order
    setSelectedOrder(newOrderObj);
  };

  const handleValidateAndProcess = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    setValidationError(null);
    setValidationStatus({ inventory: 'running', credit: 'pending', compliance: 'pending' });

    try {
      // 1. Load Inventory Data
      let currentInventory: InventoryItem[] = [];
      const savedInv = localStorage.getItem('inventory_data');
      if (savedInv) {
        currentInventory = JSON.parse(savedInv);
      } else {
        currentInventory = getInventoryItems(); // Fallback to mock
      }

      // Step 1: Inventory Check
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
      const invErrors: string[] = [];
      for (const orderItem of selectedOrder.items) {
        const invItem = currentInventory.find(i => i.sku === orderItem.sku);
        if (!invItem) {
          invErrors.push(`SKU not found: ${orderItem.sku}`);
          continue;
        }
        const availableStock = invItem.onHand - invItem.allocated;
        if (availableStock < orderItem.quantity) {
          invErrors.push(`Insufficient stock for ${orderItem.name}. Need ${orderItem.quantity}, Available ${availableStock}.`);
        }
      }

      if (invErrors.length > 0) {
        setValidationStatus(prev => ({ ...prev, inventory: 'error' }));
        setValidationError(invErrors.join("\n"));
        setIsProcessing(false);
        return;
      }
      setValidationStatus(prev => ({ ...prev, inventory: 'success', credit: 'running' }));

      // Step 2: Credit Check (Simulated)
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Logic: Random fail if amount > 50,000 for demo, otherwise pass
      const creditScore = selectedOrder.totalAmount > 50000000 ? Math.random() : 1;
      if (creditScore < 0.2) {
        setValidationStatus(prev => ({ ...prev, credit: 'error' }));
        setValidationError("Customer failed automated credit check.");
        setIsProcessing(false);
        return;
      }
      setValidationStatus(prev => ({ ...prev, credit: 'success', compliance: 'running' }));

      // Step 3: Compliance Check (Simulated)
      await new Promise(resolve => setTimeout(resolve, 800));
      if (selectedOrder.priority === 'Critical' && Math.random() > 0.95) {
        setValidationStatus(prev => ({ ...prev, compliance: 'error' }));
        setValidationError("Compliance screening flagged potential export restriction.");
        setIsProcessing(false);
        return;
      }
      setValidationStatus(prev => ({ ...prev, compliance: 'success' }));

      // 4. Execution: Allocate Stock & Update Order
      const updatedInventory = currentInventory.map(item => {
        const orderItem = selectedOrder.items.find(oi => oi.sku === item.sku);
        if (orderItem) {
          return { ...item, allocated: item.allocated + orderItem.quantity };
        }
        return item;
      });
      localStorage.setItem('inventory_data', JSON.stringify(updatedInventory));

      const updatedOrders = orders.map(o => 
        o.id === selectedOrder.id ? { ...o, status: 'Warehouse Pick' as OrderStatus } : o
      );
      
      setOrders(updatedOrders);
      setSelectedOrder({ ...selectedOrder, status: 'Warehouse Pick' });
      
    } catch (err) {
      console.error(err);
      setValidationError("System error during validation process.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintInvoice = () => {
    if(!selectedOrder) return;
    setShowInvoice(true);
  };

  const handleContactCustomer = () => {
    if(!selectedOrder) return;
    setEmailSubject(`Update regarding Order ${selectedOrder.orderNumber}`);
    setEmailBody(`Dear ${selectedOrder.customerName},\n\nThis is an update regarding your order placed on ${selectedOrder.date}.\n\nCurrent Status: ${selectedOrder.status}\n\nThank you for your business.\n\nRegards,\nSales Team`);
    setShowContact(true);
  };

  const performSendEmail = () => {
      setIsSendingEmail(true);
      setTimeout(() => {
          setIsSendingEmail(false);
          setShowContact(false);
          alert(`Message sent successfully to ${selectedOrder?.customerName}`);
      }, 1000);
  };

  return (
    <div className="animate-fade-in relative">
      {/* Header - Sticky with adjusted margins to fit parent padding */}
      <div className="sticky -top-4 lg:-top-8 z-20 bg-slate-50 -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 shadow-sm mb-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sales & Order Processing</h2>
            <p className="text-slate-500 text-sm">Consolidated multi-channel order management and lifecycle tracking.</p>
          </div>
          <div className="flex space-x-3">
            <button 
              type="button"
              onClick={() => setShowFilters(prev => !prev)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors shadow-sm ${showFilters ? 'bg-slate-100 border-slate-400 text-slate-900' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              <Filter size={18} />
              <span>{showFilters ? 'Hide Filters' : 'Filter'}</span>
            </button>
            <button 
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Create Order</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Approval</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {orders.filter(o => o.status === 'Credit Check' || o.status === 'Compliance Screening').length}
                </h3>
              </div>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <ShieldAlert size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Warehouse Pick</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {orders.filter(o => o.status === 'Warehouse Pick').length}
                </h3>
              </div>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Package size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Ready to Ship</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {orders.filter(o => o.status === 'Shipped').length}
                </h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Truck size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                <h3 className="text-xl font-bold text-emerald-700 mt-1 truncate">
                  PKR {orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShoppingCart size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Toolbar */}
            {showFilters && (
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search Order # or Customer..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'All')}
                  className="bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                  <option value="All">All Statuses</option>
                  {statusSteps.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Order Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className={`
                        cursor-pointer transition-colors
                        ${selectedOrder?.id === order.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}
                      `}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                              {order.channel}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{order.orderNumber}</div>
                            <div className="text-xs text-slate-500">{order.customerName} • {order.date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        PKR {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="text-slate-400 hover:text-indigo-600 p-1 rounded-full hover:bg-slate-100">
                            <ChevronRight size={20} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteOrder(order.id, e)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-rose-50"
                            title="Delete Order"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No orders found. Create a new one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Details Panel */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-full overflow-y-auto">
            {selectedOrder ? (
              <div className="space-y-6 animate-fade-in relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedOrder.orderNumber}</h3>
                    <p className="text-sm text-slate-500">{selectedOrder.customerName}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold border ${selectedOrder.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {selectedOrder.priority} Priority
                  </div>
                </div>

                {/* Shipping Address Display */}
                <div className="flex items-start space-x-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <MapPin size={16} className="mt-0.5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700 block text-xs uppercase mb-1">Shipping Destination</span>
                    <p>{selectedOrder.shippingAddress || 'No address provided'}</p>
                  </div>
                </div>

                {/* Status Tracker (Vertical) */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lifecycle Tracker</h4>
                  <StatusTracker currentStatus={selectedOrder.status} />
                </div>

                {/* Validation Error Banner */}
                {validationError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start space-x-3 text-sm animate-fade-in">
                    <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                    <div className="text-rose-700 whitespace-pre-line">{validationError}</div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                      <Package size={16} className="mr-2 text-indigo-600" />
                      Order Items
                  </h4>
                  {selectedOrder.items.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                              <div className="font-medium text-slate-900">{item.name}</div>
                              <div className="text-xs text-slate-500">SKU: {item.sku}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-slate-900">x{item.quantity}</div>
                              <div className="text-xs text-slate-500">Rs. {item.unitPrice.toLocaleString()}</div>
                            </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                      <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-100">
                        No line items specified.
                      </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="font-medium text-slate-700">Total</span>
                      <span className="text-lg font-bold text-slate-900">PKR {selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Automated Validation Visuals */}
                {selectedOrder.status === 'Confirmed' && (
                  <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                      <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">Pending Validation Checks</h5>
                      <div className="space-y-3">
                          <div className="flex items-center text-sm text-slate-600 justify-between">
                              <span className="flex items-center">
                                {validationStatus.inventory === 'pending' && <div className="w-4 h-4 rounded-full border border-slate-300 mr-2"></div>}
                                {validationStatus.inventory === 'running' && <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" />}
                                {validationStatus.inventory === 'success' && <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />}
                                {validationStatus.inventory === 'error' && <XCircle className="w-4 h-4 mr-2 text-rose-600" />}
                                Inventory Availability Check
                              </span>
                              <span className="text-xs font-mono">{validationStatus.inventory.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-600 justify-between">
                              <span className="flex items-center">
                                {validationStatus.credit === 'pending' && <div className="w-4 h-4 rounded-full border border-slate-300 mr-2"></div>}
                                {validationStatus.credit === 'running' && <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" />}
                                {validationStatus.credit === 'success' && <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />}
                                {validationStatus.credit === 'error' && <XCircle className="w-4 h-4 mr-2 text-rose-600" />}
                                Financial Credit Screening
                              </span>
                              <span className="text-xs font-mono">{validationStatus.credit.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-600 justify-between">
                              <span className="flex items-center">
                                {validationStatus.compliance === 'pending' && <div className="w-4 h-4 rounded-full border border-slate-300 mr-2"></div>}
                                {validationStatus.compliance === 'running' && <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" />}
                                {validationStatus.compliance === 'success' && <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />}
                                {validationStatus.compliance === 'error' && <XCircle className="w-4 h-4 mr-2 text-rose-600" />}
                                Trade Compliance Check
                              </span>
                              <span className="text-xs font-mono">{validationStatus.compliance.toUpperCase()}</span>
                          </div>
                      </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="pt-4 mt-auto space-y-3">
                  {selectedOrder.status === 'Confirmed' ? (
                    <button 
                      onClick={handleValidateAndProcess}
                      disabled={isProcessing}
                      className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center text-white
                          ${isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'}
                      `}
                    >
                      {isProcessing ? (
                          <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              Validating & Processing...
                          </>
                      ) : (
                          <>
                              Validate & Initiate Fulfillment <ShieldCheck size={16} className="ml-2" />
                          </>
                      )}
                    </button>
                  ) : (
                    <div>
                      <button 
                        disabled={true}
                        className="w-full bg-slate-100 text-slate-400 py-2.5 rounded-lg font-medium flex items-center justify-center cursor-not-allowed"
                      >
                        {selectedOrder.status === 'Warehouse Pick' ? 'Picking Request Sent' : 'Workflow Completed'} <CheckCircle size={16} className="ml-2" />
                      </button>
                      {selectedOrder.status === 'Warehouse Pick' && (
                          <p className="text-xs text-center text-emerald-600 mt-1 font-medium">Order is now visible in Warehouse Module</p>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handlePrintInvoice}
                      className="py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-center"
                    >
                      <Printer size={16} className="mr-2 text-slate-500" /> Print Invoice
                    </button>
                    <button 
                      onClick={handleContactCustomer}
                      className="py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-center"
                    >
                      <Mail size={16} className="mr-2 text-slate-500" /> Contact Customer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-600">Select an Order</h3>
                <p className="text-sm max-w-xs mt-2">Click on an order from the list to view its lifecycle status and line items.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Create New Order</h3>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form id="create-order-form" onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shipping Address</label>
                  <textarea
                    required
                    rows={2}
                    value={newOrder.shippingAddress}
                    onChange={(e) => setNewOrder({...newOrder, shippingAddress: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Enter full shipping address..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sales Channel</label>
                  <select
                    value={newOrder.channel}
                    onChange={(e) => setNewOrder({...newOrder, channel: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="Direct">Direct</option>
                    <option value="CRM">CRM</option>
                    <option value="Web">Web</option>
                    <option value="EDI">EDI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({...newOrder, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newOrder.amount}
                    onChange={(e) => setNewOrder({...newOrder, amount: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                   Note: Order will be created with status <strong>Confirmed</strong>. You must <strong>Validate</strong> it to send to Warehouse.
                </p>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-order-form"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Commercial Invoice Preview</h3>
              <button onClick={() => setShowInvoice(false)}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            <div className="p-8 overflow-y-auto bg-white flex-1" id="invoice-area">
              <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">INVOICE</h1>
                  <p className="text-slate-500">#{selectedOrder.orderNumber}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl text-indigo-600">BAREERA INTL.</div>
                  <p className="text-sm text-slate-500">Global Trading Suite</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bill To</p>
                  <p className="font-bold text-slate-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-slate-500 mb-1">{selectedOrder.shippingAddress || 'Address not on file'}</p>
                  <p className="text-sm text-slate-500">Channel: {selectedOrder.channel}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Details</p>
                  <p className="text-sm text-slate-700">Date: {selectedOrder.date}</p>
                  <p className="text-sm text-slate-700">Priority: {selectedOrder.priority}</p>
                </div>
              </div>
              <table className="w-full mb-8">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="py-2 text-left text-xs font-bold text-slate-500 uppercase">Item</th>
                    <th className="py-2 text-center text-xs font-bold text-slate-500 uppercase">Qty</th>
                    <th className="py-2 text-right text-xs font-bold text-slate-500 uppercase">Price</th>
                    <th className="py-2 text-right text-xs font-bold text-slate-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 text-sm text-slate-900">{item.name} <span className="text-slate-400 text-xs block">{item.sku}</span></td>
                      <td className="py-3 text-center text-sm text-slate-700">{item.quantity}</td>
                      <td className="py-3 text-right text-sm text-slate-700">{item.unitPrice.toLocaleString()}</td>
                      <td className="py-3 text-right text-sm font-medium text-slate-900">{(item.quantity * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end">
                <div className="w-1/2 border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-900 font-medium">PKR {selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">Tax (0%)</span>
                    <span className="text-slate-900 font-medium">PKR 0</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-900">Total</span>
                    <span className="text-indigo-600">PKR {selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button onClick={() => setShowInvoice(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors">Close</button>
              <button onClick={() => { alert('Sent to printer successfully.'); setShowInvoice(false); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-sm">
                <Printer size={16} className="mr-2" /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Contact Customer</h3>
              <button onClick={() => setShowContact(false)}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                <input type="text" value={selectedOrder.customerName} disabled className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea rows={6} value={emailBody} onChange={e => setEmailBody(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button onClick={() => setShowContact(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors">Cancel</button>
              <button onClick={performSendEmail} disabled={isSendingEmail} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-sm disabled:opacity-70">
                {isSendingEmail ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                {isSendingEmail ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};