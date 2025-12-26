import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  Search, 
  Filter,
  ArrowRight,
  MoreVertical,
  Plane,
  Ship,
  FileText,
  Undo2,
  Globe,
  Loader2,
  Printer,
  X,
  ClipboardCheck,
  RefreshCw,
  ExternalLink,
  Barcode,
  Plus,
  Trash2
} from 'lucide-react';
import { getShipments, getReturns, getExportDocuments } from '../services/mockData';
import { Shipment, ReturnRequest, ExportDoc, ReturnAction, ReturnStatus, SalesOrder } from '../types';

const StatusBadge: React.FC<{ status: Shipment['status'] }> = ({ status }) => {
  const styles = {
    'In Transit': 'bg-blue-100 text-blue-700 border-blue-200',
    'Pending': 'bg-slate-100 text-slate-700 border-slate-200',
    'Delivered': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Delayed': 'bg-amber-100 text-amber-700 border-amber-200',
    'Exception': 'bg-red-100 text-red-700 border-red-200',
  };

  const icons = {
    'In Transit': <Truck size={14} className="mr-1" />,
    'Pending': <Clock size={14} className="mr-1" />,
    'Delivered': <CheckCircle size={14} className="mr-1" />,
    'Delayed': <Clock size={14} className="mr-1" />,
    'Exception': <AlertTriangle size={14} className="mr-1" />,
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
};

export const Logistics: React.FC = () => {
  const [activeView, setActiveView] = useState<'tracking' | 'returns' | 'docs'>('tracking');
  
  // -- Data State --
  const [shipments, setShipments] = useState<Shipment[]>(() => {
    const saved = localStorage.getItem('logistics_shipments');
    return saved ? JSON.parse(saved) : getShipments();
  });
  
  const [returns, setReturns] = useState<ReturnRequest[]>(() => {
    const saved = localStorage.getItem('logistics_returns');
    return saved ? JSON.parse(saved) : getReturns();
  });

  const [exportDocs, setExportDocs] = useState<ExportDoc[]>(() => {
     const saved = localStorage.getItem('logistics_docs');
     return saved ? JSON.parse(saved) : getExportDocuments();
  });

  // -- UI State --
  const [searchTerm, setSearchTerm] = useState('');
  const [processingShipmentId, setProcessingShipmentId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Create Shipment Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newShipment, setNewShipment] = useState({
    recipient: '',
    destination: '',
    carrier: 'Unassigned',
    type: 'Outbound',
    status: 'Pending',
    eta: '',
    trackingId: ''
  });

  // Return Processing Modal
  const [returnToProcess, setReturnToProcess] = useState<ReturnRequest | null>(null);
  const [qcNotes, setQcNotes] = useState('');
  const [returnAction, setReturnAction] = useState<ReturnAction>('Restock');

  // Sync Logic: Check for Sales Orders that are 'Shipped' but not yet in Logistics
  useEffect(() => {
    const syncSalesToLogistics = () => {
        try {
            const storedOrders: SalesOrder[] = JSON.parse(localStorage.getItem('sales_orders') || '[]');
            // Find orders that are shipped or invoiced
            const shippedOrders = storedOrders.filter(o => o.status === 'Shipped' || o.status === 'Invoiced');
            
            let hasNewShipments = false;
            const currentShipments = [...shipments];

            shippedOrders.forEach(order => {
                // Check if a shipment already exists for this order (using orderNumber as a link)
                const exists = currentShipments.find(s => s.linkedOrderId === order.orderNumber || s.trackingId.includes(order.orderNumber));
                
                if (!exists) {
                    const newShipment: Shipment = {
                        id: `shp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        trackingId: `PENDING-${order.orderNumber}`,
                        recipient: order.customerName,
                        destination: order.shippingAddress || 'Address Pending',
                        status: 'Pending',
                        eta: 'TBD',
                        carrier: 'Unassigned',
                        type: 'Outbound',
                        linkedOrderId: order.orderNumber
                    };
                    currentShipments.unshift(newShipment);
                    hasNewShipments = true;
                }
            });

            if (hasNewShipments) {
                setShipments(currentShipments);
            }
        } catch (e) {
            console.error("Failed to sync sales orders to logistics", e);
        }
    };

    syncSalesToLogistics();
  }, [shipments.length]); // Dependency on length to prevent infinite loop but catch updates

  // Persistence
  useEffect(() => { localStorage.setItem('logistics_shipments', JSON.stringify(shipments)); }, [shipments]);
  useEffect(() => { localStorage.setItem('logistics_returns', JSON.stringify(returns)); }, [returns]);
  useEffect(() => { localStorage.setItem('logistics_docs', JSON.stringify(exportDocs)); }, [exportDocs]);

  // -- Filters --
  const filteredShipments = shipments.filter(s => 
    s.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReturns = returns.filter(r => 
    r.rmaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDocs = exportDocs.filter(d => 
    d.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // -- Stats --
  const stats = {
    active: shipments.filter(s => s.status === 'In Transit').length,
    returns: returns.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length,
    docsGenerated: exportDocs.length,
    pendingDispatch: shipments.filter(s => s.status === 'Pending').length,
  };

  // -- Handlers --

  const handleSyncCarriers = async () => {
    setIsSyncing(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSyncing(false);
    alert("Carrier synchronization complete. Tracking statuses updated.");
  };

  const handleDeleteShipment = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) {
          setShipments(shipments.filter(s => s.id !== id));
      }
  };

  const handleDispatch = async (shipmentId: string) => {
    setProcessingShipmentId(shipmentId);
    
    // Simulate Carrier API Call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const carriers = ['TCS', 'Leopards', 'DHL', 'Trax', 'M&P'];
    const randomCarrier = carriers[Math.floor(Math.random() * carriers.length)];

    const updatedShipments = shipments.map(s => {
      if (s.id === shipmentId) {
        return { 
            ...s, 
            status: 'In Transit' as const, 
            trackingId: `TRK-${Math.floor(Math.random() * 90000) + 10000}`,
            carrier: randomCarrier,
            eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days from now
        };
      }
      return s;
    });

    // Generate Mock Documents
    const shipment = updatedShipments.find(s => s.id === shipmentId);
    if (shipment) {
      const newDocs: ExportDoc[] = [
        {
           id: `doc-${Date.now()}-1`,
           shipmentId: shipment.id,
           trackingId: shipment.trackingId,
           type: 'Commercial Invoice',
           dateGenerated: new Date().toISOString().split('T')[0],
           status: 'Filed',
           destinationCountry: shipment.destination.split(',').pop()?.trim() || 'Pakistan'
        },
        {
           id: `doc-${Date.now()}-2`,
           shipmentId: shipment.id,
           trackingId: shipment.trackingId,
           type: 'Shipping Label',
           dateGenerated: new Date().toISOString().split('T')[0],
           status: 'Generated',
           destinationCountry: shipment.destination.split(',').pop()?.trim() || 'Pakistan'
        }
      ];
      setExportDocs([...newDocs, ...exportDocs]);
    }

    setShipments(updatedShipments);
    setProcessingShipmentId(null);
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShipment.recipient || !newShipment.destination) {
        alert("Recipient and Destination are required.");
        return;
    }

    // Auto-generate tracking ID if not provided
    const finalTrackingId = newShipment.trackingId.trim() || `TRK-${Math.floor(Math.random() * 90000) + 10000}`;

    const createdShipment: Shipment = {
        id: `shp-${Date.now()}`,
        trackingId: finalTrackingId,
        recipient: newShipment.recipient,
        destination: newShipment.destination,
        status: newShipment.status as Shipment['status'],
        eta: newShipment.eta || 'TBD',
        carrier: newShipment.carrier,
        type: newShipment.type as 'Outbound' | 'Inbound',
        linkedOrderId: 'Manual Entry'
    };

    setShipments([createdShipment, ...shipments]);
    setIsCreateModalOpen(false);
    
    // Reset form
    setNewShipment({
      recipient: '',
      destination: '',
      carrier: 'Unassigned',
      type: 'Outbound',
      status: 'Pending',
      eta: '',
      trackingId: ''
    });
  };

  const handleDropdownAction = (e: React.MouseEvent, action: string, shipment: Shipment) => {
    e.stopPropagation();
    
    setTimeout(() => {
        if (action === 'view') {
            alert(`Viewing details for shipment ${shipment.trackingId}\nRecipient: ${shipment.recipient}\nDestination: ${shipment.destination}\nCarrier: ${shipment.carrier}`);
        } else if (action === 'track') {
            alert(`Simulating redirection to ${shipment.carrier} tracking portal...\nTracking ID: ${shipment.trackingId}`);
        }
    }, 50);
    
    setActiveDropdown(null);
  };

  const openReturnModal = (ret: ReturnRequest) => {
    setReturnToProcess(ret);
    setQcNotes(ret.qcNotes || '');
    setReturnAction(ret.finalAction === 'Pending' ? 'Restock' : ret.finalAction);
  };

  const submitReturnProcess = () => {
     if (!returnToProcess) return;

     const updatedReturns = returns.map(r => {
        if (r.id === returnToProcess.id) {
           return {
             ...r,
             status: 'Completed' as ReturnStatus,
             qcNotes: qcNotes,
             finalAction: returnAction
           };
        }
        return r;
     });

     setReturns(updatedReturns);
     setReturnToProcess(null);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Logistics & Compliance</h2>
          <p className="text-slate-500 text-sm">Global shipping, return logistics, and export documentation ledger.</p>
        </div>
        <div className="flex space-x-3">
          <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
             <Plus size={18} />
             <span>Create Shipment</span>
          </button>
           <button 
             onClick={handleSyncCarriers}
             disabled={isSyncing}
             className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-70"
           >
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            <span>{isSyncing ? 'Syncing...' : 'Sync Carriers'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">In Transit</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.active}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Truck size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Dispatch</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.pendingDispatch}</h3>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <Package size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Returns</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.returns}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Undo2 size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Docs Generated</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.docsGenerated}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('tracking')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${activeView === 'tracking'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            <Globe size={18} className="mr-2" />
            Live Tracking
          </button>
          <button
            onClick={() => setActiveView('returns')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${activeView === 'returns'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            <Undo2 size={18} className="mr-2" />
            Return Management
          </button>
          <button
            onClick={() => setActiveView('docs')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${activeView === 'docs'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            <FileText size={18} className="mr-2" />
            Export Compliance
          </button>
        </nav>
      </div>

      {/* -- VIEW: LIVE TRACKING -- */}
      {activeView === 'tracking' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm animate-fade-in">
          {/* Controls */}
          <div className="p-5 border-b border-slate-200 flex justify-between items-center gap-4">
            <h3 className="font-bold text-slate-800">Outbound Shipments</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search Tracking ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Tracking / Order</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">Carrier</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">ETA</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className="font-medium text-indigo-600 flex items-center">
                            <Package size={14} className="mr-1"/> {shipment.trackingId || 'Pending Generation'}
                         </span>
                         <span className="text-xs text-slate-500 mt-1">{shipment.recipient}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                       <div className="flex items-center">
                          <MapPin size={14} className="mr-1 text-slate-400"/> {shipment.destination}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {shipment.carrier === 'Maersk' ? <Ship size={14} /> : shipment.carrier === 'DHL' ? <Plane size={14} /> : <Truck size={14} />}
                        <span>{shipment.carrier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={shipment.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500">{shipment.eta}</td>
                    <td className="px-6 py-4 text-right">
                       {shipment.status === 'Pending' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleDispatch(shipment.id)}
                              disabled={processingShipmentId === shipment.id}
                              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 flex items-center disabled:opacity-70 shadow-sm"
                            >
                              {processingShipmentId === shipment.id ? <Loader2 size={12} className="animate-spin mr-1"/> : <Barcode size={12} className="mr-1"/>}
                              {processingShipmentId === shipment.id ? 'Dispatching...' : 'Dispatch'}
                            </button>
                            <button 
                                onClick={(e) => handleDeleteShipment(shipment.id, e)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-rose-50 ml-1"
                                title="Delete Shipment"
                            >
                                <Trash2 size={18} />
                            </button>
                          </div>
                       ) : (
                          <div className="relative flex justify-end items-center">
                            <button 
                                onClick={(e) => handleDeleteShipment(shipment.id, e)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-rose-50 mr-1"
                                title="Delete Shipment"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(activeDropdown === shipment.id ? null : shipment.id);
                                }}
                                className="text-slate-400 hover:text-indigo-600 p-1 rounded-full hover:bg-slate-100 active:bg-slate-200"
                            >
                                <MoreVertical size={18} />
                            </button>
                            {activeDropdown === shipment.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 border border-slate-100 animate-fade-in origin-top-right ring-1 ring-black ring-opacity-5">
                                    <div className="py-1">
                                        <button 
                                            onClick={(e) => handleDropdownAction(e, 'view', shipment)}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                                        >
                                            <FileText size={14} className="mr-2 text-slate-400" /> View Details
                                        </button>
                                        <button 
                                            onClick={(e) => handleDropdownAction(e, 'track', shipment)}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                                        >
                                            <ExternalLink size={14} className="mr-2 text-slate-400" /> Track Shipment
                                        </button>
                                        <div className="border-t border-slate-100 my-1"></div>
                                        <button 
                                            onClick={() => setActiveDropdown(null)}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                          </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -- VIEW: RETURNS -- */}
      {activeView === 'returns' && (
         <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
             <div className="p-5 border-b border-slate-200 flex justify-between items-center gap-4">
                <h3 className="font-bold text-slate-800">Return Requests (RMA)</h3>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Search RMA..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                 <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                    <tr>
                       <th className="px-6 py-4">RMA Details</th>
                       <th className="px-6 py-4">Reason</th>
                       <th className="px-6 py-4">Items</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredReturns.map(ret => (
                       <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                             <div>
                                <div className="font-bold text-slate-900">{ret.rmaNumber}</div>
                                <div className="text-xs text-slate-500">{ret.orderNumber} • {ret.customerName}</div>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{ret.reason}</td>
                          <td className="px-6 py-4">
                             {ret.items.map((item, i) => (
                                <div key={i} className="text-xs text-slate-600">{item.qty}x {item.name}</div>
                             ))}
                          </td>
                          <td className="px-6 py-4">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                ret.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                ret.status === 'QC Inspection' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                             }`}>
                                {ret.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             {ret.status !== 'Completed' && (
                                <button 
                                  onClick={() => openReturnModal(ret)}
                                  className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-200"
                                >
                                   Process Return
                                </button>
                             )}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            </div>
         </div>
      )}

      {/* -- VIEW: DOCS -- */}
      {activeView === 'docs' && (
         <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
             <div className="p-5 border-b border-slate-200 flex justify-between items-center gap-4 bg-slate-50">
                <div>
                   <h3 className="font-bold text-slate-800">Export Documentation Ledger</h3>
                   <p className="text-xs text-slate-500">Auditable record of commercial invoices and shipping labels.</p>
                </div>
                <button 
                  onClick={() => alert("Filter functionality is currently in development.")}
                  className="text-sm flex items-center text-slate-600 hover:text-indigo-600 bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                   <Filter size={16} className="mr-2"/> Filter Ledger
                </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-white text-slate-900 font-semibold border-b border-slate-200">
                     <tr>
                        <th className="px-6 py-4">Document Type</th>
                        <th className="px-6 py-4">Related Shipment</th>
                        <th className="px-6 py-4">Destination</th>
                        <th className="px-6 py-4">Date Generated</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Download</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                     {filteredDocs.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center font-medium text-slate-700">
                                 <FileText size={16} className="mr-2 text-slate-400"/> {doc.type}
                              </div>
                           </td>
                           <td className="px-6 py-4 font-mono text-xs">{doc.trackingId}</td>
                           <td className="px-6 py-4">{doc.destinationCountry}</td>
                           <td className="px-6 py-4">{doc.dateGenerated}</td>
                           <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                 {doc.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="text-indigo-600 font-medium text-xs hover:underline">PDF</button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* --- CREATE SHIPMENT MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
             <div className="flex justify-between items-center p-6 border-b border-slate-100">
               <h3 className="text-xl font-bold text-slate-900">Create New Shipment</h3>
               <button 
                 onClick={() => setIsCreateModalOpen(false)}
                 className="text-slate-400 hover:text-slate-600 transition-colors"
               >
                 <X size={24} />
               </button>
             </div>
             
             <form onSubmit={handleCreateShipment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={newShipment.recipient}
                    onChange={(e) => setNewShipment({...newShipment, recipient: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Acme Logistics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={newShipment.destination}
                    onChange={(e) => setNewShipment({...newShipment, destination: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. 123 Industrial Ave, Lahore"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Carrier</label>
                      <select
                        value={newShipment.carrier}
                        onChange={(e) => setNewShipment({...newShipment, carrier: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Unassigned">Unassigned</option>
                        <option value="TCS">TCS</option>
                        <option value="Leopards">Leopards</option>
                        <option value="DHL">DHL</option>
                        <option value="Trax">Trax</option>
                        <option value="M&P">M&P</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tracking ID</label>
                      <input
                        type="text"
                        value={newShipment.trackingId}
                        onChange={(e) => setNewShipment({...newShipment, trackingId: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Auto-generated if empty"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Shipment Type</label>
                      <select
                        value={newShipment.type}
                        onChange={(e) => setNewShipment({...newShipment, type: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Outbound">Outbound</option>
                        <option value="Inbound">Inbound</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select
                        value={newShipment.status}
                        onChange={(e) => setNewShipment({...newShipment, status: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delayed">Delayed</option>
                      </select>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Arrival (ETA)</label>
                   <input
                     type="date"
                     value={newShipment.eta}
                     onChange={(e) => setNewShipment({...newShipment, eta: e.target.value})}
                     className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-2">
                   <button
                     type="button"
                     onClick={() => setIsCreateModalOpen(false)}
                     className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                   >
                     Create Procedure
                   </button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* --- RETURN PROCESSING MODAL --- */}
      {returnToProcess && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
               <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900">Process Return: {returnToProcess.rmaNumber}</h3>
                     <p className="text-xs text-slate-500">Reason: {returnToProcess.reason}</p>
                  </div>
                  <button onClick={() => setReturnToProcess(null)}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
               </div>
               <div className="p-6 space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                     <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Items Received</h4>
                     {returnToProcess.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-slate-600 border-b border-slate-100 last:border-0 py-1">
                           <span>{item.name}</span>
                           <span className="font-mono">x{item.qty}</span>
                        </div>
                     ))}
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">QC Inspection Notes</label>
                     <textarea 
                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        rows={3}
                        placeholder="Condition of items, packaging status, etc."
                        value={qcNotes}
                        onChange={(e) => setQcNotes(e.target.value)}
                     ></textarea>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Disposition / Action</label>
                     <div className="grid grid-cols-2 gap-3">
                        {(['Restock', 'Repair', 'Disposal', 'Refund Only'] as const).map(action => (
                           <button
                              key={action}
                              onClick={() => setReturnAction(action)}
                              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                                 returnAction === action 
                                 ? 'bg-indigo-600 text-white border-indigo-600' 
                                 : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                              }`}
                           >
                              {action}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                  <button onClick={() => setReturnToProcess(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                  <button 
                     onClick={submitReturnProcess}
                     className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium flex items-center"
                  >
                     <ClipboardCheck size={16} className="mr-2" /> Complete Processing
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};