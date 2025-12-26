import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Warehouse as WarehouseIcon, 
  Menu, 
  X, 
  Bell, 
  Search,
  User,
  Truck,
  LogOut,
  Settings
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Logistics } from './components/Logistics';
import { Inventory } from './components/Inventory';
import { SalesOrders } from './components/SalesOrders';
import { Warehouse } from './components/Warehouse';
import { Login } from './components/Login';
import { AdminProfileComponent } from './components/AdminProfile';
import { View, AdminProfile } from './types';

// Default Profile Data
const DEFAULT_PROFILE: AdminProfile = {
  name: "System Admin",
  email: "admin@bareeraintl.com",
  role: "Chief Operations Officer",
  department: "IT & Operations",
  phone: "+92 300 1234567",
  location: "Karachi HQ, Floor 4",
  bio: "Managing global trading operations and system integrity.",
  lastLogin: new Date().toLocaleString(),
  avatarUrl: undefined
};

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Profile State
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() => {
     const saved = localStorage.getItem('admin_profile');
     return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    setAdminProfile(prev => ({...prev, lastLogin: new Date().toLocaleString()}));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView(View.DASHBOARD);
    setIsUserMenuOpen(false);
  };

  const handleProfileUpdate = (updated: AdminProfile) => {
     setAdminProfile(updated);
     localStorage.setItem('admin_profile', JSON.stringify(updated));
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const NavItem: React.FC<{ view: View; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsSidebarOpen(false); // Close mobile menu on click
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  // If not authenticated, show Login Screen
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3 shrink-0">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <span className="text-lg font-bold tracking-wide truncate">BAREERA INTL.</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4">Trading Module</div>
          <NavItem view={View.DASHBOARD} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem view={View.INVENTORY} icon={<Package size={20} />} label="Inventory" />
          <NavItem view={View.SALES} icon={<ShoppingCart size={20} />} label="Sales & Orders" />
          <NavItem view={View.WAREHOUSE} icon={<WarehouseIcon size={20} />} label="Warehouse" />
          <NavItem view={View.LOGISTICS} icon={<Truck size={20} />} label="Logistics" />
        </nav>

        {/* User Profile Snippet */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 relative">
          <button 
             onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
             className="flex items-center space-x-3 w-full hover:bg-slate-800 p-2 rounded-lg transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 overflow-hidden">
               {adminProfile.avatarUrl ? (
                 <img src={adminProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <span className="font-bold text-white">{adminProfile.name.charAt(0)}</span>
               )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{adminProfile.name}</p>
              <p className="text-xs text-slate-400 truncate">{adminProfile.role}</p>
            </div>
            <Settings size={16} className="text-slate-500" />
          </button>

          {/* User Menu Popup */}
          {isUserMenuOpen && (
             <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 rounded-xl shadow-xl border border-slate-700 overflow-hidden animate-fade-in z-50">
                <button 
                  onClick={() => { setCurrentView(View.PROFILE); setIsUserMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center"
                >
                   <User size={16} className="mr-2" /> My Profile
                </button>
                <div className="border-t border-slate-700"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-slate-700 hover:text-rose-300 flex items-center"
                >
                   <LogOut size={16} className="mr-2" /> Sign Out
                </button>
             </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md text-slate-600 hover:bg-slate-100 lg:hidden mr-4"
            >
              <Menu size={24} />
            </button>
            
            {/* Search Bar */}
            <div className="hidden sm:flex items-center relative max-w-md w-64 lg:w-96">
              <Search size={18} className="absolute left-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search orders, SKUs, or shipments..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {currentView === View.DASHBOARD && <Dashboard />}
            {currentView === View.INVENTORY && <Inventory />}
            {currentView === View.SALES && <SalesOrders />}
            {currentView === View.WAREHOUSE && <Warehouse />}
            {currentView === View.LOGISTICS && <Logistics />}
            {currentView === View.PROFILE && (
               <AdminProfileComponent 
                  initialProfile={adminProfile} 
                  onUpdate={handleProfileUpdate} 
               />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;