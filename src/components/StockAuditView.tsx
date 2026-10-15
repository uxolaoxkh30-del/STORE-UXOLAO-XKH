import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product, PRODUCT_CATEGORIES } from '../types/inventory';
import { formatNumber, formatKip } from '../utils/formatters';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Search, 
  Filter, 
  Check, 
  Plus, 
  Minus, 
  RotateCcw,
  SlidersHorizontal,
  PackageCheck
} from 'lucide-react';

interface StockAuditViewProps {
  onNavigateMovements: () => void;
}

export const StockAuditView: React.FC<StockAuditViewProps> = ({ onNavigateMovements }) => {
  const { products, batchAuditReconcile } = useInventory();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [auditorName, setAuditorName] = useState<string>('ສົມຊາຍ ແກ້ວມະນີ (ຫົວໜ້າສາງ)');
  const [auditReason, setAuditReason] = useState<string>('ກວດນັບສະຕັອກປະຈຳງວດ');

  // Track physical count input per product id
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    products.forEach(p => {
      initial[p.id] = p.quantity;
    });
    return initial;
  });

  const [reconciledResult, setReconciledResult] = useState<{ count: number } | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
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

  // Handle count change
  const handleCountChange = (productId: string, val: number) => {
    setCounts(prev => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  // Discrepancies calculation
  const discrepancies = useMemo(() => {
    let surplusCount = 0;
    let deficitCount = 0;
    let totalVarianceValue = 0;

    const items = filteredProducts.map(p => {
      const counted = counts[p.id] ?? p.quantity;
      const diff = counted - p.quantity;
      const varianceVal = Math.abs(diff) * p.costPrice;

      if (diff > 0) surplusCount++;
      if (diff < 0) deficitCount++;
      totalVarianceValue += diff * p.costPrice;

      return {
        product: p,
        counted,
        diff,
        varianceVal,
      };
    });

    return {
      items,
      surplusCount,
      deficitCount,
      totalDiscrepancies: surplusCount + deficitCount,
      totalVarianceValue,
    };
  }, [filteredProducts, counts]);

  // Execute batch reconciliation
  const handleBatchReconcile = () => {
    const itemsToReconcile = discrepancies.items
      .filter(item => item.diff !== 0)
      .map(item => ({
        productId: item.product.id,
        countedQty: item.counted,
        reason: auditReason,
        staffName: auditorName,
        notes: `ປັບປຸງຍອດຈາກການກວດນັບ: ${item.diff > 0 ? '+' : ''}${item.diff} ${item.product.unit}`,
      }));

    if (itemsToReconcile.length === 0) {
      alert('ບໍ່ມີລາຍການທີ່ຍອດແຕກຕ່າງກັນ ທຸກລາຍການກົງກັບລະບົບແລ້ວ');
      return;
    }

    if (!confirm(`ຢືນຢັນການປັບປຸງຍອດສິນຄ້າຈຳນວນ ${itemsToReconcile.length} ລາຍການແທ້ບໍ່?`)) {
      return;
    }

    const res = batchAuditReconcile(itemsToReconcile);
    setReconciledResult(res);
  };

  // Reset counts to current system quantities
  const handleResetCounts = () => {
    const resetObj: Record<string, number> = {};
    products.forEach(p => {
      resetObj[p.id] = p.quantity;
    });
    setCounts(resetObj);
    setReconciledResult(null);
  };

  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Screen Header Controls (Hidden during print) */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  ລະບົບກວດນັບສະຕັອກສາງ (Stock Take Session)
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  ປຽບທຽບຍອດໃນລະບົບກັບຍອດຕົວຈິງ, ຄິດໄລ່ຜົນຕ່າງ (Variance) ແລະ ປັບຍອດອັດຕະໂນມັດ
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrintSheet}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer"
              title="ພິມໃບກວດນັບສຳລັບຍ່າງກວດໃນສາງ"
            >
              <Printer className="w-4 h-4" />
              <span>ພິມໃບກວດນັບ / PDF</span>
            </button>

            <button
              onClick={handleResetCounts}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-medium transition cursor-pointer"
              title="ຣີເຊັດຕົວເລກກັບຄືນເທົ່າຍອດລະບົບ"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ຣີເຊັດຕົວເລກ</span>
            </button>

            <button
              onClick={handleBatchReconcile}
              disabled={discrepancies.totalDiscrepancies === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shadow-md ${
                discrepancies.totalDiscrepancies === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>ຢືນຢັນປັບຍອດທັງໝົດ ({discrepancies.totalDiscrepancies})</span>
            </button>
          </div>
        </div>

        {/* Audit Meta Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              ຜູ້ກວດນັບ (Auditor)
            </label>
            <input
              type="text"
              value={auditorName}
              onChange={e => setAuditorName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              ເຫດຜົນການກວດນັບ (Reason)
            </label>
            <input
              type="text"
              value={auditReason}
              onChange={e => setAuditReason(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              ກັ່ນຕອງໝວດໝູ່
            </label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white cursor-pointer"
            >
              <option value="ALL">ທຸກໝວດໝູ່</option>
              {PRODUCT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              ຄົ້ນຫາສິນຄ້າ
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ຊື່, SKU, ໂຊນ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {reconciledResult && (
        <div className="no-print p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              ປັບປຸງຍອດສະຕັອກສຳເລັດແລ້ວຈຳນວນ {reconciledResult.count} ລາຍການ! ບັນທຶກລົງບັນຊີເຄື່ອນໄຫວຮຽບຮ້ອຍ
            </span>
          </div>
          <button
            onClick={onNavigateMovements}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            ເບິ່ງປະຫວັດເຄື່ອນໄຫວ &rarr;
          </button>
        </div>
      )}

      {/* Discrepancy KPI Summary */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 uppercase font-semibold">ລາຍການທີ່ກວດນັບທັງໝົດ</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {filteredProducts.length} <span className="text-xs font-normal text-slate-500">ລາຍການ</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 uppercase font-semibold">ລາຍການທີ່ບໍ່ກົງກັນ (Discrepancies)</span>
          <div className={`text-2xl font-bold mt-1 font-mono ${discrepancies.totalDiscrepancies > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {discrepancies.totalDiscrepancies} <span className="text-xs font-normal text-slate-500">ລາຍການ</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ເກີນ: +{discrepancies.surplusCount} | ຂາດ: -{discrepancies.deficitCount}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 uppercase font-semibold">ມູນຄ່າຜົນຕ່າງສຸດທິ (Net Variance)</span>
          <div className={`text-xl font-bold mt-1 font-mono ${discrepancies.totalVarianceValue < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatKip(discrepancies.totalVarianceValue)}
          </div>
        </div>
      </div>

      {/* Printable Sheet Header (Visible when printing) */}
      <div className="print-only mb-6 text-slate-900 border-b-2 border-slate-900 pb-4">
        <h1 className="text-2xl font-bold">ໃບກວດນັບສະຕັອກສິນຄ້າຕົວຈິງ (Physical Stock Count Sheet)</h1>
        <p className="text-xs text-slate-600 mt-1">
          ສາງສິນຄ້າສູນກາງ ວຽງຈັນ | ວັນທີ: {new Date().toLocaleDateString('en-GB')} | ຜູ້ກວດ: {auditorName}
        </p>
      </div>

      {/* Stock Take Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">ລ/ດ</th>
                <th className="py-3 px-3">ສິນຄ້າ & ລະຫັດ SKU</th>
                <th className="py-3 px-3">ບ່ອນຈັດເກັບ</th>
                <th className="py-3 px-3 text-center">ຫົວໜ່ວຍ</th>
                <th className="py-3 px-3 text-center">ຍອດລະບົບ</th>
                <th className="py-3 px-3 text-center w-48">ຈຳນວນກວດນັບຕົວຈິງ</th>
                <th className="py-3 px-3 text-center">ຜົນຕ່າງ (+/-)</th>
                <th className="py-3 px-3 text-right">ມູນຄ່າຜົນຕ່າງ</th>
                <th className="py-3 px-3 text-center no-print">ສະຖານະ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {discrepancies.items.map((item, idx) => {
                const isExact = item.diff === 0;
                const isSurplus = item.diff > 0;
                const isDeficit = item.diff < 0;

                return (
                  <tr key={item.product.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{item.product.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{item.product.sku}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.product.location}</td>
                    <td className="py-3 px-3 text-center font-medium">{item.product.unit}</td>
                    
                    {/* System expected stock */}
                    <td className="py-3 px-3 text-center font-bold font-mono text-slate-800 bg-slate-50/50">
                      {item.product.quantity}
                    </td>

                    {/* Physical Count Input */}
                    <td className="py-2 px-3 text-center">
                      <div className="no-print inline-flex items-center gap-1 border border-slate-300 rounded-xl p-1 bg-white">
                        <button
                          type="button"
                          onClick={() => handleCountChange(item.product.id, item.counted - 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.counted}
                          onChange={e => handleCountChange(item.product.id, Number(e.target.value))}
                          className="w-16 text-center font-mono font-bold text-sm focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleCountChange(item.product.id, item.counted + 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Printable blank underline for physical sheet */}
                      <span className="print-only inline-block w-20 border-b border-black text-center font-mono font-bold">
                        {item.counted}
                      </span>
                    </td>

                    {/* Variance difference */}
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {isExact ? (
                        <span className="text-slate-400">0</span>
                      ) : isSurplus ? (
                        <span className="text-emerald-600">+{item.diff}</span>
                      ) : (
                        <span className="text-rose-600">{item.diff}</span>
                      )}
                    </td>

                    {/* Variance value */}
                    <td className="py-3 px-3 text-right font-mono text-xs">
                      {isExact ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        <span className={isSurplus ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                          {isSurplus ? '+' : '-'}{formatKip(item.varianceVal)}
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-3 text-center no-print">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isExact
                            ? 'bg-slate-100 text-slate-600'
                            : isSurplus
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isExact ? 'ກົງກັນ' : isSurplus ? 'ຍອດເກີນ' : 'ຍອດຂາດ'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
