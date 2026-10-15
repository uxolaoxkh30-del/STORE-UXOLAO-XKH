import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { StockMovement, STOCK_IN_REASONS } from '../types/inventory';
import { formatKip, formatNumber, generateDocNumber } from '../utils/formatters';
import { 
  ArrowDownLeft, 
  Package, 
  CheckCircle, 
  Printer, 
  FileText, 
  Search, 
  Calendar, 
  User, 
  DollarSign, 
  Building2,
  FileSpreadsheet
} from 'lucide-react';

interface StockInViewProps {
  initialProductId?: string;
  onSelectVoucher: (movement: StockMovement) => void;
}

export const StockInView: React.FC<StockInViewProps> = ({
  initialProductId,
  onSelectVoucher,
}) => {
  const { products, movements, recordStockIn } = useInventory();

  // Find initial product or fallback to first product
  const defaultProduct = initialProductId
    ? products.find(p => p.id === initialProductId) || products[0]
    : products[0];

  const [selectedProductId, setSelectedProductId] = useState<string>(defaultProduct?.id || '');
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(defaultProduct?.costPrice || 0);
  const [supplier, setSupplier] = useState<string>(defaultProduct?.supplier || 'ບໍລິສັດ ເບຍລາວ ຈຳກັດ');
  const [staffName, setStaffName] = useState<string>('ສົມຊາຍ ແກ້ວມະນີ (ຫົວໜ້າສາງ)');
  const [reason, setReason] = useState<string>(STOCK_IN_REASONS[0]);
  const [customDocNo, setCustomDocNo] = useState<string>('');
  const [referenceDoc, setReferenceDoc] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));

  // Success state for popup
  const [lastCreatedMovement, setLastCreatedMovement] = useState<StockMovement | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // When selected product changes, update defaults
  const activeProduct = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    if (activeProduct) {
      setUnitCost(activeProduct.costPrice);
      if (activeProduct.supplier) {
        setSupplier(activeProduct.supplier);
      }
    }
  }, [selectedProductId]);

  // When initialProductId prop changes from outside
  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    }
  }, [initialProductId]);

  // Filter products in dropdown
  const filteredProductOptions = products.filter(p =>
    !productSearch ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) {
      setNotification({ message: 'ກະລຸນາເລືອກສິນຄ້າທີ່ຕ້ອງການຮັບເຂົ້າ', type: 'error' });
      return;
    }

    if (quantity <= 0) {
      setNotification({ message: 'ຈຳນວນຮັບເຂົ້າຕ້ອງຫຼາຍກວ່າ 0', type: 'error' });
      return;
    }

    const result = recordStockIn({
      productId: activeProduct.id,
      quantity: Number(quantity),
      unitCost: Number(unitCost),
      supplier: supplier.trim() || 'ຜູ້ສະໜອງທົ່ວໄປ',
      staffName: staffName.trim() || 'ເຈົ້າໜ້າທີ່ສາງ',
      reason,
      notes: notes.trim(),
      referenceDoc: referenceDoc.trim(),
      customDocNo: customDocNo.trim() || undefined,
      date: `${date} ${new Date().toLocaleTimeString('en-GB').substring(0, 5)}`,
    });

    if (result.success && result.movement) {
      setLastCreatedMovement(result.movement);
      setNotification({
        message: `ບັນທຶກຮັບສິນຄ້າເຂົ້າສຳເລັດ! ຍອດສະຕັອກໃໝ່: ${result.movement.newStock} ${result.movement.unit}`,
        type: 'success',
      });
      // reset form quantity
      setQuantity(10);
      setReferenceDoc('');
      setNotes('');
      setCustomDocNo('');
    } else {
      setNotification({ message: result.error || 'ເກີດຂໍ້ຜິດພາດ', type: 'error' });
    }
  };

  // Recent Stock-In movements
  const stockInMovements = movements.filter(m => m.type === 'IN').slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ບັນທຶກຮັບສິນຄ້າເຂົ້າສາງ (Stock In)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                ບັນທຶກວັນທີ, ຈຳນວນ, ຜູ້ສົ່ງມອບ, ຜູ້ຮັບ ແລະ ອອກໃບຮັບສິນຄ້າ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between transition ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{notification.message}</span>
          </div>
          {lastCreatedMovement && notification.type === 'success' && (
            <button
              onClick={() => onSelectVoucher(lastCreatedMovement)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              ພິມໃບຮັບສິນຄ້ານີ້
            </button>
          )}
        </div>
      )}

      {/* Form and Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              ຂໍ້ມູນໃບຮັບສິນຄ້າເຂົ້າສາງ
            </h2>

            {/* Doc No & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເລກທີເອກະສານ / ໃບຮັບ (Document No.)
                </label>
                <input
                  type="text"
                  placeholder="ລະບົບສ້າງອັດຕະໂນມັດ (ຫຼື ໃສ່ເອງ)"
                  value={customDocNo}
                  onChange={e => setCustomDocNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ວັນທີຮັບສິນຄ້າ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Product Selector with Search */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                ເລືອກສິນຄ້າທີ່ຮັບເຂົ້າ <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ ຫຼື ລະຫັດ SKU..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs mb-2"
                />
              </div>

              <select
                required
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
              >
                {filteredProductOptions.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} — ຄົງເຫຼືອ: {p.quantity} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity & Unit Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຈຳນວນທີ່ຮັບເຂົ້າ ({activeProduct?.unit || 'ໜ່ວຍ'}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-base font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຕົ້ນທຶນຕໍ່ໜ່ວຍ (ກີບ / Kip)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={unitCost}
                  onChange={e => setUnitCost(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <span className="text-[11px] text-slate-500">ລວມມູນຄ່າ: {formatKip(quantity * unitCost)}</span>
              </div>
            </div>

            {/* Supplier & Staff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຜູ້ສົ່ງມອບ / ຜູ້ສະໜອງ (Supplier) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  placeholder="ເຊັ່ນ: ບໍລິສັດ ເບຍລາວ ຈຳກັດ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຜູ້ຮັບສິນຄ້າເຂົ້າສາງ (Warehouse Staff) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  placeholder="ຊື່ພະນັກງານກວດຮັບ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Reason & Reference PO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເຫດຜົນ / ປະເພດການຮັບເຂົ້າ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                >
                  {STOCK_IN_REASONS.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເລກທີໃບສັ່ງຊື້ / ໃບສົ່ງເຄື່ອງ (PO / Inv Ref)
                </label>
                <input
                  type="text"
                  value={referenceDoc}
                  onChange={e => setReferenceDoc(e.target.value)}
                  placeholder="ເຊັ່ນ: PO-2026-1099, INV-8842"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ໝາຍເຫດເພີ່ມເຕີມ
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ສະພາບສິນຄ້າ, ວັນໝົດອາຍຸ, ເລກລັອດ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2 text-base active:scale-99"
              >
                <ArrowDownLeft className="w-5 h-5" />
                ຢືນຢັນບັນທຶກຮັບສິນຄ້າເຂົ້າສາງ
              </button>
            </div>
          </form>
        </div>

        {/* Live Calculation & Stock Preview Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {activeProduct ? (
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  ຕົວຢ່າງການຄຳນວນສະຕັອກ
                </span>
                <span className="font-mono text-xs text-indigo-400 font-bold">
                  {activeProduct.sku}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-3">
                {activeProduct.imageUrl && (
                  <img
                    src={activeProduct.imageUrl}
                    alt={activeProduct.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-700 bg-slate-800"
                  />
                )}
                <div>
                  <h3 className="font-bold text-white text-base leading-snug">
                    {activeProduct.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    ໝວດໝູ່: {activeProduct.category} | ບ່ອນຈັດເກັບ: {activeProduct.location}
                  </p>
                </div>
              </div>

              <div className="my-5 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>ຍອດຄົງເຫຼືອເດີມ:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {formatNumber(activeProduct.quantity)} {activeProduct.unit}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>+ ຈຳນວນຮັບເຂົ້າໃໝ່:</span>
                  <span className="font-mono font-bold">
                    +{formatNumber(quantity)} {activeProduct.unit}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                  <span className="font-bold text-white">ຍອດຄົງເຫຼືອໃໝ່:</span>
                  <span className="font-mono text-xl font-bold text-emerald-300">
                    {formatNumber(activeProduct.quantity + quantity)} {activeProduct.unit}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>ລາຄາຕົ້ນທຶນຕໍ່ໜ່ວຍ:</span>
                  <span className="font-mono text-slate-200">{formatKip(unitCost)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>ມູນຄ່າຮັບເຂົ້າລວມ:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {formatKip(quantity * unitCost)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400">
              ເລືອກສິນຄ້າເພື່ອເບິ່ງຍອດຄຳນວນ
            </div>
          )}
        </div>
      </div>

      {/* Recent Stock-In Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          ປະຫວັດການຮັບສິນຄ້າເຂົ້າຫຼ້າສຸດ (Stock In History)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">ເລກທີໃບຮັບ / ວັນທີ</th>
                <th className="py-2.5 px-3">ສິນຄ້າ</th>
                <th className="py-2.5 px-3 text-right">ຈຳນວນ</th>
                <th className="py-2.5 px-3 text-right">ມູນຄ່າ</th>
                <th className="py-2.5 px-3">ຜູ້ສົ່ງມອບ (Supplier)</th>
                <th className="py-2.5 px-3">ຜູ້ກວດຮັບ</th>
                <th className="py-2.5 px-3 text-center">ໃບຮັບ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockInMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ຍັງບໍ່ມີປະຫວັດການຮັບເຂົ້າ
                  </td>
                </tr>
              ) : (
                stockInMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {m.documentNo}
                      </div>
                      <div className="text-[11px] text-slate-500">{m.date}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 truncate max-w-[200px]">
                        {m.productName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{m.productSku}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                      +{formatNumber(m.quantity)} {m.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 text-xs">
                      {formatKip(m.totalValue)}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-700 max-w-[140px] truncate">
                      {m.partyName}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 max-w-[120px] truncate">
                      {m.staffName}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onSelectVoucher(m)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        title="ພິມໃບຮັບສິນຄ້າ"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
