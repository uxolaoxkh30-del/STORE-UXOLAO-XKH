import React from 'react';
import { StockMovement, Product } from '../types/inventory';
import { formatKip, formatNumber, formatDateTime } from '../utils/formatters';
import { Printer, X, CheckCircle2, ArrowDownLeft, ArrowUpRight, FileSpreadsheet } from 'lucide-react';

interface VoucherModalProps {
  movement: StockMovement | null;
  product?: Product;
  onClose: () => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({ movement, product, onClose }) => {
  if (!movement) return null;

  const isStockIn = movement.type === 'IN';
  const isStockOut = movement.type === 'OUT';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                isStockIn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isStockOut
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isStockIn ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              {isStockIn ? 'ໃບຮັບສິນຄ້າເຂົ້າສາງ (Stock In Receipt)' : isStockOut ? 'ໃບເບີກສິນຄ້າອອກສາງ (Stock Out Dispatch)' : 'ໃບປັບປຸງຍອດສະຕັອກ'}
            </span>
            <span className="text-slate-400 text-sm font-mono">{movement.documentNo}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              ພິມເອກະສານ / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-8 bg-white text-slate-900 print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-5 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  ສາງສິນຄ້າສູນກາງ ວຽງຈັນ
                </h1>
                <p className="text-xs text-slate-500">VIENTIANE CENTRAL WAREHOUSE MANAGEMENT SYSTEM</p>
                <p className="text-xs text-slate-600 mt-1">
                  ຖະໜົນ ໄກສອນ ພົມວິຫານ, ເມືອງ ໄຊເສດຖາ, ນະຄອນຫຼວງວຽງຈັນ
                </p>
                <p className="text-xs text-slate-600">ໂທ: +856 21 450000 | ອີເມລ: warehouse@lao-wms.la</p>
              </div>
              <div className="text-right">
                <div
                  className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider ${
                    isStockIn ? 'bg-emerald-100 text-emerald-800' : isStockOut ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isStockIn ? 'ໃບຮັບສິນຄ້າເຂົ້າ' : isStockOut ? 'ໃບເບີກສິນຄ້າອອກ' : 'ໃບປັບປຸງສະຕັອກ'}
                </div>
                <div className="mt-2 text-sm font-mono font-semibold text-slate-800">
                  ເລກທີ: {movement.documentNo}
                </div>
                <div className="text-xs text-slate-500">
                  ວັນທີ: {formatDateTime(movement.date)}
                </div>
              </div>
            </div>
          </div>

          {/* Meta Information Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl mb-6 border border-slate-200 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase">
                {isStockIn ? 'ຜູ້ສົ່ງມອບ / ຜູ້ສະໜອງ (Supplier):' : 'ຜູ້ເບີກ / ພະແນກ (Requester):'}
              </span>
              <span className="font-semibold text-slate-800">{movement.partyName}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase">
                {isStockIn ? 'ຜູ້ຮັບເຄື່ອງ (Received By):' : 'ຜູ້ອະນຸມັດ/ຜູ້ຈ່າຍ (Approved By):'}
              </span>
              <span className="font-semibold text-slate-800">{movement.staffName}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase">ເຫດຜົນ / ປະເພດ:</span>
              <span className="text-slate-700">{movement.reason}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase">ເອກະສານອ້າງອີງ:</span>
              <span className="font-mono text-slate-700">{movement.referenceDoc || '-'}</span>
            </div>
          </div>

          {/* Item Details Table */}
          <table className="w-full text-left text-sm border border-slate-200 rounded-lg overflow-hidden mb-6">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">ລ/ດ</th>
                <th className="py-2.5 px-3">ລະຫັດ & ຊື່ສິນຄ້າ</th>
                <th className="py-2.5 px-3 text-center">ຫົວໜ່ວຍ</th>
                <th className="py-2.5 px-3 text-right">ຈຳນວນ</th>
                <th className="py-2.5 px-3 text-right">ລາຄາຕໍ່ໜ່ວຍ</th>
                <th className="py-2.5 px-3 text-right">ມູນຄ່າລວມ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-3 text-center text-slate-500">1</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    {product?.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={movement.productName}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-slate-800">{movement.productName}</div>
                      <div className="text-xs font-mono text-slate-500">
                        SKU: {movement.productSku} {product?.location ? `| ໂຊນ: ${product.location}` : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center font-medium text-slate-700">{movement.unit}</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900 text-base">
                  {formatNumber(movement.quantity)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">
                  {formatKip(movement.unitCost)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  {formatKip(movement.totalValue)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold">
              <tr>
                <td colSpan={3} className="py-3 px-3 text-right text-slate-600">
                  ຍອດລວມທັງໝົດ (Total):
                </td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">
                  {formatNumber(movement.quantity)} {movement.unit}
                </td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3 text-right font-bold text-indigo-700 text-base font-mono">
                  {formatKip(movement.totalValue)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Stock Balance Context */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 mb-6 flex justify-between items-center">
            <span>
              <strong>ສະຖານະສະຕັອກ:</strong> ຍອດກ່ອນໜ້າ: {movement.previousStock} {movement.unit} ➔ ຍອດໃໝ່ຫຼັງດຳເນີນການ:{' '}
              <span className="font-bold underline">{movement.newStock} {movement.unit}</span>
            </span>
            {movement.notes && (
              <span className="italic text-slate-600">
                ໝາຍເຫດ: {movement.notes}
              </span>
            )}
          </div>

          {/* Signatures Area */}
          <div className="grid grid-cols-3 gap-6 pt-10 text-center text-sm border-t border-dashed border-slate-300">
            <div>
              <div className="h-16 flex items-end justify-center">
                <span className="text-slate-400 font-serif italic text-xs">.........................................</span>
              </div>
              <p className="font-semibold text-slate-800 mt-2">
                {isStockIn ? 'ຜູ້ສົ່ງມອບສິນຄ້າ' : 'ຜູ້ເບີກສິນຄ້າ'}
              </p>
              <p className="text-xs text-slate-500">({movement.partyName})</p>
            </div>

            <div>
              <div className="h-16 flex items-end justify-center">
                <span className="text-slate-400 font-serif italic text-xs">.........................................</span>
              </div>
              <p className="font-semibold text-slate-800 mt-2">
                {isStockIn ? 'ຜູ້ກວດຮັບສິນຄ້າ' : 'ຜູ້ຈ່າຍສິນຄ້າ'}
              </p>
              <p className="text-xs text-slate-500">({movement.staffName})</p>
            </div>

            <div>
              <div className="h-16 flex items-end justify-center">
                <span className="text-slate-400 font-serif italic text-xs">.........................................</span>
              </div>
              <p className="font-semibold text-slate-800 mt-2">ຫົວໜ້າຄຸ້ມຄອງສາງ</p>
              <p className="text-xs text-slate-500">(ລາຍເຊັນ ແລະ ປະທັບກາ)</p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-medium transition cursor-pointer"
          >
            ປິດໜ້າຕ່າງ
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            ພິມໃບເອກະສານນີ້
          </button>
        </div>
      </div>
    </div>
  );
};
