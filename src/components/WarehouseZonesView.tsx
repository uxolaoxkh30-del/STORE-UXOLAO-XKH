import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { WAREHOUSE_ZONES, WarehouseZone, Product } from '../types/inventory';
import { formatNumber, formatKip } from '../utils/formatters';
import { 
  Warehouse, 
  MapPin, 
  Boxes, 
  Package, 
  Thermometer, 
  Layers, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface WarehouseZonesViewProps {
  onOpenStockIn: (productId?: string) => void;
  onOpenStockOut: (productId?: string) => void;
  onNavigateProducts: () => void;
}

export const WarehouseZonesView: React.FC<WarehouseZonesViewProps> = ({
  onOpenStockIn,
  onOpenStockOut,
  onNavigateProducts,
}) => {
  const { products } = useInventory();
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>('ໂຊນ A');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Calculate zone stats
  const zoneStats = WAREHOUSE_ZONES.map(zone => {
    // Find all products located in this zone or matching its code
    const zoneProducts = products.filter(p => {
      const loc = p.location.toLowerCase();
      const codeClean = zone.code.toLowerCase().replace('ໂຊນ ', '');
      return loc.includes(zone.code.toLowerCase()) || loc.includes(`zone ${codeClean}`) || loc.includes(`ໂຊນ ${codeClean}`) || (zone.code === 'ໂຊນ F' && loc.includes('ສາງກໍ່ສ້າງ'));
    });

    const totalQty = zoneProducts.reduce((sum, p) => sum + p.quantity, 0);
    const totalCostValue = zoneProducts.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);
    const capacityPercent = Math.min(Math.round((totalQty / zone.capacityLimit) * 100), 100);

    return {
      zone,
      products: zoneProducts,
      productCount: zoneProducts.length,
      totalQty,
      totalCostValue,
      capacityPercent,
    };
  });

  const activeZoneStat = zoneStats.find(z => z.zone.code === selectedZoneCode) || zoneStats[0];

  // Filter products in selected zone
  const filteredZoneProducts = activeZoneStat.products.filter(p =>
    !searchFilter ||
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.location.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ແຜນຜັງ ແລະ ໂຊນຈັດເກັບສາງ (Warehouse Map & Zones)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                ຕິດຕາມສະພາບພື້ນທີ່ສາງ, ຄວາມຈຸຂອງແຕ່ລະໂຊນ (Capacity) ແລະ ຈຸດວາງສິນຄ້າ
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateProducts}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition cursor-pointer self-start md:self-auto"
        >
          <Package className="w-4 h-4" />
          <span>ເບິ່ງສິນຄ້າທັງໝົດ &rarr;</span>
        </button>
      </div>

      {/* Visual Warehouse Grid / Zone Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {zoneStats.map(({ zone, products: zProducts, productCount, totalQty, capacityPercent }) => {
          const isSelected = selectedZoneCode === zone.code;
          const isNearFull = capacityPercent >= 85;

          return (
            <div
              key={zone.code}
              onClick={() => setSelectedZoneCode(zone.code)}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'border-indigo-600 bg-white shadow-lg ring-4 ring-indigo-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Capacity Progress Bar at Top */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isNearFull
                      ? 'bg-rose-500'
                      : capacityPercent > 60
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>

              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${zone.badgeColor}`}>
                    {zone.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    {zone.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold font-mono ${isNearFull ? 'text-rose-600' : 'text-slate-700'}`}>
                    {capacityPercent}%
                  </span>
                  <span className="block text-[10px] text-slate-400">ຄວາມຈຸທີ່ໃຊ້</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-1 mb-4">
                {zone.description}
              </p>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">ຈຳນວນລາຍການ:</span>
                  <span className="font-bold text-slate-800 font-mono">{productCount} ສິນຄ້າ</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">ຍອດຄົງເຫຼືອ:</span>
                  <span className="font-bold text-indigo-700 font-mono">
                    {formatNumber(totalQty)} / {formatNumber(zone.capacityLimit)}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 py-1 bg-indigo-50 text-indigo-700 text-xs text-center font-bold rounded-lg flex items-center justify-center gap-1">
                  <span>ກຳລັງເລືອກໂຊນນີ້</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Zone Detail Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${activeZoneStat.zone.badgeColor}`}>
                {activeZoneStat.zone.code}
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                ລາຍການສິນຄ້າໃນ {activeZoneStat.zone.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeZoneStat.zone.description} | ມູນຄ່າສິນຄ້າໃນໂຊນນີ້:{' '}
              <strong className="text-indigo-700 font-mono">{formatKip(activeZoneStat.totalCostValue)}</strong>
            </p>
          </div>

          {/* Search inside zone */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາສິນຄ້າໃນໂຊນນີ້..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Table of Products in Selected Zone */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">ສິນຄ້າ & ລະຫັດ</th>
                <th className="py-2.5 px-3">ຕຳແໜ່ງລະອຽດ (Shelf/Rack)</th>
                <th className="py-2.5 px-3 text-right">ລາຄາຕົ້ນທຶນ</th>
                <th className="py-2.5 px-3 text-center">ຍອດຄົງເຫຼືອ</th>
                <th className="py-2.5 px-3 text-right">ມູນຄ່າລວມ</th>
                <th className="py-2.5 px-3 text-center">ດຳເນີນການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredZoneProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ບໍ່ມີສິນຄ້າທີ່ກົງກັບເງື່ອນໄຂໃນໂຊນນີ້
                  </td>
                </tr>
              ) : (
                filteredZoneProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="font-mono text-[11px] text-slate-500">
                            SKU: {p.sku} | ໝວດໝູ່: {p.category}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{p.location}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatKip(p.costPrice)}
                    </td>

                    <td className="py-3 px-3 text-center font-bold font-mono">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs ${
                          p.quantity === 0
                            ? 'bg-rose-100 text-rose-800'
                            : p.quantity <= p.minStockAlert
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {formatNumber(p.quantity)} {p.unit}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatKip(p.quantity * p.costPrice)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenStockIn(p.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                        >
                          + ຮັບເຂົ້າ
                        </button>
                        <button
                          onClick={() => onOpenStockOut(p.id)}
                          disabled={p.quantity === 0}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            p.quantity === 0
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                          }`}
                        >
                          - ເບີກອອກ
                        </button>
                      </div>
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
