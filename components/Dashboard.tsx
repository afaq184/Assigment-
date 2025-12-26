import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  WifiOff,
  ArrowRight,
  X,
  FileText,
  Search
} from 'lucide-react';
import { KPICard } from './KPICard';
import { getInitialKPIs, getRevenueData, getRecentActivity, simulateLiveUpdate, getSystemHealth } from '../services/mockData';
import { KPI, ChartDataPoint, ActivityLog, SystemStatus } from '../types';

export const Dashboard: React.FC = () => {
  const [kpis] = useState<KPI[]>(getInitialKPIs());
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>(getRevenueData());
  const [activities] = useState<ActivityLog[]>(getRecentActivity());
  const [systemHealth] = useState<SystemStatus[]>(getSystemHealth());
  
  // Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logSearch, setLogSearch] = useState('');

  // Simulate real-time data ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setRevenueData(prev => simulateLiveUpdate(prev));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Extended logs for the modal
  const allLogs: ActivityLog[] = [
    ...activities,
    { id: '5', action: 'User login: Admin', user: 'Security', timestamp: '3 hours ago', type: 'system' },
    { id: '6', action: 'PO #2023-008 Created', user: 'Purchasing', timestamp: '4 hours ago', type: 'inventory' },
    { id: '7', action: 'Shipment TRK-9821 Dispatched', user: 'Logistics', timestamp: '5 hours ago', type: 'order' },
    { id: '8', action: 'Database Backup Completed', user: 'System', timestamp: '6 hours ago', type: 'system' },
    { id: '9', action: 'New SKU added: ELEC-2024-X', user: 'Warehouse Mgr', timestamp: 'Yesterday', type: 'inventory' },
    { id: '10', action: 'API Rate Limit Warning', user: 'Carrier Gateway', timestamp: 'Yesterday', type: 'system' },
  ];

  const filteredLogs = allLogs.filter(log => 
    log.action.toLowerCase().includes(logSearch.toLowerCase()) || 
    log.user.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Operational Dashboard</h2>
          <p className="text-slate-500 text-sm">Real-time metrics, order fulfillment, and system health.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map(kpi => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Main Content Split: Charts & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Operational Throughput</h3>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <span className="flex items-center"><div className="w-3 h-3 bg-indigo-500 rounded-full mr-1"></div> Revenue</span>
            </div>
          </div>
          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Widget */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Activity size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-slate-800">System Sync Status</h3>
            </div>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {systemHealth.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    {item.status === 'operational' ? (
                      <CheckCircle size={16} className="text-emerald-500" />
                    ) : item.status === 'degraded' ? (
                      <AlertTriangle size={16} className="text-amber-500" />
                    ) : (
                      <WifiOff size={16} className="text-rose-500" />
                    )}
                    <span className="font-medium text-slate-800 text-sm">{item.module}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.status === 'operational' ? 'bg-emerald-100 text-emerald-700' :
                    item.status === 'degraded' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {item.latency}
                  </span>
                </div>
                <p className="text-xs text-slate-500 ml-6 mb-1">{item.message}</p>
                <p className="text-xs text-slate-400 ml-6">Synced: {item.lastSync}</p>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <button className="w-full py-2 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center">
              <RefreshCw size={14} className="mr-2" />
              Force Full Sync
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Operational Log</h3>
          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
          >
            View Full Log <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-medium">
              <tr>
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Initiator</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-800">{log.action}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.type === 'order' ? 'bg-blue-100 text-blue-800' :
                      log.type === 'inventory' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {log.type === 'system' ? 'System' : log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{log.user}</td>
                  <td className="px-6 py-3 text-slate-400">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">System Activity Log</h3>
                <p className="text-sm text-slate-500">Comprehensive operational history</p>
              </div>
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-100">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search logs..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
               <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-900 font-medium sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 bg-slate-50">Event</th>
                      <th className="px-6 py-3 bg-slate-50">Type</th>
                      <th className="px-6 py-3 bg-slate-50">User</th>
                      <th className="px-6 py-3 bg-slate-50">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-800">{log.action}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.type === 'order' ? 'bg-blue-100 text-blue-800' :
                            log.type === 'inventory' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {log.type === 'system' ? 'System' : log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-500">{log.user}</td>
                        <td className="px-6 py-3 text-slate-400">{log.timestamp}</td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                       <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                             No logs match your search.
                          </td>
                       </tr>
                    )}
                  </tbody>
               </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};