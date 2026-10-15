import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Supplier, Product, StockMovement, PRODUCT_CATEGORIES, SUPPLIER_PAYMENT_TERMS } from '../types/inventory';
import { formatKip, formatNumber, formatDateTime, exportToCSV } from '../utils/formatters';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  ArrowDownLeft, 
  History, 
  FileSpreadsheet, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  User, 
  CreditCard, 
  FileText,
  Clock,
  Printer,
  ChevronRight,
  Boxes,
  Truck
} from 'lucide-react';

interface SuppliersViewProps {
  onOpenStockIn: (productId?: string, supplierName?: string) => void;
  onOpenAddProductForSupplier: (supplierName: string) => void;
  onSelectVoucher: (movement: StockMovement) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  onOpenStockIn,
  onOpenAddProductForSupplier,
  onSelectVoucher,
}) => {
  const { suppliers, products, movements, addSupplier, updateSupplier, deleteSupplier } = useInventory();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [detailTab, setDetailTab] = useState<'products' | 'movements'>('products');
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: PRODUCT_CATEGORIES[0] as string,
    taxId: '',
    paymentTerms: SUPPLIER_PAYMENT_TERMS[0] as string,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    notes: '',
  });

  // Calculate statistics per supplier
  const supplierStatsMap = useMemo(() => {
    const stats: Record<string, {
      suppliedProducts: Product[];
      stockInMovements: StockMovement[];
      totalQuantityInWarehouse: number;
      totalPurchasedValue: number;
      lastDeliveryDate?: string;
    }> = {};

    suppliers.forEach(sup => {
      // Find all products associated with this supplier
      const supProducts = products.filter(
        p => p.supplier && (p.supplier.toLowerCase().trim() === sup.name.toLowerCase().trim() || p.supplier.toLowerCase().includes(sup.name.toLowerCase()))
      );

      // Find all Stock In movements for this supplier
      const inMoves = movements.filter(
        m => m.type === 'IN' && (
          m.partyName.toLowerCase().trim() === sup.name.toLowerCase().trim() ||
          m.partyName.toLowerCase().includes(sup.name.toLowerCase()) ||
          supProducts.some(p => p.id === m.productId)
        )
      );

      const totalQtyInWarehouse = supProducts.reduce((sum, p) => sum + p.quantity, 0);
      const totalPurchasedValue = inMoves.reduce((sum, m) => sum + m.totalValue, 0);

      const sortedDates = inMoves
        .map(m => m.date)
        .sort((a, b) => b.localeCompare(a));

      stats[sup.id] = {
        suppliedProducts: supProducts,
        stockInMovements: inMoves,
        totalQuantityInWarehouse: totalQtyInWarehouse,
        totalPurchasedValue,
        lastDeliveryDate: sortedDates[0],
      };
    });

    return stats;
  }, [suppliers, products, movements]);

  // Overall KPI stats
  const overallStats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE').length;
    
    // Total products that have a mapped supplier
    const productsWithSupplier = products.filter(p => p.supplier && p.supplier.trim().length > 0).length;
    
    // Total Stock In Value
    const totalSupplyValue = movements
      .filter(m => m.type === 'IN')
      .reduce((sum, m) => sum + m.totalValue, 0);

    return {
      totalSuppliers,
      activeSuppliers,
      productsWithSupplier,
      totalSupplyValue,
    };
  }, [suppliers, products, movements]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        s.address.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [suppliers, searchTerm, selectedCategory, selectedStatus]);

  // Handlers for Add/Edit
  const handleOpenAdd = () => {
    const nextNum = suppliers.length + 1;
    const autoCode = `SUP-${String(nextNum).padStart(3, '0')}`;
    setFormData({
      code: autoCode,
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      category: PRODUCT_CATEGORIES[0],
      taxId: '',
      paymentTerms: SUPPLIER_PAYMENT_TERMS[0],
      status: 'ACTIVE',
      notes: '',
    });
    setEditingSupplier(null);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      code: sup.code,
      name: sup.name,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email || '',
      address: sup.address,
      category: sup.category || PRODUCT_CATEGORIES[0],
      taxId: sup.taxId || '',
      paymentTerms: sup.paymentTerms || SUPPLIER_PAYMENT_TERMS[0],
      status: sup.status,
      notes: sup.notes || '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError('ກະລຸນາປ້ອນຊື່ບໍລິສັດ/ຜູ້ສະໜອງ ແລະ ເບີໂທລະສັບຕິດຕໍ່ໃຫ້ຄົບຖ້ວນ');
      return;
    }
    setFormError(null);

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        code: formData.code.trim(),
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || 'ບໍ່ໄດ້ລະບຸ',
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || 'ນະຄອນຫຼວງວຽງຈັນ',
        category: formData.category,
        taxId: formData.taxId.trim() || undefined,
        paymentTerms: formData.paymentTerms,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      });

      // Update viewingSupplier if open
      if (viewingSupplier && viewingSupplier.id === editingSupplier.id) {
        setViewingSupplier({
          ...viewingSupplier,
          ...formData,
        });
      }
    } else {
      addSupplier({
        code: formData.code.trim(),
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || 'ບໍ່ໄດ້ລະບຸ',
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || 'ນະຄອນຫຼວງວຽງຈັນ',
        category: formData.category,
        taxId: formData.taxId.trim() || undefined,
        paymentTerms: formData.paymentTerms,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      });
    }

    setIsFormModalOpen(false);
  };

  // Export Suppliers to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'ລະຫັດຜູ້ສະໜອງ (Code)',
      'ຊື່ບໍລິສັດ / ຜູ້ສະໜອງ',
      'ຜູ້ຕິດຕໍ່ປະສານງານ',
      'ເບີໂທລະສັບ',
      'ອີເມລ',
      'ທີ່ຢູ່',
      'ໝວດໝູ່ຫຼັກ',
      'ເງື່ອນໄຂການຊຳລະ',
      'ເລກປະຈຳຕົວຜູ້ເສຍພາສີ',
      'ສະຖານະ',
      'ຈຳນວນ SKU ທີ່ສະໜອງ',
      'ຍອດຄົງເຫຼືອໃນສາງ (ໜ່ວຍ)',
      'ມູນຄ່າຮັບເຂົ້າສະສົມ (ກີບ)',
      'ວັນທີຈັດສົ່ງຫຼ້າສຸດ',
      'ໝາຍເຫດ',
    ];

    const rows = filteredSuppliers.map(s => {
      const stats = supplierStatsMap[s.id] || {
        suppliedProducts: [],
        stockInMovements: [],
        totalQuantityInWarehouse: 0,
        totalPurchasedValue: 0,
      };

      return [
        s.code,
        s.name,
        s.contactPerson,
        s.phone,
        s.email || '',
        s.address,
        s.category || '',
        s.paymentTerms || '',
        s.taxId || '',
        s.status === 'ACTIVE' ? 'ເຄື່ອນໄຫວປົກກະຕິ' : 'ໂຈະການຕິດຕໍ່',
        stats.suppliedProducts.length,
        stats.totalQuantityInWarehouse,
        stats.totalPurchasedValue,
        stats.lastDeliveryDate ? formatDateTime(stats.lastDeliveryDate) : '-',
        s.notes || '',
      ];
    });

    const dateStr = new Date().toISOString().substring(0, 10);
    exportToCSV(headers, rows, `ລາຍຊື່ຜູ້ສະໜອງສິນຄ້າ_${dateStr}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ຄຸ້ມຄອງຂໍ້ມູນຜູ້ສະໜອງສິນຄ້າ (Supplier Management)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ຈັດການລາຍຊື່ຄູ່ຄ້າ, ຂໍ້ມູນຕິດຕໍ່, ຕິດຕາມປະຫວັດສິນຄ້າທີ່ສະໜອງ ແລະ ປະຫວັດການຮັບສິນຄ້າເຂົ້າສາງ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition cursor-pointer"
              title="ສົ່ງອອກລາຍຊື່ຜູ້ສະໜອງເປັນ Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ ເພີ່ມຜູ້ສະໜອງໃໝ່</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">ຜູ້ສະໜອງທັງໝົດ</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {overallStats.totalSuppliers} <span className="text-xs font-normal text-slate-500">ແຫ່ງ</span>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
            <span className="text-xs text-emerald-700 font-medium">ຄູ່ຄ້າທີ່ກຳລັງດຳເນີນງານ</span>
            <div className="text-2xl font-bold text-emerald-800 font-mono mt-1">
              {overallStats.activeSuppliers} <span className="text-xs font-normal text-emerald-600">ແຫ່ງ</span>
            </div>
          </div>

          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200">
            <span className="text-xs text-indigo-700 font-medium">ສິນຄ້າທີ່ຜູກກັບຜູ້ສະໜອງ</span>
            <div className="text-2xl font-bold text-indigo-800 font-mono mt-1">
              {overallStats.productsWithSupplier} <span className="text-xs font-normal text-indigo-600">SKUs</span>
            </div>
          </div>

          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
            <span className="text-xs text-blue-700 font-medium">ມູນຄ່າຮັບເຂົ້າສະສົມ</span>
            <div className="text-lg sm:text-xl font-bold text-blue-900 font-mono mt-1 truncate">
              {formatKip(overallStats.totalSupplyValue)}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ຜູ້ສະໜອງ, ລະຫັດ SUP, ຜູ້ຕິດຕໍ່, ເບີໂທ, ອີເມລ, ທີ່ຢູ່..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="ALL">ໝວດໝູ່ທັງໝົດ</option>
            {PRODUCT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="ALL">ສະຖານະທັງໝົດ</option>
            <option value="ACTIVE">ເຄື່ອນໄຫວປົກກະຕິ (Active)</option>
            <option value="INACTIVE">ໂຈະການຕິດຕໍ່ (Inactive)</option>
          </select>

          {/* Layout Toggle */}
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-100 p-0.5">
            <button
              onClick={() => setViewLayout('cards')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                viewLayout === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ກ່ອງ Card
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                viewLayout === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ຕາຕະລາງ
            </button>
          </div>
        </div>
      </div>

      {/* Supplier Cards Grid */}
      {viewLayout === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSuppliers.map(sup => {
            const stats = supplierStatsMap[sup.id] || {
              suppliedProducts: [],
              stockInMovements: [],
              totalQuantityInWarehouse: 0,
              totalPurchasedValue: 0,
            };

            return (
              <div
                key={sup.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition flex flex-col overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 pb-4 border-b border-slate-100 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {sup.code}
                      </span>
                      {sup.category && (
                        <span className="ml-2 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {sup.category}
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        sup.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sup.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {sup.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base line-clamp-1 mt-1">
                    {sup.name}
                  </h3>

                  {/* Contact info list */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{sup.contactPerson}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <a
                        href={`tel:${sup.phone}`}
                        className="font-mono text-indigo-600 hover:underline truncate"
                      >
                        {sup.phone}
                      </a>
                    </div>

                    {sup.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`mailto:${sup.email}`}
                          className="text-slate-500 hover:text-indigo-600 hover:underline truncate"
                        >
                          {sup.email}
                        </a>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1 text-slate-500">{sup.address}</span>
                    </div>
                  </div>

                  {/* Supplied Products Preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        ສິນຄ້າທີ່ສະໜອງ:
                      </span>
                      <span className="font-mono font-bold text-indigo-600">
                        {stats.suppliedProducts.length} ລາຍການ ({formatNumber(stats.totalQuantityInWarehouse)} ໜ່ວຍ)
                      </span>
                    </div>

                    {stats.suppliedProducts.length > 0 ? (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {stats.suppliedProducts.slice(0, 3).map(p => (
                          <div
                            key={p.id}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 truncate max-w-[150px]"
                            title={p.name}
                          >
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-3.5 h-3.5 rounded object-cover shrink-0" />
                            ) : (
                              <Package className="w-3 h-3 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{p.name}</span>
                          </div>
                        ))}
                        {stats.suppliedProducts.length > 3 && (
                          <span className="text-[10px] text-slate-400 px-1 font-mono">
                            +{stats.suppliedProducts.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">ຍັງບໍ່ມີສິນຄ້າຜູກກັບຜູ້ສະໜອງນີ້</span>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(sup)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                      title="ແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງ"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingSupplier(sup)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                      title="ລຶບຜູ້ສະໜອງ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenStockIn(undefined, sup.name)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-medium transition cursor-pointer"
                      title="ບັນທຶກຮັບສິນຄ້າເຂົ້າຈາກຜູ້ສະໜອງນີ້"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>ຮັບເຂົ້າ</span>
                    </button>

                    <button
                      onClick={() => {
                        setViewingSupplier(sup);
                        setDetailTab('products');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition cursor-pointer shadow-xs"
                    >
                      <span>ເບິ່ງປະຫວັດ</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <tr>
                  <th className="py-3 px-4">ລະຫັດ & ຊື່ຜູ້ສະໜອງ</th>
                  <th className="py-3 px-3">ຜູ້ຕິດຕໍ່ & ເບີໂທ</th>
                  <th className="py-3 px-3">ທີ່ຢູ່</th>
                  <th className="py-3 px-3">ໝວດໝູ່ & ເງື່ອນໄຂ</th>
                  <th className="py-3 px-3 text-center">SKU ທີ່ສະໜອງ</th>
                  <th className="py-3 px-3 text-right">ມູນຄ່າຮັບເຂົ້າ</th>
                  <th className="py-3 px-3 text-center">ສະຖານະ</th>
                  <th className="py-3 px-4 text-center">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map(sup => {
                  const stats = supplierStatsMap[sup.id] || {
                    suppliedProducts: [],
                    stockInMovements: [],
                    totalQuantityInWarehouse: 0,
                    totalPurchasedValue: 0,
                  };

                  return (
                    <tr key={sup.id} className="hover:bg-slate-50/70 transition group">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                          {sup.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {sup.code}
                          </span>
                          {sup.taxId && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              Tax: {sup.taxId}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-slate-800 font-medium">{sup.contactPerson}</div>
                        <div className="font-mono text-xs text-indigo-600 mt-0.5">
                          <a href={`tel:${sup.phone}`} className="hover:underline">
                            {sup.phone}
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-xs text-slate-500 max-w-xs truncate">
                        {sup.address}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                          {sup.category || 'ທົ່ວໄປ'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {sup.paymentTerms}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => {
                            setViewingSupplier(sup);
                            setDetailTab('products');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{stats.suppliedProducts.length} ລາຍການ</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-800 text-xs">
                        {formatKip(stats.totalPurchasedValue)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sup.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sup.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setViewingSupplier(sup);
                              setDetailTab('products');
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="ເບິ່ງປະຫວັດການສະໜອງ"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenStockIn(undefined, sup.name)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="ຮັບສິນຄ້າເຂົ້າຈາກຜູ້ສະໜອງນີ້"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(sup)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="ແກ້ໄຂ"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingSupplier(sup)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="ລຶບ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredSuppliers.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">ບໍ່ພົບຂໍ້ມູນຜູ້ສະໜອງທີ່ກົງກັບເງື່ອນໄຂ</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            ລອງປັບປ່ຽນຄຳຄົ້ນຫາ, ເລືອກໝວດໝູ່ໃໝ່ ຫຼື ກົດປຸ່ມເພີ່ມຜູ້ສະໜອງໃໝ່
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            + ເພີ່ມຜູ້ສະໜອງໃໝ່
          </button>
        </div>
      )}

      {/* ===================== MODAL: View Supplier Detail & Supply History ===================== */}
      {viewingSupplier && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold font-mono">
                  {viewingSupplier.code}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white leading-tight">
                    {viewingSupplier.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>{viewingSupplier.contactPerson}</span>
                    <span>•</span>
                    <span className="font-mono text-indigo-300">{viewingSupplier.phone}</span>
                    <span>•</span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                      {viewingSupplier.paymentTerms}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(viewingSupplier);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  ແກ້ໄຂຂໍ້ມູນ
                </button>
                <button
                  onClick={() => setViewingSupplier(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Contact & Summary Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">ທີ່ຢູ່ / ໂຮງງານ:</span>
                <span className="font-semibold text-slate-800 line-clamp-1">{viewingSupplier.address}</span>
              </div>
              <div>
                <span className="text-slate-500 block">ໝວດໝູ່ສິນຄ້າ:</span>
                <span className="font-semibold text-slate-800">{viewingSupplier.category || 'ທົ່ວໄປ'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">ເລກຜູ້ເສຍພາສີ (Tax ID):</span>
                <span className="font-mono font-semibold text-slate-800">{viewingSupplier.taxId || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">ຍອດຮັບເຂົ້າສະສົມ:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatKip(supplierStatsMap[viewingSupplier.id]?.totalPurchasedValue || 0)}
                </span>
              </div>
            </div>

            {/* Sub-Tabs: Supplied Products vs Stock In Movements */}
            <div className="border-b border-slate-200 px-6 pt-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setDetailTab('products')}
                  className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                    detailTab === 'products'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>ສິນຄ້າທີ່ສະໜອງ</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-50 text-indigo-700">
                    {supplierStatsMap[viewingSupplier.id]?.suppliedProducts.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setDetailTab('movements')}
                  className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                    detailTab === 'movements'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>ປະຫວັດການຮັບເຂົ້າສາງ</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-50 text-emerald-700">
                    {supplierStatsMap[viewingSupplier.id]?.stockInMovements.length || 0}
                  </span>
                </button>
              </div>

              {detailTab === 'products' ? (
                <button
                  onClick={() => {
                    setViewingSupplier(null);
                    onOpenAddProductForSupplier(viewingSupplier.name);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ ເພີ່ມສິນຄ້າໃໝ່ໂດຍຜູ້ສະໜອງນີ້</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setViewingSupplier(null);
                    onOpenStockIn(undefined, viewingSupplier.name);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>+ ບັນທຶກຮັບສິນຄ້າເຂົ້າ</span>
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === 'products' ? (
                /* Tab 1: Products supplied */
                <div>
                  {(supplierStatsMap[viewingSupplier.id]?.suppliedProducts.length || 0) > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">ສິນຄ້າ</th>
                            <th className="py-2.5 px-3">ໝວດໝູ່</th>
                            <th className="py-2.5 px-3">ບ່ອນຈັດເກັບ</th>
                            <th className="py-2.5 px-3 text-right">ຕົ້ນທຶນ</th>
                            <th className="py-2.5 px-3 text-right">ລາຄາຂາຍ</th>
                            <th className="py-2.5 px-3 text-center">ຍອດຄົງເຫຼືອ</th>
                            <th className="py-2.5 px-3 text-center">ຮັບເຂົ້າ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {supplierStatsMap[viewingSupplier.id]?.suppliedProducts.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                      <Package className="w-4 h-4 text-slate-400" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-slate-900">{p.name}</div>
                                    <div className="text-xs font-mono text-indigo-600">SKU: {p.sku}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-xs text-slate-600">
                                {p.category}
                              </td>

                              <td className="py-3 px-3 text-xs text-slate-600">
                                {p.location || 'ບໍ່ໄດ້ລະບຸ'}
                              </td>

                              <td className="py-3 px-3 text-right font-mono text-xs text-slate-700">
                                {formatKip(p.costPrice)}
                              </td>

                              <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-emerald-700">
                                {formatKip(p.sellingPrice)}
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                                  {formatNumber(p.quantity)} {p.unit}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => {
                                    setViewingSupplier(null);
                                    onOpenStockIn(p.id, viewingSupplier.name);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                                  title="ຮັບເຂົ້າສິນຄ້ານີ້"
                                >
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                  <span>ຮັບເຂົ້າ</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm">ຍັງບໍ່ມີລາຍການສິນຄ້າໃດທີ່ຜູກກັບຜູ້ສະໜອງນີ້</p>
                      <button
                        onClick={() => {
                          setViewingSupplier(null);
                          onOpenAddProductForSupplier(viewingSupplier.name);
                        }}
                        className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        + ສ້າງສິນຄ້າໃໝ່ໂດຍຜູ້ສະໜອງນີ້
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 2: Stock In Movements */
                <div>
                  {(supplierStatsMap[viewingSupplier.id]?.stockInMovements.length || 0) > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">ເລກທີເອກະສານ</th>
                            <th className="py-2.5 px-3">ວັນທີ-ເວລາ</th>
                            <th className="py-2.5 px-3">ສິນຄ້າ</th>
                            <th className="py-2.5 px-3 text-right">ຈຳນວນ</th>
                            <th className="py-2.5 px-3 text-right">ລາຄາຕໍ່ໜ່ວຍ</th>
                            <th className="py-2.5 px-3 text-right">ມູນຄ່າລວມ</th>
                            <th className="py-2.5 px-3">ເອກະສານອ້າງອີງ</th>
                            <th className="py-2.5 px-3 text-center">ໃບຮັບ (Voucher)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {supplierStatsMap[viewingSupplier.id]?.stockInMovements.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="py-3 px-3 font-mono font-bold text-xs text-indigo-700">
                                {m.documentNo}
                              </td>

                              <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                                {formatDateTime(m.date)}
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-800 text-xs">{m.productName}</div>
                                <div className="font-mono text-[11px] text-slate-400">SKU: {m.productSku}</div>
                              </td>

                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 text-xs">
                                +{formatNumber(m.quantity)} {m.unit}
                              </td>

                              <td className="py-3 px-3 text-right font-mono text-xs text-slate-600">
                                {formatKip(m.unitCost)}
                              </td>

                              <td className="py-3 px-3 text-right font-mono font-bold text-xs text-slate-900">
                                {formatKip(m.totalValue)}
                              </td>

                              <td className="py-3 px-3 font-mono text-xs text-slate-500">
                                {m.referenceDoc || '-'}
                              </td>

                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => onSelectVoucher(m)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                                  title="ພິມໃບຮັບສິນຄ້າເຂົ້າ"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>ພິມ</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm">ຍັງບໍ່ມີປະຫວັດການຮັບສິນຄ້າເຂົ້າຈາກຜູ້ສະໜອງນີ້</p>
                      <button
                        onClick={() => {
                          setViewingSupplier(null);
                          onOpenStockIn(undefined, viewingSupplier.name);
                        }}
                        className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        + ບັນທຶກຮັບສິນຄ້າເຂົ້າທຳອິດ
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs shrink-0">
              <span className="text-slate-500 font-mono">
                ID: {viewingSupplier.id} | ສ້າງວັນທີ: {viewingSupplier.createdAt ? viewingSupplier.createdAt.substring(0, 10) : '-'}
              </span>
              <button
                onClick={() => setViewingSupplier(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium cursor-pointer transition"
              >
                ປິດໜ້າຕ່າງ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: Add / Edit Supplier ===================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base sm:text-lg">
                  {editingSupplier ? 'ແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງສິນຄ້າ' : 'ເພີ່ມຜູ້ສະໜອງສິນຄ້າໃໝ່'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-sm max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ລະຫັດຜູ້ສະໜອງ (Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="SUP-001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ຊື່ບໍລິສັດ / ຮ້ານຄ້າ / ຜູ້ສະໜອງ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ເຊັ່ນ: ບໍລິສັດ ເບຍລາວ ຈຳກັດ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Contact Person & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ຜູ້ຕິດຕໍ່ປະສານງານ (Contact Person)
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={e => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="ເຊັ່ນ: ທ່ານ ສົມພອນ ໄຊຍະວົງ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ເບີໂທລະສັບຕິດຕໍ່ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="ເຊັ່ນ: 020 55512345 / 021 812000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Email & Tax ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ອີເມລ (Email)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@company.la"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ເລກປະຈຳຕົວຜູ້ເສຍພາສີ (Tax ID)
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={e => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    placeholder="0100998877"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ທີ່ຢູ່ / ໂຮງງານ / ຫ້ອງການ
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="ບ້ານ, ເມືອງ, ແຂວງ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Category, Payment Terms, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ໝວດໝູ່ຫຼັກ
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ເງື່ອນໄຂການຊຳລະ
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={e => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                  >
                    {SUPPLIER_PAYMENT_TERMS.map(term => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ສະຖານະ (Status)
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="ACTIVE">ເຄື່ອນໄຫວປົກກະຕິ (Active)</option>
                    <option value="INACTIVE">ໂຈະການຕິດຕໍ່ (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ໝາຍເຫດເພີ່ມເຕີມ
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ຂໍ້ມູນອື່ນໆ ເຊັ່ນ: ເວລາສົ່ງສິນຄ້າ, ຂໍ້ຕົກລົງພິເສດ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer text-xs"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer text-xs"
                >
                  {editingSupplier ? 'ບັນທຶກການແກ້ໄຂ' : 'ຢືນຢັນເພີ່ມຜູ້ສະໜອງ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: Delete Confirm ===================== */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">
              ຢືນຢັນການລຶບຜູ້ສະໜອງນີ້?
            </h3>
            <p className="text-sm text-slate-600 mb-2">
              ທ່ານຕ້ອງການລຶບ <span className="font-semibold text-slate-800">[{deletingSupplier.code}] {deletingSupplier.name}</span> ອອກຈາກລະບົບແທ້ບໍ່?
            </p>
            {supplierStatsMap[deletingSupplier.id]?.suppliedProducts.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-left my-3">
                <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-600" />
                ຜູ້ສະໜອງນີ້ມີສິນຄ້າຜູກຢູ່ <span className="font-bold">{supplierStatsMap[deletingSupplier.id].suppliedProducts.length} ລາຍການ</span>. ຂໍ້ມູນສິນຄ້າຈະຍັງຄົງຢູ່ ແຕ່ຊື່ຜູ້ສະໜອງຈະຖືກຖອດອອກ.
              </div>
            )}
            <div className="flex justify-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setDeletingSupplier(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer text-xs"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSupplier(deletingSupplier.id);
                  if (viewingSupplier && viewingSupplier.id === deletingSupplier.id) {
                    setViewingSupplier(null);
                  }
                  setDeletingSupplier(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition cursor-pointer shadow-md shadow-rose-600/20 text-xs"
              >
                ຢືນຢັນລຶບ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
