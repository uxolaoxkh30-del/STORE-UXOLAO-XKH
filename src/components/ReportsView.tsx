import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product, PRODUCT_CATEGORIES } from '../types/inventory';
import { formatKip, formatNumber, exportToCSV } from '../utils/formatters';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShieldAlert,
  Boxes
} from 'lucide-react';

interface ReportsViewProps {
  onOpenStockIn: (productId?: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenStockIn }) => {
  const { products, movements, stats } = useInventory();

  // Active sub-tab
  const [activeReportTab, setActiveReportTab] = useState<'balance' | 'lowstock' | 'movements'>('balance');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Balance Report Products
  const balanceProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, categoryFilter, searchTerm]);

  // Totals for Balance Report
  const balanceTotals = useMemo(() => {
    let totalQty = 0;
    let totalCost = 0;
    let totalSale = 0;
    for (const p of balanceProducts) {
      totalQty += p.quantity;
      totalCost += p.quantity * p.costPrice;
      totalSale += p.quantity * p.sellingPrice;
    }
    return { totalQty, totalCost, totalSale, estimatedProfit: totalSale - totalCost };
  }, [balanceProducts]);

  // 2. Low Stock & Out of Stock Report
  const lowStockProducts = useMemo(() => {
    return products
      .filter(p => p.quantity <= p.minStockAlert)
      .map(p => {
        // Suggested reorder: bring up to 3x minStock or minimum 20
        const targetStock = Math.max(p.minStockAlert * 3, 20);
        const suggestedReorder = Math.max(targetStock - p.quantity, p.minStockAlert);
        const estimatedReorderCost = suggestedReorder * p.costPrice;
        return {
          ...p,
          suggestedReorder,
          estimatedReorderCost,
        };
      })
      .sort((a, b) => a.quantity - b.quantity);
  }, [products]);

  // 3. Date-filtered movements
  const filteredPeriodMovements = useMemo(() => {
    return movements.filter(m => {
      let matches = true;
      if (startDate) {
        matches = matches && m.date >= startDate;
      }
      if (endDate) {
        matches = matches && m.date.substring(0, 10) <= endDate;
      }
      return matches;
    });
  }, [movements, startDate, endDate]);

  const periodTotals = useMemo(() => {
    let inQty = 0;
    let inVal = 0;
    let outQty = 0;
    let outVal = 0;

    for (const m of filteredPeriodMovements) {
      if (m.type === 'IN') {
        inQty += m.quantity;
        inVal += m.totalValue;
      } else if (m.type === 'OUT') {
        outQty += m.quantity;
        outVal += m.totalValue;
      }
    }

    return { inQty, inVal, outQty, outVal };
  }, [filteredPeriodMovements]);

  // Native Print / PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel / CSV based on active tab
  const handleExportCSV = () => {
    const today = new Date().toISOString().substring(0, 10);

    if (activeReportTab === 'balance') {
      const headers = [
        'ລະຫັດສິນຄ້າ (SKU)',
        'ຊື່ສິນຄ້າ',
        'ໝວດໝູ່',
        'ຫົວໜ່ວຍ',
        'ຍອດຄົງເຫຼືອ',
        'ຕົ້ນທຶນຕໍ່ໜ່ວຍ (ກີບ)',
        'ມູນຄ່າຕົ້ນທຶນລວມ (ກີບ)',
        'ລາຄາຂາຍຕໍ່ໜ່ວຍ (ກີບ)',
        'ມູນຄ່າຂາຍລວມ (ກີບ)',
        'ກຳໄລຄາດຄະເນ (ກີບ)',
        'ບ່ອນຈັດເກັບ',
      ];
      const rows = balanceProducts.map(p => [
        p.sku,
        p.name,
        p.category,
        p.unit,
        p.quantity,
        p.costPrice,
        p.quantity * p.costPrice,
        p.sellingPrice,
        p.quantity * p.sellingPrice,
        p.quantity * (p.sellingPrice - p.costPrice),
        p.location,
      ]);
      exportToCSV(headers, rows, `ລາຍງານຍອດຄົງເຫຼືອສາງ_${today}`);
    } else if (activeReportTab === 'lowstock') {
      const headers = [
        'ລະຫັດສິນຄ້າ (SKU)',
        'ຊື່ສິນຄ້າ',
        'ໝວດໝູ່',
        'ຫົວໜ່ວຍ',
        'ຍອດຄົງເຫຼືອ',
        'ຈຸດເຕືອນຂັ້ນຕ່ຳ',
        'ສະຖານະ',
        'ຈຳນວນແນະນຳສັ່ງຊື້',
        'ຕົ້ນທຶນຕໍ່ໜ່ວຍ (ກີບ)',
        'ມູນຄ່າສັ່ງຊື້ຄາດຄະເນ (ກີບ)',
        'ຜູ້ສະໜອງ',
      ];
      const rows = lowStockProducts.map(p => [
        p.sku,
        p.name,
        p.category,
        p.unit,
        p.quantity,
        p.minStockAlert,
        p.quantity === 0 ? 'ໝົດສະຕັອກ' : 'ໃກ້ໝົດ',
        p.suggestedReorder,
        p.costPrice,
        p.estimatedReorderCost,
        p.supplier || '',
      ]);
      exportToCSV(headers, rows, `ລາຍງານສິນຄ້າໃກ້ໝົດ_${today}`);
    } else {
      const headers = [
        'ເລກທີເອກະສານ',
        'ປະເພດ',
        'ວັນທີ-ເວລາ',
        'ລະຫັດສິນຄ້າ',
        'ຊື່ສິນຄ້າ',
        'ຈຳນວນ',
        'ຫົວໜ່ວຍ',
        'ລາຄາຕໍ່ໜ່ວຍ (ກີບ)',
        'ມູນຄ່າລວມ (ກີບ)',
        'ຜູ້ສົ່ງ/ຜູ້ເບີກ',
        'ຜູ້ບັນທຶກ',
        'ເຫດຜົນ',
      ];
      const rows = filteredPeriodMovements.map(m => [
        m.documentNo,
        m.type === 'IN' ? 'ຮັບເຂົ້າ' : m.type === 'OUT' ? 'ເບີກອອກ' : 'ປັບປຸງ',
        m.date,
        m.productSku,
        m.productName,
        m.quantity,
        m.unit,
        m.unitCost,
        m.totalValue,
        m.partyName,
        m.staffName,
        m.reason,
      ]);
      exportToCSV(headers, rows, `ສະຫຼຸບຮັບເຂົ້າເບີກອອກ_${today}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Printable Report Header (Visible only when printing) */}
      <div className="print-only mb-6 text-slate-900 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">ສາງສິນຄ້າສູນກາງ ວຽງຈັນ (Central Warehouse)</h1>
            <p className="text-sm text-slate-600">
              {activeReportTab === 'balance'
                ? 'ລາຍງານສະຫຼຸບຍອດສິນຄ້າຄົງເຫຼືອ ແລະ ມູນຄ່າສາງ (Inventory Valuation Report)'
                : activeReportTab === 'lowstock'
                ? 'ລາຍງານແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດ & ແຜນສັ່ງຊື້ເພີ່ມ (Low Stock & Reorder Report)'
                : 'ລາຍງານສະຫຼຸບການຮັບເຂົ້າ–ເບີກອອກສິນຄ້າ (Stock Movement Summary)'}
            </p>
          </div>
          <div className="text-right text-xs">
            <p>ວັນທີພິມລາຍງານ: {new Date().toLocaleDateString('en-GB')}</p>
            <p>ຜູ້ອອກລາຍງານ: ຫົວໜ້າຄຸ້ມຄອງສາງ</p>
          </div>
        </div>
      </div>

      {/* Screen Header Controls (Hidden when printing) */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ລາຍງານ ແລະ ກວດສອບສະຕັອກ (Reports & Audit)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ຄົ້ນຫາຕາມວັນທີ, ລາຍງານຍອດຄົງເຫຼືອ, ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດ ແລະ Export Excel / ພິມ PDF
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>ພິມລາຍງານ / PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 pt-5">
          <button
            onClick={() => setActiveReportTab('balance')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer flex items-center gap-2 ${
              activeReportTab === 'balance'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>1. ລາຍງານຍອດຄົງເຫຼືອ & ມູນຄ່າສາງ</span>
            <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
              {balanceProducts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveReportTab('lowstock')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer flex items-center gap-2 ${
              activeReportTab === 'lowstock'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>2. ສິນຄ້າໃກ້ໝົດ / ແຜນສັ່ງຊື້</span>
            <span className="text-xs font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              {lowStockProducts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveReportTab('movements')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer flex items-center gap-2 ${
              activeReportTab === 'movements'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>3. ສະຫຼຸບຮັບ-ເບີກ ຕາມຊ່ວງວັນທີ</span>
          </button>
        </div>

        {/* Filters specific to tab */}
        {activeReportTab === 'balance' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ຄົ້ນຫາໃນລາຍງານ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white cursor-pointer"
              >
                <option value="ALL">ໝວດໝູ່ທັງໝົດ</option>
                {PRODUCT_CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeReportTab === 'movements' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 whitespace-nowrap">ເລີ່ມແຕ່ວັນທີ:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full py-1.5 px-3 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 whitespace-nowrap">ເຖິງວັນທີ:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full py-1.5 px-3 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* ======================= TAB 1: BALANCE & VALUATION REPORT ======================= */}
      {activeReportTab === 'balance' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">ຍອດສິນຄ້າຄົງເຫຼືອລວມ</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {formatNumber(balanceTotals.totalQty)} <span className="text-xs font-normal text-slate-500">ໜ່ວຍ</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">ມູນຄ່າສາງ (ຕົ້ນທຶນລວມ)</span>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono text-indigo-700">
                {formatKip(balanceTotals.totalCost)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">ມູນຄ່າຂາຍລວມ</span>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono text-emerald-700">
                {formatKip(balanceTotals.totalSale)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">ກຳໄລຄາດຄະເນ (Margin)</span>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono text-blue-700">
                {formatKip(balanceTotals.estimatedProfit)}
              </div>
            </div>
          </div>

          {/* Balance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700 text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">ລ/ດ</th>
                    <th className="py-3 px-3">ລະຫັດ & ຊື່ສິນຄ້າ</th>
                    <th className="py-3 px-3">ໝວດໝູ່</th>
                    <th className="py-3 px-3 text-center">ຫົວໜ່ວຍ</th>
                    <th className="py-3 px-3 text-right">ຍອດຄົງເຫຼືອ</th>
                    <th className="py-3 px-3 text-right">ຕົ້ນທຶນ/ໜ່ວຍ</th>
                    <th className="py-3 px-3 text-right">ມູນຄ່າຕົ້ນທຶນ</th>
                    <th className="py-3 px-3 text-right">ລາຄາຂາຍ/ໜ່ວຍ</th>
                    <th className="py-3 px-3 text-right">ມູນຄ່າຂາຍລວມ</th>
                    <th className="py-3 px-3">ບ່ອນຈັດເກັບ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {balanceProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{p.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.category}</td>
                      <td className="py-2.5 px-3 text-center font-medium">{p.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNumber(p.quantity)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatKip(p.costPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-indigo-900">
                        {formatKip(p.quantity * p.costPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatKip(p.sellingPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-800">
                        {formatKip(p.quantity * p.sellingPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.location}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300 text-xs">
                  <tr>
                    <td colSpan={4} className="py-3 px-3 text-right text-slate-700">
                      ຍອດລວມທັງໝົດ:
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-900">
                      {formatNumber(balanceTotals.totalQty)}
                    </td>
                    <td></td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-900">
                      {formatKip(balanceTotals.totalCost)}
                    </td>
                    <td></td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-800">
                      {formatKip(balanceTotals.totalSale)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: LOW STOCK & REORDER REPORT ======================= */}
      {activeReportTab === 'lowstock' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base">ລາຍການສິນຄ້າທີ່ຮອດຈຸດເຕືອນສະຕັອກຂັ້ນຕ່ຳ</h3>
              <p className="text-xs text-amber-800 mt-1">
                ລະບົບຄຳນວນຈຳນວນແນະນຳສັ່ງຊື້ ແລະ ງົບປະມານທີ່ຕ້ອງໃຊ້ ເພື່ອບໍ່ໃຫ້ສິນຄ້າຂາດສະຕັອກ
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">ລະຫັດ & ຊື່ສິນຄ້າ</th>
                    <th className="py-3 px-3">ສະຖານະ</th>
                    <th className="py-3 px-3 text-center">ຍອດຄົງເຫຼືອ</th>
                    <th className="py-3 px-3 text-center">ຈຸດເຕືອນ</th>
                    <th className="py-3 px-3 text-center">ແນະນຳສັ່ງຊື້</th>
                    <th className="py-3 px-3 text-right">ຕົ້ນທຶນ/ໜ່ວຍ</th>
                    <th className="py-3 px-3 text-right">ງົບສັ່ງຊື້ຄາດຄະເນ</th>
                    <th className="py-3 px-3">ຜູ້ສະໜອງ</th>
                    <th className="py-3 px-3 text-center no-print">ດຳເນີນການ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                        <p className="font-medium text-slate-700">ຍິນດີດ້ວຍ! ບໍ່ມີສິນຄ້າໃກ້ໝົດສະຕັອກໃນຂະນະນີ້</p>
                      </td>
                    </tr>
                  ) : (
                    lowStockProducts.map(p => {
                      const isOut = p.quantity === 0;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{p.name}</div>
                            <div className="font-mono text-slate-500">{p.sku}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isOut
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {isOut ? 'ໝົດສະຕັອກ (0)' : 'ໃກ້ໝົດ'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold font-mono text-slate-900">
                            {p.quantity} {p.unit}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-500">
                            &le; {p.minStockAlert} {p.unit}
                          </td>
                          <td className="py-3 px-3 text-center font-bold font-mono text-indigo-700 bg-indigo-50/50">
                            +{p.suggestedReorder} {p.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">{formatKip(p.costPrice)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatKip(p.estimatedReorderCost)}
                          </td>
                          <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">
                            {p.supplier || '-'}
                          </td>
                          <td className="py-3 px-3 text-center no-print">
                            <button
                              onClick={() => onOpenStockIn(p.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                            >
                              + ສັ່ງຮັບເຂົ້າ
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
        </div>
      )}

      {/* ======================= TAB 3: PERIOD MOVEMENT SUMMARY ======================= */}
      {activeReportTab === 'movements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <span className="text-xs font-semibold text-emerald-800 uppercase">ຍອດຮັບເຂົ້າໃນຊ່ວງວັນທີ</span>
              <div className="text-2xl font-bold text-emerald-950 mt-1 font-mono">
                +{formatNumber(periodTotals.inQty)} <span className="text-sm font-normal">ໜ່ວຍ</span>
              </div>
              <p className="text-xs text-emerald-700 mt-1">ມູນຄ່າຮັບເຂົ້າ: {formatKip(periodTotals.inVal)}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <span className="text-xs font-semibold text-blue-800 uppercase">ຍອດເບີກອອກໃນຊ່ວງວັນທີ</span>
              <div className="text-2xl font-bold text-blue-950 mt-1 font-mono">
                -{formatNumber(periodTotals.outQty)} <span className="text-sm font-normal">ໜ່ວຍ</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">ມູນຄ່າເບີກອອກ: {formatKip(periodTotals.outVal)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">ເລກທີເອກະສານ</th>
                    <th className="py-3 px-3">ປະເພດ</th>
                    <th className="py-3 px-3">ວັນທີ-ເວລາ</th>
                    <th className="py-3 px-3">ສິນຄ້າ</th>
                    <th className="py-3 px-3 text-right">ຈຳນວນ</th>
                    <th className="py-3 px-3 text-right">ມູນຄ່າລວມ</th>
                    <th className="py-3 px-3">ຜູ້ສົ່ງມອບ / ຜູ້ເບີກ</th>
                    <th className="py-3 px-3">ເຫດຜົນ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPeriodMovements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{m.documentNo}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            m.type === 'IN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.type === 'OUT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.type === 'IN' ? 'ຮັບເຂົ້າ' : m.type === 'OUT' ? 'ເບີກອອກ' : 'ປັບປຸງ'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{m.date}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{m.productName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : ''}
                        {formatNumber(m.quantity)} {m.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatKip(m.totalValue)}</td>
                      <td className="py-2.5 px-3 text-slate-700">{m.partyName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Signature lines for printable report */}
      <div className="print-only mt-12 pt-8 border-t border-slate-400">
        <div className="grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <p className="mb-12 font-medium">ຜູ້ສັງລວມລາຍງານ</p>
            <p>................................................</p>
            <p className="mt-1 text-slate-500">(ເຈົ້າໜ້າທີ່ສາງ)</p>
          </div>
          <div>
            <p className="mb-12 font-medium">ຜູ້ກວດສອບບັນຊີສະຕັອກ</p>
            <p>................................................</p>
            <p className="mt-1 text-slate-500">(ຫົວໜ້າກວດສອບ)</p>
          </div>
          <div>
            <p className="mb-12 font-medium">ຜູ້ອຳນວຍການ / ຫົວໜ້າສາງ</p>
            <p>................................................</p>
            <p className="mt-1 text-slate-500">(ລາຍເຊັນ ແລະ ປະທັບກາ)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
