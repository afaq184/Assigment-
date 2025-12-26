import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  AlertTriangle, 
  Package, 
  Archive, 
  ShoppingCart,
  TrendingDown,
  ArrowRight,
  FileText,
  ShieldCheck,
  Globe,
  Clipboard,
  Barcode,
  Layers,
  X,
  Trash2
} from 'lucide-react';
import { getInventoryItems } from '../services/mockData';
import { InventoryItem, BatchInfo } from '../types';

export const Inventory: React.FC = () => {
  // Initialize from localStorage if available, otherwise use mock data
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('inventory_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to parse inventory data:', error);
    }
    return getInventoryItems();
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'stock' | 'ledger'>('stock');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    sku: '',
    category: 'Electronics',
    onHand: 0,
    reorderPoint: 10,
    unitPrice: 0,
    location: 'Zone A-01'
  });

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('inventory_data', JSON.stringify(items));
  }, [items]);

  // Aggregated Metrics
  const metrics = useMemo(() => {
    let totalOnHand = 0;
    let totalAllocated = 0;
    let totalAvailable = 0;
    let replenishmentNeeded = 0;
    let stockoutCount = 0;

    items.forEach(item => {
      totalOnHand += item.onHand;
      totalAllocated += item.allocated;
      const available = Math.max(0, item.onHand - item.allocated);
      totalAvailable += available;

      if (available <= 0) stockoutCount++;
      else if (available <= item.reorderPoint) replenishmentNeeded++;
    });

    return { totalOnHand, totalAllocated, totalAvailable, replenishmentNeeded, stockoutCount };
  }, [items]);

  // Flatten batches for Ledger View
  const ledgerData = useMemo(() => {
    return items.flatMap(item => 
      item.batches.map(batch => ({
        ...batch,
        itemName: item.name,
        sku: item.sku,
        compliance: item.compliance
      }))
    );
  }, [items]);

  // Filter Logic
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredLedger = ledgerData.filter(entry => {
     const matchesSearch = entry.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.itemName.toLowerCase().includes(searchTerm.toLowerCase());
     return matchesSearch;
  });

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  // --- Handlers ---

  const handleExport = () => {
    const headers = ["ID", "Name", "SKU", "Category", "On Hand", "Allocated", "Available", "Unit Price", "Location"];
    const rows = filteredItems.map(item => [
      item.id,
      `"${item.name}"`, // Quote name to handle commas
      item.sku,
      item.category,
      item.onHand,
      item.allocated,
      Math.max(0, item.onHand - item.allocated),
      item.unitPrice,
      item.location
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.sku) {
      alert("Name and SKU are required");
      return;
    }

    const itemToAdd: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name || 'New Item',
      sku: newItem.sku || `SKU-${Math.floor(Math.random() * 1000)}`,
      category: newItem.category || 'General',
      onHand: Number(newItem.onHand) || 0,
      allocated: 0,
      reorderPoint: Number(newItem.reorderPoint) || 10,
      unitPrice: Number(newItem.unitPrice) || 0,
      location: newItem.location || 'Pending',
      compliance: { tariffCode: '', countryOfOrigin: 'Unknown', regulatoryCategory: 'Pending', lastAuditDate: new Date().toISOString().split('T')[0] },
      batches: []
    };

    setItems([...items, itemToAdd]);
    setIsAddModalOpen(false);
    // Reset form
    setNewItem({
        name: '',
        sku: '',
        category: 'Electronics',
        onHand: 0,
        reorderPoint: 10,
        unitPrice: 0,
        location: 'Zone A-01'
    });
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        setItems(items.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory Management (WMS Core)</h2>
          <p className="text-slate-500 text-sm">Real-time stock visibility, traceability, and compliance.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stock')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${activeTab === 'stock'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            <Layers size={18} className="mr-2" />
            Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
              ${activeTab === 'ledger'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
            `}
          >
            <ShieldCheck size={18} className="mr-2" />
            Traceability & Compliance Ledger
          </button>
        </nav>
      </div>

      {/* Tab Content: Stock Overview */}
      {activeTab === 'stock' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stock Categorization Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">On-Hand Stock</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalOnHand.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Archive size={20} />
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">Total physical units</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Allocated Stock</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalAllocated.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <ShoppingCart size={20} />
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">Reserved for orders</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm ring-1 ring-emerald-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-emerald-700">Available to Sell</p>
                  <h3 className="text-2xl font-bold text-emerald-900 mt-1">{metrics.totalAvailable.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Package size={20} />
                </div>
              </div>
              <div className="mt-2 text-xs text-emerald-600 font-medium">Net available for new sales</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Alerts</p>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <h3 className="text-2xl font-bold text-slate-900">{metrics.replenishmentNeeded + metrics.stockoutCount}</h3>
                    <span className="text-xs font-medium text-rose-500">
                      {metrics.stockoutCount} Stockouts
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">Restock triggered</div>
            </div>
          </div>

          {/* Main Inventory Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search SKU or Product..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div className="relative">
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                 <span className="w-3 h-3 bg-rose-100 border border-rose-300 rounded-full inline-block"></span>
                 <span>Below Reorder Point</span>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4 text-center bg-slate-100/50">On-Hand</th>
                    <th className="px-6 py-4 text-center">Allocated</th>
                    <th className="px-6 py-4 text-center bg-emerald-50/50 text-emerald-900 border-l border-r border-slate-100">Available</th>
                    <th className="px-6 py-4">Status & Alerts</th>
                    <th className="px-6 py-4 text-right">Unit Price</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const available = Math.max(0, item.onHand - item.allocated);
                    const isLowStock = available <= item.reorderPoint && available > 0;
                    const isOutStock = available === 0;

                    return (
                      <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isLowStock ? 'bg-rose-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500 flex items-center space-x-2 mt-1">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.sku}</span>
                              <span>•</span>
                              <span>{item.category}</span>
                              <span>•</span>
                              <span>{item.location}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium bg-slate-50/50">{item.onHand}</td>
                        <td className="px-6 py-4 text-center text-slate-500">{item.allocated}</td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-700 bg-emerald-50/30 border-l border-r border-slate-100">
                          {available}
                        </td>
                        <td className="px-6 py-4">
                          {isOutStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <div className="flex items-center space-x-2 text-rose-600">
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200">
                                 Low Stock
                               </span>
                               <span className="text-xs text-rose-500 font-medium whitespace-nowrap">Reorder: {item.reorderPoint}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">Rs. {item.unitPrice.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {(isLowStock || isOutStock) && (
                            <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center">
                              Replenish <ArrowRight size={14} className="ml-1" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteItem(item.id)} 
                            className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Traceability Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-fade-in">
          {/* Compliance Header */}
          <div className="bg-slate-900 text-white p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck size={24} className="text-emerald-400" />
                Compliance & Traceability Center
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Monitor batch provenance, expiry tracking, and regulatory compliance status.
              </p>
            </div>
            <div className="flex space-x-8 text-center md:text-left">
              <div>
                 <div className="text-2xl font-bold">{ledgerData.filter(b => b.complianceStatus === 'Compliant').length}</div>
                 <div className="text-xs text-slate-500 uppercase tracking-wide">Compliant Batches</div>
              </div>
              <div>
                 <div className="text-2xl font-bold text-amber-500">{ledgerData.filter(b => b.complianceStatus === 'Pending Review').length}</div>
                 <div className="text-xs text-slate-500 uppercase tracking-wide">Pending Review</div>
              </div>
              <div>
                 <div className="text-2xl font-bold text-rose-500">{ledgerData.filter(b => b.complianceStatus === 'Non-Compliant').length}</div>
                 <div className="text-xs text-slate-500 uppercase tracking-wide">Action Required</div>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             {/* Toolbar */}
             <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search Batch #, Lot #, or Serial..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Batch / Lot Info</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Compliance & Origin</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                            {batch.batchNumber}
                          </span>
                          <span className="text-xs text-slate-500">Lot: {batch.lotNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{batch.itemName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{batch.sku}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                           <div className="flex items-center space-x-2">
                              {batch.complianceStatus === 'Compliant' ? (
                                <span className="flex items-center text-emerald-700 text-xs font-medium">
                                  <ShieldCheck size={14} className="mr-1" /> Compliant
                                </span>
                              ) : batch.complianceStatus === 'Non-Compliant' ? (
                                <span className="flex items-center text-rose-700 text-xs font-medium">
                                  <AlertTriangle size={14} className="mr-1" /> Non-Compliant
                                </span>
                              ) : (
                                <span className="flex items-center text-amber-700 text-xs font-medium">
                                  <Clipboard size={14} className="mr-1" /> Pending
                                </span>
                              )}
                           </div>
                           <div className="flex items-center space-x-2 text-xs text-slate-500">
                              <Globe size={12} />
                              <span>{batch.compliance.countryOfOrigin}</span>
                              <span className="text-slate-300">|</span>
                              <span className="font-mono">{batch.compliance.tariffCode}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          <div className="text-slate-500">Rcvd: <span className="text-slate-700">{batch.receivedDate}</span></div>
                          <div className="text-slate-500">Exp: <span className={`${batch.expiryDate === 'N/A' ? 'text-slate-400' : 'text-slate-900 font-medium'}`}>{batch.expiryDate}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {batch.quantity}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center justify-end w-full group">
                           <Barcode size={16} className="mr-1 group-hover:scale-110 transition-transform" />
                           View Serials
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Ledger Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Showing {filteredLedger.length} batches</span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-slate-300 rounded hover:bg-white disabled:opacity-50" disabled>Previous</button>
                <button className="px-3 py-1 border border-slate-300 rounded hover:bg-white">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Add New Product</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddProductSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Wireless Headphones"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={newItem.sku}
                    onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="e.g. ELEC-2024-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Home Office">Home Office</option>
                    <option value="Garden">Garden</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock (On-Hand)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.onHand}
                    onChange={(e) => setNewItem({...newItem, onHand: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.reorderPoint}
                    onChange={(e) => setNewItem({...newItem, reorderPoint: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({...newItem, unitPrice: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};