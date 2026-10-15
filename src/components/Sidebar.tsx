import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  BarChart3, 
  AlertCircle,
  FileSpreadsheet,
  Boxes,
  Building2
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { stats, suppliers } = useInventory();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard ພາບລວມ',
      sublabel: 'Overview & Analytics',
      icon: LayoutDashboard,
    },
    {
      id: 'products',
      label: 'ຈັດການສິນຄ້າ',
      sublabel: 'Product Management',
      icon: Package,
      badge: stats.totalSkus,
    },
    {
      id: 'suppliers',
      label: 'ຜູ້ສະໜອງສິນຄ້າ',
      sublabel: 'Supplier Management',
      icon: Building2,
      badge: suppliers.length,
      color: 'text-indigo-400',
    },
    {
      id: 'stock-in',
      label: 'ຮັບສິນຄ້າເຂົ້າ',
      sublabel: 'Stock In Movement',
      icon: ArrowDownLeft,
      color: 'text-emerald-400',
    },
    {
      id: 'stock-out',
      label: 'ເບີກສິນຄ້າອອກ',
      sublabel: 'Stock Out Movement',
      icon: ArrowUpRight,
      color: 'text-blue-400',
    },
    {
      id: 'movements',
      label: 'ປະຫວັດເຄື່ອນໄຫວ',
      sublabel: 'Movement Ledger',
      icon: History,
      badge: stats.totalMovements,
    },
    {
      id: 'zones',
      label: 'ແຜນຜັງ & ໂຊນສາງ',
      sublabel: 'Warehouse Zones',
      icon: Boxes,
      color: 'text-amber-400',
    },
    {
      id: 'stock-take',
      label: 'ກວດນັບສະຕັອກສາງ',
      sublabel: 'Stock Take Session',
      icon: FileSpreadsheet,
      color: 'text-teal-400',
    },
    {
      id: 'reports',
      label: 'ລາຍງານ & ສະຕັອກ',
      sublabel: 'Reports & Audit',
      icon: BarChart3,
      alertCount: stats.lowStockCount + stats.outOfStockCount,
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-xs no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed lg:static top-16 bottom-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            ເມນູຫຼັກ (Navigation)
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition cursor-pointer group ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/25'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-white' : item.color || 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-sm leading-snug">{item.label}</div>
                    <div
                      className={`text-[11px] truncate font-normal ${
                        isActive ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {item.alertCount !== undefined && item.alertCount > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono flex items-center gap-1 ${
                      isActive
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3" />
                    {item.alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Warehouse Status widget */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-indigo-400" />
                ສະຫຼຸບສະຕັອກສາງ
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>ຍອດສິນຄ້າລວມ:</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {formatNumber(stats.totalQuantity)} ໜ່ວຍ
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ສິນຄ້າໃກ້ໝົດ:</span>
                <span
                  className={`font-semibold font-mono ${
                    stats.lowStockCount > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {stats.lowStockCount} ລາຍການ
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ໝົດສະຕັອກ:</span>
                <span
                  className={`font-semibold font-mono ${
                    stats.outOfStockCount > 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {stats.outOfStockCount} ລາຍການ
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-center text-slate-400">
            ລະບົບຄຸ້ມຄອງສາງ © 2026 Lao WMS
          </div>
        </div>
      </aside>
    </>
  );
};
