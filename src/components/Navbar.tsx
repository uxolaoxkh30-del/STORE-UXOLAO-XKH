import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  Boxes, 
  AlertTriangle, 
  PlusCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  Menu, 
  X,
  Warehouse,
  Bell,
  Settings,
  Barcode
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAddProduct: () => void;
  onOpenStockIn: () => void;
  onOpenStockOut: () => void;
  onOpenSettings: () => void;
  onOpenBarcodeLabels: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAddProduct,
  onOpenStockIn,
  onOpenStockOut,
  onOpenSettings,
  onOpenBarcodeLabels,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { stats, settings } = useInventory();

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div 
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-base sm:text-lg leading-tight tracking-tight flex items-center gap-2">
                  <span>{settings.warehouseName}</span>
                  <span className="hidden sm:inline-block text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-normal">
                    Lao WMS
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xs">
                  {settings.companyName}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Low stock alert badge button */}
            {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
              <button
                onClick={() => setCurrentTab('reports')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition cursor-pointer text-xs font-medium animate-pulse"
                title="ມີສິນຄ້າໃກ້ໝົດ ຫຼື ໝົດສະຕັອກ"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">ສິນຄ້າໃກ້ໝົດ:</span>
                <span className="font-bold bg-amber-500 text-slate-900 rounded-full px-1.5 py-0.2 text-[11px]">
                  {stats.lowStockCount + stats.outOfStockCount}
                </span>
              </button>
            )}

            {/* Quick action buttons */}
            <button
              onClick={onOpenStockIn}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition cursor-pointer shadow-sm"
              title="ບັນທຶກຮັບສິນຄ້າເຂົ້າ"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span className="hidden sm:inline">ຮັບເຂົ້າ</span>
            </button>

            <button
              onClick={onOpenStockOut}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium transition cursor-pointer shadow-sm"
              title="ບັນທຶກເບີກສິນຄ້າອອກ"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span className="hidden sm:inline">ເບີກອອກ</span>
            </button>

            <button
              onClick={onOpenAddProduct}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer"
              title="ເພີ່ມສິນຄ້າໃໝ່ເຂົ້າລະບົບ"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>+ ສິນຄ້າໃໝ່</span>
            </button>

            {/* Barcode Labels quick button */}
            <button
              onClick={onOpenBarcodeLabels}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer text-xs"
              title="ພິມປ້າຍບາໂຄ້ດ (Barcode Labels)"
            >
              <Barcode className="w-4 h-4" />
            </button>

            {/* Settings & Backup quick button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer text-xs"
              title="ຕັ້ງຄ່າລະບົບສາງ ແລະ ສຳຮອງຂໍ້ມູນ"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
