import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Truck, 
  Activity,
  CheckCircle,
  AlertOctagon,
  ClipboardList
} from 'lucide-react';
import { KPI } from '../types';

const IconMap: Record<string, React.FC<any>> = {
  DollarSign,
  ShoppingCart,
  Package,
  Truck,
  Activity,
  CheckCircle,
  AlertOctagon,
  ClipboardList
};

interface KPICardProps {
  kpi: KPI;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  const Icon = IconMap[kpi.iconName] || Activity;
  
  // Determine color based on trend and sentiment
  // If sentiment is explicitly provided, use it. Otherwise assume 'up' is good.
  const isPositive = kpi.sentiment === 'positive' || (kpi.sentiment !== 'negative' && kpi.trend === 'up');
  const isNegative = kpi.sentiment === 'negative' || (kpi.sentiment !== 'positive' && kpi.trend === 'down');

  const getThemeColor = () => {
    if (kpi.sentiment === 'positive') return 'text-emerald-600 bg-emerald-50';
    if (kpi.sentiment === 'negative') return 'text-rose-600 bg-rose-50';
    if (kpi.sentiment === 'neutral') return 'text-blue-600 bg-blue-50';
    
    // Fallback to trend based
    switch(kpi.trend) {
      case 'up': return 'text-emerald-600 bg-emerald-50';
      case 'down': return 'text-rose-600 bg-rose-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : kpi.trend === 'down' ? ArrowDownRight : Minus;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${getThemeColor()} bg-opacity-50`}>
          <Icon size={20} />
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            kpi.trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 
            kpi.trend === 'down' ? 'text-rose-700 bg-rose-50' : 'text-slate-600 bg-slate-50'
        }`}>
          <TrendIcon size={14} />
          <span>{Math.abs(kpi.change)}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{kpi.label}</p>
        <h3 className="text-2xl font-bold text-slate-900">{kpi.value}</h3>
      </div>
    </div>
  );
};