import React, { useState } from 'react';
import { Product } from '../types/inventory';
import { formatKip } from '../utils/formatters';
import { Printer, X, Tag, Barcode, CheckSquare, Square } from 'lucide-react';

interface BarcodeLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProduct?: Product;
}

export const BarcodeLabelsModal: React.FC<BarcodeLabelsModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return selectedProduct ? [selectedProduct.id] : products.slice(0, 8).map(p => p.id);
  });
  const [copies, setCopies] = useState<number>(2);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const printProducts = products.filter(p => selectedIds.includes(p.id));

  // Expand array for number of copies
  const printableItems: Product[] = [];
  printProducts.forEach(prod => {
    for (let i = 0; i < copies; i++) {
      printableItems.push(prod);
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200">
        {/* Header (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">ພິມປ້າຍບາໂຄ້ດ & ສະຕິກເກີ້ສິນຄ້າ (Barcode Labels)</h3>
              <p className="text-xs text-slate-400">ເລືອກສິນຄ້າເພື່ອພິມປ້າຍຕິດກ່ອງ ຫຼື ຊັ້ນວາງສາງ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={printableItems.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              ພິມສະຕິກເກີ້ ({printableItems.length} ໃບ)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls Toolbar (Hidden when printing) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              {selectedIds.length === products.length ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>ເລືອກທັງໝົດ ({products.length})</span>
            </button>
            <span className="text-slate-500">
              ເລືອກແລ້ວ: <strong className="text-indigo-700 font-mono">{selectedIds.length}</strong> ລາຍການ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600">ຈຳນວນຊຸດຕໍ່ສິນຄ້າ (Copies):</span>
            <input
              type="number"
              min="1"
              max="20"
              value={copies}
              onChange={e => setCopies(Math.max(1, Number(e.target.value)))}
              className="w-16 px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono font-bold text-center"
            />
          </div>
        </div>

        {/* Printable Labels Canvas Grid */}
        <div className="p-6 max-h-[70vh] overflow-y-auto print:max-h-none print:p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2">
            {printableItems.map((prod, idx) => (
              <div
                key={`${prod.id}-${idx}`}
                className="border-2 border-slate-800 rounded-xl p-3 bg-white text-slate-900 flex flex-col justify-between shadow-xs print:shadow-none print:border print:border-black"
                style={{ pageBreakInside: 'avoid' }}
              >
                <div>
                  <div className="flex justify-between items-start mb-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>ສາງສູນກາງ ວຽງຈັນ</span>
                    <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">{prod.location}</span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                    {prod.name}
                  </h4>
                </div>

                {/* Simulated Visual 1D Barcode Pattern */}
                <div className="my-2.5 py-1 text-center bg-slate-50 rounded border border-slate-200">
                  <div className="h-9 flex items-center justify-center gap-0.5 px-4 overflow-hidden">
                    {/* Visual Barcode Bars */}
                    {Array.from({ length: 42 }).map((_, barIdx) => {
                      const isThick = (barIdx * 7) % 3 === 0;
                      const isThin = (barIdx * 3) % 2 === 0;
                      return (
                        <div
                          key={barIdx}
                          className="bg-black h-full"
                          style={{
                            width: isThick ? '3.5px' : isThin ? '1.5px' : '2px',
                            marginRight: barIdx % 4 === 0 ? '2px' : '1px',
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="font-mono text-[10px] font-bold text-slate-700 tracking-widest mt-0.5">
                    {prod.barcode || prod.sku}
                  </div>
                </div>

                <div className="flex justify-between items-end pt-1 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">SKU: {prod.sku}</span>
                    <span className="text-[10px] text-slate-600">ໜ່ວຍ: {prod.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">ລາຄາຂາຍ:</span>
                    <span className="font-bold font-mono text-xs text-indigo-900">
                      {formatKip(prod.sellingPrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer (Hidden when printing) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
          >
            ປິດໜ້າຕ່າງ
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            ພິມປ້າຍດຽວນີ້
          </button>
        </div>
      </div>
    </div>
  );
};
