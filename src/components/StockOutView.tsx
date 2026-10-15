import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { StockMovement, STOCK_OUT_REASONS } from '../types/inventory';
import { formatKip, formatNumber } from '../utils/formatters';
import { 
  ArrowUpRight, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Printer, 
  FileText, 
  Search, 
  Clock, 
  Building2, 
  AlertCircle 
} from 'lucide-react';

interface StockOutViewProps {
  initialProductId?: string;
  onSelectVoucher: (movement: StockMovement) => void;
}

export const StockOutView: React.FC<StockOutViewProps> = ({
  initialProductId,
  onSelectVoucher,
}) => {
  const { products, movements, recordStockOut } = useInventory();

  // Find initial product or fallback to first product that has quantity > 0
  const availableProducts = products.filter(p => p.quantity > 0);
  const defaultProduct = initialProductId
    ? products.find(p => p.id === initialProductId) || products[0]
    : availableProducts[0] || products[0];

  const [selectedProductId, setSelectedProductId] = useState<string>(defaultProduct?.id || '');
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [requester, setRequester] = useState<string>('ພະແນກຂາຍ & ການຕະຫຼາດ');
  const [staffName, setStaffName] = useState<string>('ທ້າວ ບຸນມີ ວົງສາ (ພະນັກງານຈ່າຍເຄື່ອງ)');
  const [reason, setReason] = useState<string>(STOCK_OUT_REASONS[0]);
  const [customDocNo, setCustomDocNo] = useState<string>('');
  const [referenceDoc, setReferenceDoc] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));

  // Success state for popup
  const [lastCreatedMovement, setLastCreatedMovement] = useState<StockMovement | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const activeProduct = products.find(p => p.id === selectedProductId);

  // When initialProductId changes from props
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

  // Validation checks
  const isOutOfStock = !activeProduct || activeProduct.quantity === 0;
  const isExceeding = activeProduct && quantity > activeProduct.quantity;
  const willBeLowStock =
    activeProduct &&
    activeProduct.quantity - quantity > 0 &&
    activeProduct.quantity - quantity <= activeProduct.minStockAlert;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) {
      setNotification({ message: 'ກະລຸນາເລືອກສິນຄ້າທີ່ຕ້ອງການເບີກອອກ', type: 'error' });
      return;
    }

    if (quantity <= 0) {
      setNotification({ message: 'ຈຳນວນເບີກອອກຕ້ອງຫຼາຍກວ່າ 0', type: 'error' });
      return;
    }

    if (quantity > activeProduct.quantity) {
      setNotification({
        message: `ຍອດສິນຄ້າບໍ່ພໍເບີກ! ມີພຽງ ${activeProduct.quantity} ${activeProduct.unit}`,
        type: 'error',
      });
      return;
    }

    const result = recordStockOut({
      productId: activeProduct.id,
      quantity: Number(quantity),
      requester: requester.trim() || 'ພະແນກພາຍໃນ',
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
        message: `ບັນທຶກເບີກສິນຄ້າສຳເລັດ! ຍອດຄົງເຫຼືອໃໝ່: ${result.movement.newStock} ${result.movement.unit}`,
        type: 'success',
      });
      // reset form
      setQuantity(1);
      setReferenceDoc('');
      setNotes('');
      setCustomDocNo('');
    } else {
      setNotification({ message: result.error || 'ເກີດຂໍ້ຜິດພາດ', type: 'error' });
    }
  };

  // Recent Stock-Out movements
  const stockOutMovements = movements.filter(m => m.type === 'OUT').slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ບັນທຶກເບີກສິນຄ້າອອກສາງ (Stock Out)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                ບັນທຶກວັນທີ, ຈຳນວນ, ຜູ້ເບີກ/ພະແນກ, ຜູ້ຈ່າຍເຄື່ອງ ແລະ ອອກໃບເບີກສິນຄ້າ
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
              ? 'bg-blue-50 border border-blue-300 text-blue-900'
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              ພິມໃບເບີກສິນຄ້ານີ້
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
              <FileText className="w-4 h-4 text-blue-600" />
              ຂໍ້ມູນໃບເບີກສິນຄ້າອອກສາງ
            </h2>

            {/* Doc No & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເລກທີໃບເບີກ (Document No.)
                </label>
                <input
                  type="text"
                  placeholder="ລະບົບສ້າງອັດຕະໂນມັດ (ຫຼື ໃສ່ເອງ)"
                  value={customDocNo}
                  onChange={e => setCustomDocNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ວັນທີເບີກສິນຄ້າ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Product Selector with Search */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                ເລືອກສິນຄ້າທີ່ຕ້ອງການເບີກ <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາສິນຄ້າ..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs mb-2"
                />
              </div>

              <select
                required
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
              >
                {filteredProductOptions.map(p => {
                  const out = p.quantity === 0;
                  return (
                    <option key={p.id} value={p.id} disabled={out}>
                      [{p.sku}] {p.name} — ຄົງເຫຼືອ: {p.quantity} {p.unit} {out ? '(ໝົດ)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ຈຳນວນທີ່ເບີກອອກ ({activeProduct?.unit || 'ໜ່ວຍ'}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={activeProduct ? activeProduct.quantity : 99999}
                required
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className={`w-full px-3 py-2.5 rounded-xl border font-mono text-base font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                  isExceeding ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-300'
                }`}
              />

              {/* Safety validations */}
              {isExceeding && (
                <div className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>ຈຳນວນທີ່ເບີກ ({quantity}) ເກີນກວ່າຍອດຄົງເຫຼືອໃນສາງ ({activeProduct?.quantity})!</span>
                </div>
              )}

              {willBeLowStock && !isExceeding && (
                <div className="mt-1.5 text-xs text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    ແຈ້ງເຕືອນ: ຫຼັງເບີກແລ້ວ ສິນຄ້ານີ້ຈະເຫຼືອພຽງ {activeProduct!.quantity - quantity} {activeProduct!.unit} (ຕໍ່າກວ່າຈຸດເຕືອນ {activeProduct!.minStockAlert})
                  </span>
                </div>
              )}
            </div>

            {/* Requester & Staff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຜູ້ເບີກ / ພະແນກ / ລູກຄ້າ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={requester}
                  onChange={e => setRequester(e.target.value)}
                  placeholder="ເຊັ່ນ: ພະແນກຂາຍ, ຮ້ານສາຂາ 1, ລູກຄ້າ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຜູ້ອະນຸມັດ / ຜູ້ຈ່າຍສິນຄ້າ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  placeholder="ຊື່ພະນັກງານຈ່າຍເຄື່ອງ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Reason & Ref Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເຫດຜົນການເບີກ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                >
                  {STOCK_OUT_REASONS.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເລກທີໃບສັ່ງຊື້ / ໃບສັ່ງຂາຍ (SO / Ref No.)
                </label>
                <input
                  type="text"
                  value={referenceDoc}
                  onChange={e => setReferenceDoc(e.target.value)}
                  placeholder="ເຊັ່ນ: SO-9942, REQ-012"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                placeholder="ລາຍລະອຽດການຂົນສົ່ງ, ປາຍທາງ, ທະບຽນລົດ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isOutOfStock || isExceeding}
                className={`w-full py-3 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 text-base active:scale-99 ${
                  isOutOfStock || isExceeding
                    ? 'bg-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
                }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                {isOutOfStock
                  ? 'ສິນຄ້າໝົດສະຕັອກ ບໍ່ສາມາດເບີກໄດ້'
                  : isExceeding
                  ? 'ຍອດບໍ່ພໍເບີກ'
                  : 'ຢືນຢັນບັນທຶກເບີກສິນຄ້າອອກ'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Stock Calculation Preview Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {activeProduct ? (
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  ກວດສອບສະຕັອກກ່ອນເບີກ
                </span>
                <span className="font-mono text-xs text-blue-400 font-bold">
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
                  <span>ຍອດຄົງເຫຼືອປັດຈຸບັນ:</span>
                  <span className="font-mono font-bold text-slate-100">
                    {formatNumber(activeProduct.quantity)} {activeProduct.unit}
                  </span>
                </div>
                <div className="flex justify-between text-rose-400 font-medium">
                  <span>- ຈຳນວນທີ່ເບີກ:</span>
                  <span className="font-mono font-bold">
                    -{formatNumber(quantity)} {activeProduct.unit}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                  <span className="font-bold text-white">ຍອດຄົງເຫຼືອຫຼັງເບີກ:</span>
                  <span
                    className={`font-mono text-xl font-bold ${
                      activeProduct.quantity - quantity < 0
                        ? 'text-rose-400'
                        : activeProduct.quantity - quantity <= activeProduct.minStockAlert
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {formatNumber(activeProduct.quantity - quantity)} {activeProduct.unit}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>ຕົ້ນທຶນສິນຄ້າ:</span>
                  <span className="font-mono text-slate-200">{formatKip(activeProduct.costPrice)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>ມູນຄ່າເບີກອອກລວມ:</span>
                  <span className="font-mono text-blue-400 font-bold text-sm">
                    {formatKip(quantity * activeProduct.costPrice)}
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

      {/* Recent Stock-Out Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-blue-600" />
          ປະຫວັດການເບີກສິນຄ້າອອກຫຼ້າສຸດ (Stock Out History)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">ເລກທີໃບເບີກ / ວັນທີ</th>
                <th className="py-2.5 px-3">ສິນຄ້າ</th>
                <th className="py-2.5 px-3 text-right">ຈຳນວນ</th>
                <th className="py-2.5 px-3 text-right">ມູນຄ່າ</th>
                <th className="py-2.5 px-3">ຜູ້ເບີກ / ພະແນກ</th>
                <th className="py-2.5 px-3">ຜູ້ຈ່າຍເຄື່ອງ</th>
                <th className="py-2.5 px-3 text-center">ໃບເບີກ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockOutMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ຍັງບໍ່ມີປະຫວັດການເບີກອອກ
                  </td>
                </tr>
              ) : (
                stockOutMovements.map(m => (
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
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-600">
                      -{formatNumber(m.quantity)} {m.unit}
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
                        title="ພິມໃບເບີກສິນຄ້າ"
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
