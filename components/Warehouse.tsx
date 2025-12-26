import React, { useState, useEffect, useMemo } from 'react';
import { 
  Warehouse as WarehouseIcon, 
  ArrowDownCircle, 
  ArrowRight, 
  CheckCircle, 
  Clipboard, 
  Package, 
  Truck, 
  Search, 
  AlertCircle,
  ScanLine,
  MapPin,
  Clock,
  X,
  Box,
  Layers,
  List,
  Grid,
  Plus,
  Trash2
} from 'lucide-react';
import { getPurchaseOrders, getInventoryItems, getSalesOrders } from '../services/mockData';
import { PurchaseOrder, PutawayTask, InventoryItem, POItem, SalesOrder, PickingTask, PickStrategy } from '../types';

export const Warehouse: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbound' | 'putaway' | 'outbound'>('inbound');
  const [outboundTab, setOutboundTab] = useState<'picking' | 'packing'>('picking');
  
  // -- Data State --
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem('warehouse_pos');
      return saved ? JSON.parse(saved) : getPurchaseOrders();
    } catch(e) { return getPurchaseOrders(); }
  });

  const [putawayTasks, setPutawayTasks] = useState<PutawayTask[]>(() => {
    const saved = localStorage.getItem('warehouse_putaway');
    return saved ? JSON.parse(saved) : [];
  });

  // Load Sales Orders for Outbound Logic
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => {
     try {
        const saved = localStorage.getItem('sales_orders');
        return saved ? JSON.parse(saved) : getSalesOrders();
     } catch(e) { return getSalesOrders(); }
  });

  // Inventory Data for Dropdowns
  const [availableProducts, setAvailableProducts] = useState<InventoryItem[]>([]);

  // Local Tracking of Picked Items (In a real app, this would be DB backed)
  // Map of TaskID -> Boolean
  const [completedPicks, setCompletedPicks] = useState<Record<string, boolean>>({});

  // -- UI State --
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receivingItem, setReceivingItem] = useState<POItem | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  
  // Create Operation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOperation, setNewOperation] = useState({
    type: 'Inbound Shipment',
    supplier: '',
    expectedDate: new Date().toISOString().split('T')[0],
    items: [] as { sku: string; qty: number }[]
  });

  // Picking UI
  const [pickStrategy, setPickStrategy] = useState<PickStrategy>('Wave');
  const [pickingTaskToValidate, setPickingTaskToValidate] = useState<PickingTask | null>(null);
  const [pickValidation, setPickValidation] = useState({ scannedLocation: '', scannedSku: '' });

  // Packing UI
  const [orderToPack, setOrderToPack] = useState<SalesOrder | null>(null);
  const [packedItems, setPackedItems] = useState<Set<string>>(new Set()); // Set of SKU-strings

  // Receiving Form State
  const [receiveForm, setReceiveForm] = useState({
    qty: 0,
    qualityStatus: 'Passed',
    batchNumber: '',
    lotNumber: '',
    expiryDate: ''
  });

  // -- Effects --
  useEffect(() => {
    localStorage.setItem('warehouse_pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('warehouse_putaway', JSON.stringify(putawayTasks));
  }, [putawayTasks]);

  useEffect(() => {
    // Sync back sales order changes if we update status to Shipped
    localStorage.setItem('sales_orders', JSON.stringify(salesOrders));
  }, [salesOrders]);

  useEffect(() => {
    // Load inventory for create operation dropdown
    try {
        const saved = localStorage.getItem('inventory_data');
        if (saved) setAvailableProducts(JSON.parse(saved));
        else setAvailableProducts(getInventoryItems());
    } catch(e) {
        setAvailableProducts(getInventoryItems());
    }
  }, []);


  // -- Inbound Handlers --

  const handleOpenReceive = (po: PurchaseOrder, item: POItem) => {
    setSelectedPO(po);
    setReceivingItem(item);
    setReceiveForm({
      qty: item.expectedQty - item.receivedQty,
      qualityStatus: 'Passed',
      batchNumber: `BN-${Math.floor(Math.random() * 9000) + 1000}`,
      lotNumber: `L-${Math.floor(Math.random() * 9000) + 1000}`,
      expiryDate: ''
    });
    setShowReceiveModal(true);
  };

  const handleDeletePO = (id: string) => {
      if(window.confirm('Are you sure you want to delete this operation? This action cannot be undone.')) {
          setPurchaseOrders(purchaseOrders.filter(p => p.id !== id));
      }
  };

  const handleConfirmReceipt = () => {
    if (!selectedPO || !receivingItem) return;

    // Update Inventory (Mock)
    const storedInventory = localStorage.getItem('inventory_data');
    let inventory: InventoryItem[] = storedInventory ? JSON.parse(storedInventory) : getInventoryItems();
    
    let invItemIndex = inventory.findIndex(i => i.sku === receivingItem.sku);
    let targetLocation = 'Zone A-01'; 

    if (invItemIndex >= 0) {
      inventory[invItemIndex].onHand += receiveForm.qty;
      targetLocation = inventory[invItemIndex].location;
      inventory[invItemIndex].batches.push({
        id: `b-${Date.now()}`,
        batchNumber: receiveForm.batchNumber,
        lotNumber: receiveForm.lotNumber,
        expiryDate: receiveForm.expiryDate || 'N/A',
        quantity: receiveForm.qty,
        complianceStatus: 'Pending Review',
        receivedDate: new Date().toISOString().split('T')[0]
      });
    }

    localStorage.setItem('inventory_data', JSON.stringify(inventory));

    // Create Putaway Task
    const newTask: PutawayTask = {
      id: `task-${Date.now()}`,
      poNumber: selectedPO.poNumber,
      sku: receivingItem.sku,
      productName: receivingItem.name,
      batchNumber: receiveForm.batchNumber,
      quantity: receiveForm.qty,
      sourceLocation: 'Receiving Dock',
      suggestedLocation: targetLocation,
      status: 'Pending',
      priority: 'Normal'
    };
    setPutawayTasks([...putawayTasks, newTask]);

    // Update PO
    const updatedPOs = purchaseOrders.map(po => {
      if (po.id === selectedPO.id) {
        const updatedItems = po.items.map(item => {
          if (item.sku === receivingItem.sku) {
            return { 
              ...item, 
              receivedQty: item.receivedQty + receiveForm.qty,
              status: (item.receivedQty + receiveForm.qty) >= item.expectedQty ? 'Received' : 'Pending'
            } as POItem;
          }
          return item;
        });

        const allReceived = updatedItems.every(i => i.status === 'Received');
        return { ...po, items: updatedItems, status: allReceived ? 'Completed' : 'Partial' } as PurchaseOrder;
      }
      return po;
    });

    setPurchaseOrders(updatedPOs);
    setShowReceiveModal(false);
    setSelectedPO(null);
    setReceivingItem(null);
  };

  const handleCompletePutaway = (taskId: string) => {
    setPutawayTasks(putawayTasks.filter(t => t.id !== taskId));
  };

  // -- Outbound Logic --

  // Generate Picking Tasks from "Warehouse Pick" orders
  const pickingTasks: PickingTask[] = useMemo(() => {
    const tasks: PickingTask[] = [];
    const invData: InventoryItem[] = JSON.parse(localStorage.getItem('inventory_data') || '[]');
    const mockInv = getInventoryItems(); // Fallback

    salesOrders.filter(o => o.status === 'Warehouse Pick').forEach(order => {
      order.items.forEach((item, idx) => {
         // Find location
         const invItem = invData.find(i => i.sku === item.sku) || mockInv.find(i => i.sku === item.sku);
         const location = invItem?.location || 'Unknown';
         const zone = location.split('-')[0] || 'Zone A';

         tasks.push({
           id: `${order.id}-item-${idx}`,
           orderId: order.id,
           orderNumber: order.orderNumber,
           sku: item.sku,
           productName: item.name,
           location: location,
           quantity: item.quantity,
           zone: zone,
           status: completedPicks[`${order.id}-item-${idx}`] ? 'Picked' : 'Pending',
           priority: order.priority
         });
      });
    });
    return tasks;
  }, [salesOrders, completedPicks]);

  // Group Tasks based on Strategy
  const groupedTasks = useMemo(() => {
    if (pickStrategy === 'Batch') {
      // Group by SKU
      const groups: Record<string, PickingTask[]> = {};
      pickingTasks.filter(t => t.status === 'Pending').forEach(task => {
        if (!groups[task.sku]) groups[task.sku] = [];
        groups[task.sku].push(task);
      });
      return Object.entries(groups).map(([key, tasks]) => ({ title: `SKU Batch: ${key}`, tasks }));
    } else if (pickStrategy === 'Zone') {
      // Group by Zone
      const groups: Record<string, PickingTask[]> = {};
      pickingTasks.filter(t => t.status === 'Pending').forEach(task => {
        if (!groups[task.zone]) groups[task.zone] = [];
        groups[task.zone].push(task);
      });
      return Object.entries(groups).map(([key, tasks]) => ({ title: `${key} Picking List`, tasks }));
    } else {
      // Wave / Default (Group by Priority / Order)
      const groups: Record<string, PickingTask[]> = {};
      pickingTasks.filter(t => t.status === 'Pending').forEach(task => {
        const key = `${task.priority} Priority Wave`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
      });
      return Object.entries(groups).sort().reverse().map(([key, tasks]) => ({ title: key, tasks }));
    }
  }, [pickingTasks, pickStrategy]);

  // Orders ready for Packing (All tasks picked)
  const packingReadyOrders = useMemo(() => {
     return salesOrders.filter(order => {
       if (order.status !== 'Warehouse Pick') return false;
       // Check if all items correspond to a completed pick task
       const totalItems = order.items.length;
       const pickedItems = order.items.filter((_, idx) => completedPicks[`${order.id}-item-${idx}`]).length;
       return totalItems > 0 && totalItems === pickedItems;
     });
  }, [salesOrders, completedPicks]);

  // Handlers for Outbound
  const initiatePick = (task: PickingTask) => {
    setPickingTaskToValidate(task);
    // Auto-fill for demo purposes (UX improvement: keep empty in real app)
    setPickValidation({ scannedLocation: task.location, scannedSku: task.sku });
  };

  const confirmPick = () => {
    if (!pickingTaskToValidate) return;
    if (pickValidation.scannedLocation !== pickingTaskToValidate.location || pickValidation.scannedSku !== pickingTaskToValidate.sku) {
      alert("Validation Failed: Location or SKU does not match.");
      return;
    }
    
    setCompletedPicks(prev => ({ ...prev, [pickingTaskToValidate.id]: true }));
    setPickingTaskToValidate(null);
  };

  const openPackingGate = (order: SalesOrder) => {
    setOrderToPack(order);
    setPackedItems(new Set());
  };

  const togglePackItem = (sku: string) => {
    setPackedItems(prev => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const finalizeShipment = () => {
    if (!orderToPack) return;
    // Update Order Status to Shipped
    const updatedOrders = salesOrders.map(o => 
      o.id === orderToPack.id ? { ...o, status: 'Shipped' as const } : o
    );
    setSalesOrders(updatedOrders);
    setOrderToPack(null);
  };

  // -- Create Operation Handlers --
  const handleAddLineItem = () => {
    if (availableProducts.length === 0) return;
    setNewOperation({
        ...newOperation,
        items: [...newOperation.items, { sku: availableProducts[0].sku, qty: 1 }]
    });
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = [...newOperation.items];
    updated.splice(index, 1);
    setNewOperation({...newOperation, items: updated});
  };

  const handleLineItemChange = (index: number, field: 'sku' | 'qty', value: string | number) => {
    const updated = [...newOperation.items];
    // @ts-ignore
    updated[index] = { ...updated[index], [field]: value };
    setNewOperation({...newOperation, items: updated});
  };

  const submitNewOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOperation.supplier || newOperation.items.length === 0) {
        alert("Please provide supplier and at least one item.");
        return;
    }

    // Determine prefix based on type
    const prefix = newOperation.type === 'Emergency Stock Replenishment' ? 'URG' : 'PO';
    
    const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber: `${prefix}-${Math.floor(Math.random() * 10000)}`,
        supplier: newOperation.supplier,
        expectedDate: newOperation.expectedDate,
        status: 'Pending',
        items: newOperation.items.map(item => {
            const product = availableProducts.find(p => p.sku === item.sku);
            return {
                sku: item.sku,
                name: product?.name || 'Unknown Item',
                expectedQty: Number(item.qty),
                receivedQty: 0,
                status: 'Pending'
            };
        })
    };

    const updatedOrders = [newPO, ...purchaseOrders];
    setPurchaseOrders(updatedOrders);
    
    setIsCreateModalOpen(false);
    setNewOperation({ 
        type: 'Inbound Shipment', 
        supplier: '', 
        expectedDate: new Date().toISOString().split('T')[0], 
        items: [] 
    });
    setActiveTab('inbound'); // Switch to view the new op
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Warehouse Operations</h2>
          <p className="text-slate-500 text-sm">Inbound receiving, putaway directives, picking optimization, and packing.</p>
        </div>
        <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
            <Plus size={18} />
            <span>Create Operation</span>
        </button>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inbound')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${activeTab === 'inbound'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            <Truck size={18} className="mr-2" />
            Inbound / Receiving
            {purchaseOrders.filter(p => p.status !== 'Completed').length > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs py-0.5 px-2 rounded-full">
                {purchaseOrders.filter(p => p.status !== 'Completed').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('putaway')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${activeTab === 'putaway'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            <MapPin size={18} className="mr-2" />
            Putaway Directives
            {putawayTasks.length > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-600 text-xs py-0.5 px-2 rounded-full">
                {putawayTasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${activeTab === 'outbound'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            <Box size={18} className="mr-2" />
            Outbound Fulfillment
            {pickingTasks.filter(t => t.status === 'Pending').length > 0 && (
              <span className="ml-2 bg-rose-100 text-rose-600 text-xs py-0.5 px-2 rounded-full">
                {pickingTasks.filter(t => t.status === 'Pending').length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* --- INBOUND TAB --- */}
      {activeTab === 'inbound' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-6">
            {purchaseOrders.filter(po => po.status !== 'Completed').length === 0 ? (
               <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                 <CheckCircle size={48} className="mx-auto text-emerald-200 mb-4" />
                 <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                 <p className="text-slate-500">No pending inbound shipments.</p>
               </div>
            ) : (
              purchaseOrders.filter(po => po.status !== 'Completed').map(po => (
                <div key={po.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded text-sm">{po.poNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          po.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {po.status === 'Partial' ? 'Receiving in Progress' : 'Awaiting Arrival'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1 flex items-center">
                        <span className="font-medium text-slate-700 mr-2">{po.supplier}</span>
                        <span>• Expected: {po.expectedDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center">
                         <Package size={16} className="mr-1" /> {po.items.length} Items
                      </div>
                      <button 
                        onClick={() => handleDeletePO(po.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-rose-50 transition-colors"
                        title="Delete Operation"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {po.items.map((item, idx) => (
                      <div key={idx} className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex-1">
                           <h4 className="font-medium text-slate-900">{item.name}</h4>
                           <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
                             <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{item.sku}</span>
                             <span>Expected: {item.expectedQty}</span>
                             <span>Received: {item.receivedQty}</span>
                           </div>
                           {/* Progress Bar */}
                           <div className="mt-2 w-full max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500" 
                                style={{ width: `${Math.min(100, (item.receivedQty / item.expectedQty) * 100)}%` }}
                              ></div>
                           </div>
                        </div>
                        <div>
                          {item.status === 'Received' ? (
                            <span className="flex items-center text-emerald-600 font-medium text-sm bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                              <CheckCircle size={16} className="mr-2" /> Received
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleOpenReceive(po, item)}
                              className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                              <Clipboard size={16} className="mr-2" /> Verify & Receive
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- PUTAWAY TAB --- */}
      {activeTab === 'putaway' && (
        <div className="space-y-6 animate-fade-in">
           {putawayTasks.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
               <WarehouseIcon size={48} className="mx-auto text-slate-300 mb-4" />
               <h3 className="text-lg font-medium text-slate-900">No active directives</h3>
               <p className="text-slate-500">Receiving dock is clear. Good job!</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {putawayTasks.map(task => (
                 <div key={task.id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full border-l-4 border-l-amber-400">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 block">Putaway Task</span>
                        <h4 className="font-bold text-slate-900">{task.productName}</h4>
                        <div className="text-xs text-slate-500">{task.sku}</div>
                      </div>
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                         <ScanLine size={20} />
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 space-y-2 mb-4">
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-500">From:</span>
                          <span className="font-medium text-slate-700">{task.sourceLocation}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Suggested To:</span>
                          <span className="font-bold text-indigo-700 flex items-center">
                            {task.suggestedLocation} <MapPin size={12} className="ml-1" />
                          </span>
                       </div>
                       <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                          <span className="text-slate-500">Qty:</span>
                          <span className="font-medium text-slate-900">{task.quantity}</span>
                       </div>
                    </div>

                    <div className="mt-auto">
                      <button 
                        onClick={() => handleCompletePutaway(task.id)}
                        className="w-full flex items-center justify-center py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all group"
                      >
                         <CheckCircle size={18} className="mr-2 text-slate-400 group-hover:text-emerald-500" />
                         Confirm Putaway
                      </button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {/* --- OUTBOUND TAB --- */}
      {activeTab === 'outbound' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub Navigation */}
          <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg w-fit">
            <button 
              onClick={() => setOutboundTab('picking')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                outboundTab === 'picking' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Picking Dashboard
            </button>
            <button 
               onClick={() => setOutboundTab('packing')}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                outboundTab === 'packing' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Packing Station
            </button>
          </div>

          {/* Picking View */}
          {outboundTab === 'picking' && (
            <div className="space-y-6">
              {/* Strategy Selector */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">Picking Strategy</h3>
                  <p className="text-sm text-slate-500">Select optimization method for task generation.</p>
                </div>
                <div className="flex space-x-2">
                   {(['Wave', 'Batch', 'Zone'] as const).map(strat => (
                     <button
                       key={strat}
                       onClick={() => setPickStrategy(strat)}
                       className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center transition-colors ${
                         pickStrategy === strat 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                       }`}
                     >
                       {strat === 'Wave' && <Layers size={16} className="mr-2" />}
                       {strat === 'Batch' && <List size={16} className="mr-2" />}
                       {strat === 'Zone' && <Grid size={16} className="mr-2" />}
                       {strat} Picking
                     </button>
                   ))}
                </div>
              </div>

              {/* Task List */}
              {groupedTasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                  <CheckCircle size={48} className="mx-auto text-emerald-200 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">No active picking tasks</h3>
                  <p className="text-slate-500 mb-4">All outbound orders have been picked.</p>
                  <p className="text-sm text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded">
                    Waiting for tasks? Ensure orders in <strong>Sales Module</strong> are validated and set to 'Warehouse Pick'.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedTasks.map((group, gIdx) => (
                    <div key={gIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 font-semibold text-slate-800 flex justify-between items-center">
                        <span>{group.title}</span>
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{group.tasks.length} tasks</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {group.tasks.map((task) => (
                          <div key={task.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                               <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg shrink-0">
                                 {task.quantity}
                               </div>
                               <div>
                                 <h4 className="font-bold text-slate-900">{task.productName}</h4>
                                 <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                                   <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">{task.sku}</span>
                                   <span className="flex items-center text-slate-500"><MapPin size={12} className="mr-1"/> {task.location}</span>
                                   <span className="text-slate-400">Order: {task.orderNumber}</span>
                                 </div>
                               </div>
                            </div>
                            <button 
                              onClick={() => initiatePick(task)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm flex items-center"
                            >
                              <ScanLine size={16} className="mr-2" /> Scan & Confirm
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Packing View */}
          {outboundTab === 'packing' && (
            <div className="space-y-6">
              {packingReadyOrders.length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                   <Package size={48} className="mx-auto text-slate-300 mb-4" />
                   <h3 className="text-lg font-medium text-slate-900">Packing Queue Empty</h3>
                   <p className="text-slate-500">Wait for picking tasks to be completed.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packingReadyOrders.map(order => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 block">Ready to Pack</span>
                           <h4 className="font-bold text-slate-900">{order.orderNumber}</h4>
                           <div className="text-xs text-slate-500">{order.customerName}</div>
                         </div>
                         <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                            <Box size={20} />
                         </div>
                       </div>
                       
                       <div className="flex-1">
                         <div className="text-sm text-slate-600 mb-2">Items to Pack:</div>
                         <div className="space-y-1">
                           {order.items.map((item, i) => (
                             <div key={i} className="flex justify-between text-xs bg-slate-50 p-2 rounded border border-slate-100">
                               <span className="truncate flex-1 mr-2">{item.name}</span>
                               <span className="font-bold">x{item.quantity}</span>
                             </div>
                           ))}
                         </div>
                       </div>

                       <div className="mt-4 pt-4 border-t border-slate-100">
                         <button 
                           onClick={() => openPackingGate(order)}
                           className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center justify-center"
                         >
                           Open Packing Gate <ArrowRight size={16} className="ml-2" />
                         </button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- RECEIVE MODAL --- */}
      {showReceiveModal && receivingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Receive Inventory</h3>
                <p className="text-xs text-slate-500">{receivingItem.name} • {receivingItem.sku}</p>
              </div>
              <button 
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
               {/* Validation Info */}
               <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start space-x-3">
                  <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
                  <div className="text-sm text-blue-700">
                    <p>Expected Quantity: <strong>{receivingItem.expectedQty - receivingItem.receivedQty}</strong> units</p>
                    <p className="text-xs mt-1 text-blue-600">Ensure visual inspection is complete before confirming.</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Received Quantity</label>
                    <input 
                      type="number"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={receiveForm.qty}
                      onChange={(e) => setReceiveForm({...receiveForm, qty: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quality Check</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={receiveForm.qualityStatus}
                      onChange={(e) => setReceiveForm({...receiveForm, qualityStatus: e.target.value})}
                    >
                      <option value="Passed">Passed (Good)</option>
                      <option value="Damaged">Damaged</option>
                      <option value="Failed">Failed Inspection</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number</label>
                     <div className="relative">
                       <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                        type="text"
                        className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                        value={receiveForm.batchNumber}
                        onChange={(e) => setReceiveForm({...receiveForm, batchNumber: e.target.value})}
                      />
                     </div>
                  </div>
                  <div className="col-span-1">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Lot Number</label>
                     <input 
                        type="text"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                        value={receiveForm.lotNumber}
                        onChange={(e) => setReceiveForm({...receiveForm, lotNumber: e.target.value})}
                      />
                  </div>
                  <div className="col-span-1">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                     <input 
                        type="date"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={receiveForm.expiryDate}
                        onChange={(e) => setReceiveForm({...receiveForm, expiryDate: e.target.value})}
                      />
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
               <button 
                 onClick={() => setShowReceiveModal(false)}
                 className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleConfirmReceipt}
                 className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center shadow-sm"
               >
                 <ArrowDownCircle size={18} className="mr-2" /> Confirm Receipt
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE OPERATION MODAL --- */}
      {isCreateModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
               <h3 className="text-xl font-bold text-slate-900">Create Warehouse Operation</h3>
               <button 
                 onClick={() => setIsCreateModalOpen(false)}
                 className="text-slate-400 hover:text-slate-600 transition-colors"
               >
                 <X size={24} />
               </button>
             </div>
             
             <form onSubmit={submitNewOperation} className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Operation Type</label>
                   <select 
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newOperation.type}
                      onChange={(e) => setNewOperation({...newOperation, type: e.target.value})}
                   >
                      <option value="Inbound Shipment">Inbound Shipment (Purchase Order)</option>
                      <option value="Emergency Stock Replenishment">Emergency Stock Replenishment</option>
                   </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Supplier / Source</label>
                      <input 
                         type="text" 
                         required
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="e.g. MegaTron Electronics"
                         value={newOperation.supplier}
                         onChange={e => setNewOperation({...newOperation, supplier: e.target.value})}
                      />
                   </div>
                   <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expected Date</label>
                      <input 
                         type="date" 
                         required
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                         value={newOperation.expectedDate}
                         onChange={e => setNewOperation({...newOperation, expectedDate: e.target.value})}
                      />
                   </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                   <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-sm text-slate-800">Items to Receive</h4>
                      <button 
                        type="button"
                        onClick={handleAddLineItem}
                        className="text-xs flex items-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-medium"
                      >
                         <Plus size={14} className="mr-1" /> Add Item
                      </button>
                   </div>
                   
                   {newOperation.items.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed text-slate-400 text-sm">
                         No items added. Click "Add Item" to start.
                      </div>
                   ) : (
                      <div className="space-y-3">
                         {newOperation.items.map((item, idx) => (
                            <div key={idx} className="flex items-end gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                               <div className="flex-1">
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
                                  <select 
                                     className="w-full text-sm p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                     value={item.sku}
                                     onChange={(e) => handleLineItemChange(idx, 'sku', e.target.value)}
                                  >
                                     {availableProducts.map(p => (
                                        <option key={p.sku} value={p.sku}>{p.name} ({p.sku})</option>
                                     ))}
                                  </select>
                               </div>
                               <div className="w-20">
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                                  <input 
                                     type="number" 
                                     min="1"
                                     className="w-full text-sm p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                     value={item.qty}
                                     onChange={(e) => handleLineItemChange(idx, 'qty', e.target.value)}
                                  />
                               </div>
                               <button 
                                 type="button"
                                 onClick={() => handleRemoveLineItem(idx)}
                                 className="p-2 text-rose-500 hover:bg-rose-50 rounded"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </form>

             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
               <button 
                 type="button"
                 onClick={() => setIsCreateModalOpen(false)}
                 className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
               >
                 Cancel
               </button>
               <button 
                 onClick={submitNewOperation}
                 className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
               >
                 Create Operation
               </button>
             </div>
           </div>
         </div>
      )}

      {/* --- PICKING VALIDATION MODAL --- */}
      {pickingTaskToValidate && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Picking Validation</h3>
                <p className="text-xs text-slate-500">Scan location and SKU to confirm pick.</p>
              </div>
              <div className="p-6 space-y-4">
                 <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <div className="text-sm text-indigo-900 font-medium">Task Requirement:</div>
                    <div className="text-xs text-indigo-700 mt-1 flex flex-col gap-1">
                       <span><strong>Location:</strong> {pickingTaskToValidate.location}</span>
                       <span><strong>Product:</strong> {pickingTaskToValidate.productName} ({pickingTaskToValidate.sku})</span>
                       <span><strong>Qty:</strong> {pickingTaskToValidate.quantity}</span>
                    </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Scan Location</label>
                   <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text"
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={pickValidation.scannedLocation}
                        onChange={(e) => setPickValidation({...pickValidation, scannedLocation: e.target.value})}
                      />
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Scan SKU</label>
                   <div className="relative">
                      <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text"
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={pickValidation.scannedSku}
                        onChange={(e) => setPickValidation({...pickValidation, scannedSku: e.target.value})}
                      />
                   </div>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                <button onClick={() => setPickingTaskToValidate(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
                <button onClick={confirmPick} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Confirm Pick</button>
              </div>
           </div>
         </div>
      )}

      {/* --- PACKING VALIDATION GATE MODAL --- */}
      {orderToPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                 <div>
                   <h3 className="text-lg font-bold text-slate-900">Packing Validation Gate</h3>
                   <p className="text-xs text-slate-500">Order: {orderToPack.orderNumber} • {orderToPack.customerName}</p>
                 </div>
                 <button onClick={() => setOrderToPack(null)}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                 <div className="mb-4">
                    <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                       <span>Packing Progress</span>
                       <span>{packedItems.size} / {orderToPack.items.length} Items Verified</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                       <div 
                         className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                         style={{ width: `${(packedItems.size / orderToPack.items.length) * 100}%` }}
                       ></div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    {orderToPack.items.map((item, idx) => {
                      const isPacked = packedItems.has(item.sku);
                      return (
                        <button 
                          key={idx}
                          onClick={() => togglePackItem(item.sku)}
                          className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                             isPacked 
                             ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500' 
                             : 'bg-white border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                           <div className="flex items-center space-x-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPacked ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                 {isPacked ? <CheckCircle size={18} /> : <Box size={18} />}
                              </div>
                              <div>
                                 <h4 className={`font-medium ${isPacked ? 'text-emerald-900' : 'text-slate-900'}`}>{item.name}</h4>
                                 <div className="text-xs text-slate-500">SKU: {item.sku} • Qty: {item.quantity}</div>
                              </div>
                           </div>
                           <div className={`px-3 py-1 rounded-full text-xs font-bold ${isPacked ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                              {isPacked ? 'VERIFIED' : 'SCAN TO VERIFY'}
                           </div>
                        </button>
                      );
                    })}
                 </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  disabled={packedItems.size < orderToPack.items.length}
                  onClick={finalizeShipment}
                  className={`px-6 py-3 rounded-lg font-bold flex items-center transition-colors ${
                    packedItems.size < orderToPack.items.length 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                  }`}
                >
                   Seal Package & Dispatch <Truck size={20} className="ml-2" />
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};