import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { StockMovement } from '../types/inventory';
import { formatKip, formatNumber, formatDateTime, exportToCSV } from '../utils/formatters';
import { 
  History, 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  Printer, 
  Calendar,
  X,
  FileText
} from 'lucide-react';

interface MovementsViewProps {
  onSelectVoucher: (movement: StockMovement) => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({ onSelectVoucher }) => {
  const { movements } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUST'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      // Search
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.documentNo.toLowerCase().includes(q) ||
        m.productName.toLowerCase().includes(q) ||
        m.productSku.toLowerCase().includes(q) ||
        m.partyName.toLowerCase().includes(q) ||
        m.staffName.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        (m.referenceDoc && m.referenceDoc.toLowerCase().includes(q));

      // Type
      const matchesType = typeFilter === 'ALL' || m.type === typeFilter;

      // Date range
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && m.date >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && m.date.substring(0, 10) <= endDate;
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [movements, searchTerm, typeFilter, startDate, endDate]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = [
      'ເລກທີເອກະສານ',
      'ປະເພດ (IN/OUT/ADJUST)',
      'ວັນທີ-ເວລາ',
      'ລະຫັດສິນຄ້າ (SKU)',
      'ຊື່ສິນຄ້າ',
      'ຈຳນວນ',
      'ຫົວໜ່ວຍ',
      'ຍອດກ່ອນໜ້າ',
      'ຍອດໃໝ່',
      'ລາຄາຕໍ່ໜ່ວຍ (ກີບ)',
      'ມູນຄ່າລວມ (ກີບ)',
      'ຜູ້ສົ່ງມອບ/ຜູ້ເບີກ',
      'ຜູ້ຮັບ/ຜູ້ຈ່າຍເຄື່ອງ',
      'ເຫດຜົນ',
      'ເອກະສານອ້າງອີງ',
      'ໝາຍເຫດ',
    ];

    const rows = filteredMovements.map(m => [
      m.documentNo,
      m.type === 'IN' ? 'ຮັບເຂົ້າ' : m.type === 'OUT' ? 'ເບີກອອກ' : 'ປັບປຸງຍອດ',
      m.date,
      m.productSku,
      m.productName,
      m.quantity,
      m.unit,
      m.previousStock,
      m.newStock,
      m.unitCost,
      m.totalValue,
      m.partyName,
      m.staffName,
      m.reason,
      m.referenceDoc || '',
      m.notes || '',
    ]);

    const dateStr = new Date().toISOString().substring(0, 10);
    exportToCSV(headers, rows, `ບັນຊີເຄື່ອນໄຫວສາງ_${dateStr}`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ປະຫວັດການເຄື່ອນໄຫວສາງ (Stock Ledger)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ກວດສອບປະຫວັດການຮັບເຂົ້າ, ເບີກອອກ, ປັບປຸງຍອດ, ຜູ້ກ່ຽວຂ້ອງ ແລະ ເລກທີໃບເອກະສານ
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-5">
          {/* Search */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ຄົ້ນຫາ: ເລກທີໃບຮັບ/ເບີກ, ຊື່ສິນຄ້າ, ຜູ້ສົ່ງ, ຜູ້ເບີກ..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="lg:col-span-3">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white cursor-pointer"
            >
              <option value="ALL">ທຸກປະເພດການເຄື່ອນໄຫວ</option>
              <option value="IN">ຮັບເຂົ້າສາງ (Stock In)</option>
              <option value="OUT">ເບີກອອກສາງ (Stock Out)</option>
              <option value="ADJUST">ປັບປຸງຍອດສະຕັອກ (Adjust)</option>
            </select>
          </div>

          {/* Date range */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              placeholder="ແຕ່ວັນທີ"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs bg-white cursor-pointer"
              title="ແຕ່ວັນທີ"
            />
          </div>

          <div className="lg:col-span-2">
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              placeholder="ເຖິງວັນທີ"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs bg-white cursor-pointer"
              title="ເຖິງວັນທີ"
            />
          </div>
        </div>

        {/* Filter Quick Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-4 text-xs">
          <span className="text-slate-500 font-medium">
            ພົບທັງໝົດ: {filteredMovements.length} ລາຍການ
          </span>

          <button
            onClick={() => {
              setTypeFilter('ALL');
              setStartDate('');
              setEndDate('');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
          >
            ລ້າງຕົວກອງ
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ເລກທີ / ວັນທີ</th>
                <th className="py-3 px-3">ປະເພດ</th>
                <th className="py-3 px-3">ສິນຄ້າ & ລະຫັດ</th>
                <th className="py-3 px-3 text-right">ຈຳນວນ</th>
                <th className="py-3 px-3 text-center">ຍອດເດີມ ➔ ໃໝ່</th>
                <th className="py-3 px-3 text-right">ມູນຄ່າລວມ</th>
                <th className="py-3 px-3">ຜູ້ສົ່ງມອບ / ຜູ້ເບີກ</th>
                <th className="py-3 px-3">ຜູ້ຮັບ / ຜູ້ຈ່າຍ</th>
                <th className="py-3 px-3">ເຫດຜົນ</th>
                <th className="py-3 px-4 text-center">ໃບເອກະສານ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">ບໍ່ພົບລາຍການເຄື່ອນໄຫວທີ່ກົງກັບເງື່ອນໄຂ</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => {
                  const isIn = m.type === 'IN';
                  const isOut = m.type === 'OUT';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-900">
                          {m.documentNo}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatDateTime(m.date)}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isIn
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isOut
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isIn ? <ArrowDownLeft className="w-3 h-3" /> : isOut ? <ArrowUpRight className="w-3 h-3" /> : <SlidersHorizontal className="w-3 h-3" />}
                          {isIn ? 'ຮັບເຂົ້າ' : isOut ? 'ເບີກອອກ' : 'ປັບປຸງ'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate max-w-[200px]">
                          {m.productName}
                        </div>
                        <div className="text-xs font-mono text-slate-500">{m.productSku}</div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div
                          className={`font-mono font-bold text-sm ${
                            isIn ? 'text-emerald-600' : isOut ? 'text-blue-600' : 'text-slate-800'
                          }`}
                        >
                          {isIn ? '+' : isOut ? '-' : ''}
                          {formatNumber(m.quantity)} {m.unit}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-xs text-slate-600">
                        {m.previousStock} ➔ <strong className="text-slate-900">{m.newStock}</strong>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-slate-800">
                        {formatKip(m.totalValue)}
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-700 truncate max-w-[140px]">
                        {m.partyName}
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-600 truncate max-w-[130px]">
                        {m.staffName}
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-600 truncate max-w-[150px]">
                        {m.reason}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onSelectVoucher(m)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="ເບິ່ງ ແລະ ພິມໃບເອກະສານ (Voucher)"
                        >
                          <Printer className="w-4 h-4" />
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
  );
};
