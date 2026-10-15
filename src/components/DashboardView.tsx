import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { StockMovement, Product } from '../types/inventory';
import { formatKip, formatNumber, formatDateTime } from '../utils/formatters';
import { 
  Package, 
  Boxes, 
  DollarSign, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  PlusCircle, 
  FileText, 
  Clock, 
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenStockIn: (productId?: string) => void;
  onOpenStockOut: (productId?: string) => void;
  onOpenAddProduct: () => void;
  onSelectVoucher: (movement: StockMovement) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenStockIn,
  onOpenStockOut,
  onOpenAddProduct,
  onSelectVoucher,
}) => {
  const { stats, products, movements } = useInventory();

  // Find products that are low in stock or out of stock
  const alertProducts = products.filter(p => p.quantity <= p.minStockAlert);
  const recentMovements = movements.slice(0, 6);

  // Group by category for distribution
  const categoryMap = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.quantity;
    return acc;
  }, {} as Record<string, number>);

  const categoryEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ລະບົບເຮັດວຽກປົກກະຕິ (Live Sync)
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Dashboard ພາບລວມສາງສິນຄ້າ
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              ຕິດຕາມຍອດຄົງເຫຼືອ, ມູນຄ່າສາງ, ລາຍການຮັບເຂົ້າ–ເບີກອອກ ແລະ ແຈ້ງເຕືອນສະຕັອກ
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onOpenStockIn()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-md shadow-emerald-900/30 cursor-pointer active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              + ຮັບສິນຄ້າເຂົ້າ
            </button>
            <button
              onClick={() => onOpenStockOut()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-md shadow-blue-900/30 cursor-pointer active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              - ເບີກສິນຄ້າອອກ
            </button>
            <button
              onClick={onOpenAddProduct}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              + ເພີ່ມສິນຄ້າ
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total SKUs */}
        <div 
          onClick={() => onNavigateTab('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ຈຳນວນລາຍການສິນຄ້າ
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {formatNumber(stats.totalSkus)}
            <span className="text-sm font-normal text-slate-500 ml-1.5">ລາຍການ</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500">
            <span>ຈັດການລະຫັດ SKU & Barcode</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 2: Total Quantity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ຍອດຄົງເຫຼືອທັງໝົດ
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {formatNumber(stats.totalQuantity)}
            <span className="text-sm font-normal text-slate-500 ml-1.5">ໜ່ວຍ</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>ສິນຄ້າພ້ອມສົ່ງໃນສາງ</span>
          </div>
        </div>

        {/* Card 3: Inventory Valuation */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ມູນຄ່າສາງລວມ (ຕົ້ນທຶນ)
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
            {formatKip(stats.totalCostValue)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>ມູນຄ່າຂາຍ: {formatKip(stats.totalSellingValue)}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className={`p-5 rounded-2xl border shadow-xs transition cursor-pointer group ${
            stats.lowStockCount > 0 || stats.outOfStockCount > 0
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/70'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              ສິນຄ້າໃກ້ໝົດ / ໝົດສະຕັອກ
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-900 tracking-tight">
            {stats.lowStockCount + stats.outOfStockCount}
            <span className="text-sm font-normal text-amber-700 ml-1.5">ລາຍການ</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-amber-800 font-medium">
            <span>
              ໃກ້ໝົດ: {stats.lowStockCount} | ໝົດ: {stats.outOfStockCount}
            </span>
            <span className="underline group-hover:text-amber-950">ກວດສອບດ່ວນ &rarr;</span>
          </div>
        </div>
      </div>

      {/* Monthly Stock Movement Quick Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Stock In */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase">ຮັບສິນຄ້າເຂົ້າເດືອນນີ້</p>
              <h3 className="text-2xl font-bold text-emerald-950">
                +{formatNumber(stats.monthlyInQty)} <span className="text-sm font-normal">ໜ່ວຍ</span>
              </h3>
              <p className="text-xs text-emerald-700">ມູນຄ່າຮັບເຂົ້າ: {formatKip(stats.monthlyInValue)}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('stock-in')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition cursor-pointer"
          >
            ບັນທຶກຮັບເຂົ້າ
          </button>
        </div>

        {/* Monthly Stock Out */}
        <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-800 uppercase">ເບີກສິນຄ້າອອກເດືອນນີ້</p>
              <h3 className="text-2xl font-bold text-blue-950">
                -{formatNumber(stats.monthlyOutQty)} <span className="text-sm font-normal">ໜ່ວຍ</span>
              </h3>
              <p className="text-xs text-blue-700">ມູນຄ່າເບີກອອກ: {formatKip(stats.monthlyOutValue)}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('stock-out')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition cursor-pointer"
          >
            ບັນທຶກເບີກອອກ
          </button>
        </div>
      </div>

      {/* Urgent Low Stock Alerts Section */}
      {alertProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-900 text-base">
                ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດ & ໝົດສະຕັອກ ({alertProducts.length} ລາຍການ)
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              ເບິ່ງລາຍການສັ່ງຊື້ເພີ່ມ &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertProducts.map(p => {
              const isOut = p.quantity === 0;
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    isOut
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-semibold text-slate-500">
                        {p.sku}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isOut
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {isOut ? 'ໝົດສະຕັອກ' : 'ໃກ້ໝົດ'}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-900 truncate mt-0.5">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      ຍອດຄົງເຫຼືອ: <strong className={isOut ? 'text-rose-600' : 'text-amber-700'}>{p.quantity}</strong> / ຂັ້ນຕ່ຳ {p.minStockAlert} {p.unit}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenStockIn(p.id)}
                    className="shrink-0 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
                    title="ຮັບສິນຄ້ານີ້ເຂົ້າສາງດ່ວນ"
                  >
                    + ຮັບເຂົ້າ
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Grid: Recent Movements & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Movements Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">ລາຍການເຄື່ອນໄຫວຫຼ້າສຸດ</h2>
              <p className="text-xs text-slate-500">ປະຫວັດການຮັບເຂົ້າ ແລະ ເບີກອອກສິນຄ້າຫຼ້າສຸດ</p>
            </div>
            <button
              onClick={() => onNavigateTab('movements')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              ເບິ່ງທັງໝົດ &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ເລກທີ / ວັນທີ</th>
                  <th className="py-2.5 px-3">ປະເພດ</th>
                  <th className="py-2.5 px-3">ສິນຄ້າ</th>
                  <th className="py-2.5 px-3 text-right">ຈຳນວນ</th>
                  <th className="py-2.5 px-3">ຜູ້ຕິດຕໍ່</th>
                  <th className="py-2.5 px-3 text-center">ໃບເອກະສານ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      ຍັງບໍ່ມີລາຍການເຄື່ອນໄຫວໃນລະບົບ
                    </td>
                  </tr>
                ) : (
                  recentMovements.map(m => {
                    const isIn = m.type === 'IN';
                    const isOut = m.type === 'OUT';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3">
                          <div className="font-mono text-xs font-semibold text-slate-800">
                            {m.documentNo}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(m.date)}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              isIn
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOut
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isIn ? <ArrowDownLeft className="w-3 h-3" /> : isOut ? <ArrowUpRight className="w-3 h-3" /> : null}
                            {isIn ? 'ຮັບເຂົ້າ' : isOut ? 'ເບີກອອກ' : 'ປັບປຸງ'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-900 truncate max-w-[180px]">
                            {m.productName}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">{m.productSku}</div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div
                            className={`font-bold font-mono ${
                              isIn ? 'text-emerald-600' : isOut ? 'text-blue-600' : 'text-slate-700'
                            }`}
                          >
                            {isIn ? '+' : isOut ? '-' : ''}
                            {formatNumber(m.quantity)} {m.unit}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {formatKip(m.totalValue)}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs text-slate-800 truncate max-w-[120px]">
                            {m.partyName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                            {m.staffName}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onSelectVoucher(m)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="ເບິ່ງ & ພິມໃບເອກະສານ"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Breakdown by Category (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">ສັດສ່ວນສິນຄ້າຕາມໝວດໝູ່</h2>
                <p className="text-xs text-slate-500">ຈຳນວນສະຕັອກຄົງເຫຼືອແບ່ງຕາມປະເພດ</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {categoryEntries.map(([category, count]) => {
                const percent = stats.totalQuantity > 0 ? Math.round((count / stats.totalQuantity) * 100) : 0;
                return (
                  <div key={category}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-medium text-slate-700">{category}</span>
                      <span className="text-slate-500 font-mono">
                        <strong>{formatNumber(count)}</strong> ໜ່ວຍ ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
              <span>ຄຸ້ມຄອງສິນຄ້າທັງໝົດ {stats.totalSkus} ລາຍການ</span>
              <button
                onClick={() => onNavigateTab('products')}
                className="text-indigo-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                ຈັດການ &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
