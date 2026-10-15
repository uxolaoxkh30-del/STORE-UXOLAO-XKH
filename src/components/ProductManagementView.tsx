import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product, PRODUCT_CATEGORIES, PRODUCT_UNITS, SUPPLIER_PAYMENT_TERMS } from '../types/inventory';
import { formatKip, formatNumber, exportToCSV } from '../utils/formatters';
import { CameraCaptureModal } from './CameraCaptureModal';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle,
  CheckCircle,
  X,
  Sparkles,
  MapPin,
  Tag,
  DollarSign,
  Camera,
  Upload,
  Image as ImageIcon,
  ZoomIn,
  Barcode,
  Building2,
  Phone,
  User,
  ExternalLink
} from 'lucide-react';

interface ProductManagementViewProps {
  onOpenStockIn: (productId?: string) => void;
  onOpenStockOut: (productId?: string) => void;
  onPrintBarcode?: (product?: Product) => void;
  isAddModalOpenInitially?: boolean;
  initialSupplierName?: string;
  onNavigateToSuppliers?: () => void;
}

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  onOpenStockIn,
  onOpenStockOut,
  onPrintBarcode,
  isAddModalOpenInitially = false,
  initialSupplierName,
  onNavigateToSuppliers,
}) => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, suppliers, addSupplier } = useInventory();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(isAddModalOpenInitially);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Quick Add Supplier inline modal state
  const [isQuickAddSupplierOpen, setIsQuickAddSupplierOpen] = useState(false);
  const [quickSupplierData, setQuickSupplierData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    category: PRODUCT_CATEGORIES[0] as string,
    paymentTerms: SUPPLIER_PAYMENT_TERMS[0] as string,
  });
  const [quickSupplierError, setQuickSupplierError] = useState<string | null>(null);

  // Camera & Image preview states
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'form' | Product | null>(null);
  const [previewingImage, setPreviewingImage] = useState<{ url: string; name: string; sku: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    category: PRODUCT_CATEGORIES[0] as string,
    unit: PRODUCT_UNITS[0] as string,
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    minStockAlert: 10,
    location: '',
    supplier: '',
    notes: '',
    imageUrl: '',
  });

  // Stock Adjustment state
  const [adjustData, setAdjustData] = useState({
    newQuantity: 0,
    reason: 'ກວດນັບສະຕັອກຕົວຈິງ (Stock Audit)',
    staffName: 'ຫົວໜ້າຄຸ້ມຄອງສາງ',
    notes: '',
  });

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search filter
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.supplier && p.supplier.toLowerCase().includes(q));

      // Category filter
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

      // Status filter
      let matchesStatus = true;
      if (stockStatusFilter === 'OUT') {
        matchesStatus = p.quantity === 0;
      } else if (stockStatusFilter === 'LOW') {
        matchesStatus = p.quantity > 0 && p.quantity <= p.minStockAlert;
      } else if (stockStatusFilter === 'NORMAL') {
        matchesStatus = p.quantity > p.minStockAlert;
      }

      // Supplier filter
      const matchesSupplier =
        selectedSupplierFilter === 'ALL' ||
        (p.supplier && p.supplier.toLowerCase().trim() === selectedSupplierFilter.toLowerCase().trim());

      return matchesSearch && matchesCategory && matchesStatus && matchesSupplier;
    });
  }, [products, searchTerm, selectedCategory, stockStatusFilter, selectedSupplierFilter]);

  // Find supplier detail if mapped
  const selectedSupplierDetail = useMemo(() => {
    if (!formData.supplier) return null;
    const trimmed = formData.supplier.toLowerCase().trim();
    return suppliers.find(s => s.name.toLowerCase().trim() === trimmed || s.code.toLowerCase().trim() === trimmed);
  }, [formData.supplier, suppliers]);

  // Sync initialSupplierName if provided
  useEffect(() => {
    if (initialSupplierName) {
      setFormData(prev => ({ ...prev, supplier: initialSupplierName }));
      setIsFormModalOpen(true);
    }
  }, [initialSupplierName]);

  // Quick Add Supplier inline handler
  const handleQuickAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSupplierData.name.trim() || !quickSupplierData.phone.trim()) {
      setQuickSupplierError('ກະລຸນາປ້ອນຊື່ຜູ້ສະໜອງ ແລະ ເບີໂທຕິດຕໍ່ໃຫ້ຄົບຖ້ວນ');
      return;
    }
    const newSup = addSupplier({
      code: quickSupplierData.code.trim() || `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      name: quickSupplierData.name.trim(),
      contactPerson: quickSupplierData.contactPerson.trim() || 'ບໍ່ໄດ້ລະບຸ',
      phone: quickSupplierData.phone.trim(),
      address: quickSupplierData.address.trim() || 'ນະຄອນຫຼວງວຽງຈັນ',
      category: quickSupplierData.category,
      paymentTerms: quickSupplierData.paymentTerms,
      status: 'ACTIVE',
    });
    setFormData(prev => ({ ...prev, supplier: newSup.name }));
    setIsQuickAddSupplierOpen(false);
  };

  // Open modal for Create
  const handleOpenAdd = () => {
    // Auto generate SKU recommendation based on next index
    const nextNum = products.length + 1;
    const autoSku = `PRD-${String(nextNum).padStart(3, '0')}`;
    setFormData({
      sku: autoSku,
      barcode: '',
      name: '',
      category: PRODUCT_CATEGORIES[0],
      unit: PRODUCT_UNITS[0],
      costPrice: 10000,
      sellingPrice: 15000,
      quantity: 10,
      minStockAlert: 5,
      location: 'ໂຊນ A-01',
      supplier: initialSupplierName || '',
      notes: '',
      imageUrl: '',
    });
    setEditingProduct(null);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormError(null);
    setFormData({
      sku: p.sku,
      barcode: p.barcode || '',
      name: p.name,
      category: p.category,
      unit: p.unit,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      quantity: p.quantity,
      minStockAlert: p.minStockAlert,
      location: p.location,
      supplier: p.supplier || '',
      notes: p.notes || '',
      imageUrl: p.imageUrl || '',
    });
    setIsFormModalOpen(true);
  };

  // Open modal for Adjust Stock
  const handleOpenAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustData({
      newQuantity: p.quantity,
      reason: 'ກວດນັບສະຕັອກຕົວຈິງ (Stock Audit)',
      staffName: 'ຫົວໜ້າຄຸ້ມຄອງສາງ',
      notes: '',
    });
  };

  // Open camera modal
  const handleTriggerCamera = (target: 'form' | Product) => {
    setCameraTarget(target);
    setIsCameraModalOpen(true);
  };

  // Handle photo captured from camera
  const handlePhotoCaptured = (dataUrl: string) => {
    if (cameraTarget === 'form') {
      setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
    } else if (cameraTarget && typeof cameraTarget === 'object') {
      updateProduct(cameraTarget.id, { imageUrl: dataUrl });
    }
    setIsCameraModalOpen(false);
    setCameraTarget(null);
  };

  // Direct file upload in form
  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      if (result) {
        // optimize size
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 800;
          let w = img.width;
          let h = img.height;
          if (w > h && w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const optimized = canvas.toDataURL('image/jpeg', 0.85);
          setFormData(prev => ({ ...prev, imageUrl: optimized }));
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Save product (Add or Update)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      setFormError('ກະລຸນາປ້ອນຊື່ສິນຄ້າ ແລະ ລະຫັດສິນຄ້າ (SKU) ໃຫ້ຄົບຖ້ວນ');
      return;
    }
    setFormError(null);

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || undefined,
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        minStockAlert: Number(formData.minStockAlert),
        location: formData.location.trim(),
        supplier: formData.supplier.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
      });
    } else {
      addProduct({
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || undefined,
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        quantity: Number(formData.quantity) || 0,
        minStockAlert: Number(formData.minStockAlert) || 5,
        location: formData.location.trim() || 'ໂຊນທົ່ວໄປ',
        supplier: formData.supplier.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
      });
    }

    setIsFormModalOpen(false);
  };

  // Submit stock adjustment
  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    adjustStock({
      productId: adjustingProduct.id,
      newQuantity: Number(adjustData.newQuantity),
      reason: adjustData.reason,
      staffName: adjustData.staffName,
      notes: adjustData.notes,
    });

    setAdjustingProduct(null);
  };

  // Export filtered products to Excel/CSV with Lao UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'ລະຫັດສິນຄ້າ (SKU)',
      'ບາໂຄ້ດ (Barcode)',
      'ຊື່ສິນຄ້າ',
      'ໝວດໝູ່',
      'ຫົວໜ່ວຍ',
      'ຍອດຄົງເຫຼືອ',
      'ຈຸດເຕືອນຂັ້ນຕ່ຳ',
      'ຕົ້ນທຶນ (ກີບ)',
      'ລາຄາຂາຍ (ກີບ)',
      'ມູນຄ່າສະຕັອກຕົ້ນທຶນ (ກີບ)',
      'ບ່ອນຈັດເກັບ',
      'ຜູ້ສະໜອງ',
      'ໝາຍເຫດ',
    ];

    const rows = filteredProducts.map(p => [
      p.sku,
      p.barcode || '',
      p.name,
      p.category,
      p.unit,
      p.quantity,
      p.minStockAlert,
      p.costPrice,
      p.sellingPrice,
      p.quantity * p.costPrice,
      p.location,
      p.supplier || '',
      p.notes || '',
    ]);

    const dateStr = new Date().toISOString().substring(0, 10);
    exportToCSV(headers, rows, `ລາຍການສິນຄ້າ_${dateStr}`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ຈັດການສິນຄ້າ ແລະ ຂໍ້ມູນສະຕັອກ
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ເພີ່ມ, ແກ້ໄຂ, ຄົ້ນຫາລະຫັດສິນຄ້າ, ໝວດໝູ່, ຫົວໜ່ວຍ, ລາຄາ ແລະ ຕິດຕາມຍອດຄົງເຫຼືອ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onPrintBarcode && (
              <button
                onClick={() => onPrintBarcode()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition cursor-pointer"
                title="ພິມສະຕິກເກີ້ບາໂຄ້ດສິນຄ້າ"
              >
                <Barcode className="w-4 h-4 text-slate-600" />
                <span>ພິມປ້າຍບາໂຄ້ດ</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition cursor-pointer"
              title="ດາວໂຫຼດໄຟລ໌ Excel / CSV ພາສາລາວ"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ ເພີ່ມສິນຄ້າໃໝ່</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-5">
          {/* Search Input (4 Cols) */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ຄົ້ນຫາ: ຊື່ສິນຄ້າ, SKU, ບາໂຄ້ດ, ໂຊນ..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm transition"
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

          {/* Category Dropdown (3 Cols) */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white cursor-pointer"
            >
              <option value="ALL">ໝວດໝູ່ທັງໝົດ (All Categories)</option>
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Dropdown (3 Cols) */}
          <div className="lg:col-span-3">
            <select
              value={selectedSupplierFilter}
              onChange={e => setSelectedSupplierFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white cursor-pointer"
            >
              <option value="ALL">ຜູ້ສະໜອງທັງໝົດ (All Suppliers)</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (2 Cols) */}
          <div className="lg:col-span-2">
            <select
              value={stockStatusFilter}
              onChange={e => setStockStatusFilter(e.target.value as any)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white cursor-pointer"
            >
              <option value="ALL">ສະຖານະທັງໝົດ</option>
              <option value="NORMAL">ສະຕັອກປົກກະຕິ</option>
              <option value="LOW">ສິນຄ້າໃກ້ໝົດ</option>
              <option value="OUT">ໝົດສະຕັອກ</option>
            </select>
          </div>
        </div>

        {/* Status Count Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-4 text-xs">
          <span className="text-slate-500 font-medium">ສະແດງຜົນ: {filteredProducts.length} ຈາກ {products.length} ລາຍການ</span>
          
          <button
            onClick={() => setStockStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
              stockStatusFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ທັງໝົດ ({products.length})
          </button>

          <button
            onClick={() => setStockStatusFilter('LOW')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
              stockStatusFilter === 'LOW'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            ໃກ້ໝົດ ({products.filter(p => p.quantity > 0 && p.quantity <= p.minStockAlert).length})
          </button>

          <button
            onClick={() => setStockStatusFilter('OUT')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-medium ${
              stockStatusFilter === 'OUT'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
            }`}
          >
            ໝົດສະຕັອກ ({products.filter(p => p.quantity === 0).length})
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ລະຫັດ & ຊື່ສິນຄ້າ</th>
                <th className="py-3 px-3">ໝວດໝູ່</th>
                <th className="py-3 px-3">ບ່ອນຈັດເກັບ</th>
                <th className="py-3 px-3 text-right">ຕົ້ນທຶນ / ຂາຍ</th>
                <th className="py-3 px-3 text-center">ຍອດຄົງເຫຼືອ</th>
                <th className="py-3 px-3 text-center">ຈຸດເຕືອນ</th>
                <th className="py-3 px-4 text-center">ການຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">ບໍ່ພົບລາຍການສິນຄ້າທີ່ກົງກັບເງື່ອນໄຂ</p>
                    <p className="text-xs text-slate-400 mt-1">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ກົດເພີ່ມສິນຄ້າໃໝ່</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isOutOfStock = p.quantity === 0;
                  const isLowStock = p.quantity > 0 && p.quantity <= p.minStockAlert;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                      {/* SKU, Photo & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Image Thumbnail with zoom or snap */}
                          <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group/img flex items-center justify-center">
                            {p.imageUrl ? (
                              <>
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                                  onClick={() => setPreviewingImage({ url: p.imageUrl!, name: p.name, sku: p.sku })}
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewingImage({ url: p.imageUrl!, name: p.name, sku: p.sku })}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition cursor-pointer text-white"
                                  title="ກົດເບິ່ງຮູບໃຫຍ່"
                                >
                                  <ZoomIn className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTriggerCamera(p)}
                                className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/70 transition cursor-pointer p-1"
                                title="ກົດເພື່ອຖ່າຍຮູບສິນຄ້ານີ້ຜ່ານກ້ອງ (Camera API)"
                              >
                                <Camera className="w-4 h-4" />
                                <span className="text-[9px] mt-0.5 font-medium">+ຮູບ</span>
                              </button>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate max-w-xs sm:max-w-sm">
                              {p.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-100">
                                {p.sku}
                              </span>
                              {p.barcode && (
                                <span className="font-mono text-[11px] text-slate-500">
                                  Barcode: {p.barcode}
                                </span>
                              )}
                              {p.supplier && (
                                <span 
                                  className="inline-flex items-center gap-1 font-sans text-[11px] text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-1.5 py-0.5 rounded border border-slate-200 transition"
                                  title={`ຜູ້ສະໜອງ: ${p.supplier}`}
                                >
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  <span className="truncate max-w-[110px]">{p.supplier}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.location || 'ບໍ່ໄດ້ລະບຸ'}</span>
                        </div>
                      </td>

                      {/* Cost & Selling Price */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-mono font-medium text-xs text-slate-800">
                          ທຶນ: {formatKip(p.costPrice)}
                        </div>
                        <div className="font-mono text-[11px] text-emerald-700 font-semibold">
                          ຂາຍ: {formatKip(p.sellingPrice)}
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isOutOfStock ? (
                            'ໝົດ (0)'
                          ) : (
                            <>
                              {formatNumber(p.quantity)} {p.unit}
                            </>
                          )}
                        </span>
                      </td>

                      {/* Min alert threshold */}
                      <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-500">
                        &le; {p.minStockAlert} {p.unit}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick In */}
                          <button
                            onClick={() => onOpenStockIn(p.id)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="ຮັບສິນຄ້ານີ້ເຂົ້າ"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                          </button>

                          {/* Quick Out */}
                          <button
                            onClick={() => onOpenStockOut(p.id)}
                            disabled={p.quantity === 0}
                            className={`p-1.5 rounded-lg transition ${
                              p.quantity === 0
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer'
                            }`}
                            title={p.quantity === 0 ? 'ສິນຄ້າໝົດ ບໍ່ສາມາດເບີກໄດ້' : 'ເບີກສິນຄ້ານີ້ອອກ'}
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>

                          {/* Quick Snap/Change Camera Photo */}
                          <button
                            onClick={() => handleTriggerCamera(p)}
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                            title={p.imageUrl ? 'ຖ່າຍຮູບໃໝ່ຜ່ານກ້ອງ' : 'ຖ່າຍຮູບສິນຄ້າຜ່ານກ້ອງ (Camera API)'}
                          >
                            <Camera className="w-4 h-4" />
                          </button>

                          {/* Print Barcode Label */}
                          {onPrintBarcode && (
                            <button
                              onClick={() => onPrintBarcode(p)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="ພິມປ້າຍບາໂຄ້ດສິນຄ້ານີ້"
                            >
                              <Barcode className="w-4 h-4" />
                            </button>
                          )}

                          {/* Adjust stock */}
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="ປັບຍອດສະຕັອກ (Stock Adjust)"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="ແກ້ໄຂຂໍ້ມູນສິນຄ້າ"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="ລຶບສິນຄ້າ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== MODAL: Add / Edit Product ===================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg">
                  {editingProduct ? 'ແກ້ໄຂຂໍ້ມູນສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່ເຂົ້າສາງ'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-sm max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product Photo & Camera Capture Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {formData.imageUrl ? (
                    <>
                      <img
                        src={formData.imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition shadow-xs cursor-pointer"
                        title="ລຶບຮູບນີ້"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                      <span className="text-[10px] text-slate-400">ຍັງບໍ່ມີຮູບ</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      ຮູບພາບສິນຄ້າ (Product Photo)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      ຖ່າຍຮູບສິນຄ້າຕົວຈິງຜ່ານກ້ອງ (Camera API) ຫຼື ອັບໂຫຼດໄຟລ໌ເພື່ອຊ່ວຍໃຫ້ການກວດສອບງ່າຍຂຶ້ນ
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTriggerCamera('form')}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>ຖ່າຍຮູບຜ່ານກ້ອງ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>ອັບໂຫຼດຮູບ</span>
                    </button>

                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                        className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium transition cursor-pointer"
                      >
                        ລຶບຮູບ
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDirectFileUpload}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ລະຫັດສິນຄ້າ (SKU) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="ເຊັ່ນ: BRL-001, COF-002"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ບາໂຄ້ດ (Barcode / EAN-13)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="ເຊັ່ນ: 8850029100112"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ສິນຄ້າ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ເຊັ່ນ: ເບຍລາວ ລາກເກີ້ 330ml x 24 ກະປ໋ອງ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ໝວດໝູ່ສິນຄ້າ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ຫົວໜ່ວຍ (Unit) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                  >
                    {PRODUCT_UNITS.map(unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cost Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ລາຄາຕົ້ນທຶນ (ກີບ / Kip)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <span className="text-[11px] text-slate-500">{formatKip(formData.costPrice)}</span>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ລາຄາຂາຍ (ກີບ / Kip)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.sellingPrice}
                    onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <span className="text-[11px] text-slate-500">{formatKip(formData.sellingPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Initial stock (only for new) */}
                {!editingProduct ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ຍອດສະຕັອກເລີ່ມຕົ້ນ ({formData.unit})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ຍອດຄົງເຫຼືອປັດຈຸບັນ
                    </label>
                    <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold font-mono">
                      {editingProduct.quantity} {editingProduct.unit} (ປັບປຸງໄດ້ທີ່ປຸ່ມປັບຍອດ)
                    </div>
                  </div>
                )}

                {/* Min stock alert threshold */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ຈຸດເຕືອນສະຕັອກຂັ້ນຕ່ຳ ({formData.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={e => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <span className="text-[11px] text-slate-500">ລະບົບຈະແຈ້ງເຕືອນເມື່ອຍອດ &le; ຄ່ານີ້</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ບ່ອນຈັດເກັບ / ໂຊນສາງ
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="ເຊັ່ນ: ໂຊນ A-01, ຊັ້ນວາງ B-3"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* Supplier Field with Integrated Selector and Quick Add */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      ຜູ້ສະໜອງຫຼັກ (Supplier)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickSupplierData({
                          code: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
                          name: '',
                          contactPerson: '',
                          phone: '',
                          address: '',
                          category: formData.category || PRODUCT_CATEGORIES[0],
                          paymentTerms: SUPPLIER_PAYMENT_TERMS[0],
                        });
                        setQuickSupplierError(null);
                        setIsQuickAddSupplierOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ ເພີ່ມຜູ້ສະໜອງໃໝ່</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={formData.supplier}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '__ADD_NEW__') {
                          setQuickSupplierData({
                            code: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
                            name: '',
                            contactPerson: '',
                            phone: '',
                            address: '',
                            category: formData.category || PRODUCT_CATEGORIES[0],
                            paymentTerms: SUPPLIER_PAYMENT_TERMS[0],
                          });
                          setQuickSupplierError(null);
                          setIsQuickAddSupplierOpen(true);
                        } else {
                          setFormData({ ...formData, supplier: val });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="">-- ເລືອກຜູ້ສະໜອງ (ຫຼື ບໍ່ໄດ້ລະບຸ) --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.name}>
                          [{s.code}] {s.name} {s.contactPerson ? `(${s.contactPerson})` : ''}
                        </option>
                      ))}
                      <option value="__ADD_NEW__" className="text-indigo-600 font-bold">
                        + ເພີ່ມຜູ້ສະໜອງໃໝ່ເຂົ້າລະບົບ...
                      </option>
                    </select>

                    {/* Integrated Supplier Contact Details Card */}
                    {selectedSupplierDetail && (
                      <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs space-y-1 text-slate-700">
                        <div className="flex items-center justify-between font-semibold text-indigo-900">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{selectedSupplierDetail.name}</span>
                          </span>
                          <span className="font-mono text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded shrink-0">
                            {selectedSupplierDetail.code}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600 pt-0.5">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{selectedSupplierDetail.contactPerson}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <a href={`tel:${selectedSupplierDetail.phone}`} className="font-mono text-indigo-600 hover:underline truncate">
                              {selectedSupplierDetail.phone}
                            </a>
                          </div>
                        </div>
                        {selectedSupplierDetail.paymentTerms && (
                          <div className="text-[10px] text-slate-500 pt-0.5 border-t border-indigo-100 truncate">
                            ເງື່ອນໄຂຊຳລະ: {selectedSupplierDetail.paymentTerms}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ລາຍລະອຽດ ຫຼື ຄຳແນະນຳການເກັບຮັກສາ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {editingProduct ? 'ບັນທຶກການແກ້ໄຂ' : 'ຢືນຢັນເພີ່ມສິນຄ້າ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: Adjust Stock ===================== */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">ປັບປຸງຍອດສະຕັອກສິນຄ້າ (Stock Adjustment)</h3>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-base">{adjustingProduct.name}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  SKU: {adjustingProduct.sku} | ໂຊນ: {adjustingProduct.location}
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  ຍອດຄົງເຫຼືອປັດຈຸບັນ:{' '}
                  <span className="font-bold font-mono text-indigo-700 text-base">
                    {adjustingProduct.quantity} {adjustingProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຍອດຕົວຈິງຫຼັງການກວດນັບໃໝ່ ({adjustingProduct.unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustData.newQuantity}
                  onChange={e => setAdjustData({ ...adjustData, newQuantity: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-lg font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <div className="mt-1 text-xs">
                  {adjustData.newQuantity > adjustingProduct.quantity ? (
                    <span className="text-emerald-600 font-medium">
                      + ເພີ່ມຂຶ້ນ {adjustData.newQuantity - adjustingProduct.quantity} {adjustingProduct.unit} (ຍອດເກີນ)
                    </span>
                  ) : adjustData.newQuantity < adjustingProduct.quantity ? (
                    <span className="text-rose-600 font-medium">
                      - ຫຼຸດລົງ {adjustingProduct.quantity - adjustData.newQuantity} {adjustingProduct.unit} (ຍອດຂາດ)
                    </span>
                  ) : (
                    <span className="text-slate-500">ຍອດເທົ່າເດີມ ບໍ່ມີການປ່ຽນແປງ</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເຫດຜົນການປັບປຸງຍອດ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adjustData.reason}
                  onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="ເຊັ່ນ: ກວດນັບສະຕັອກຕົວຈິງ, ສິນຄ້າຊຳລຸດ, ຍອດຄິດໄລ່ຜິດພາດ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຜູ້ກວດສອບ / ຜູ້ບັນທຶກ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adjustData.staffName}
                  onChange={e => setAdjustData({ ...adjustData, staffName: e.target.value })}
                  placeholder="ຊື່ເຈົ້າໜ້າທີ່"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ໝາຍເຫດ
                </label>
                <textarea
                  rows={2}
                  value={adjustData.notes}
                  onChange={e => setAdjustData({ ...adjustData, notes: e.target.value })}
                  placeholder="ລາຍລະອຽດເພີ່ມເຕີມ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  ຢືນຢັນປັບຍອດ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: Delete Confirm ===================== */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">
              ຢືນຢັນການລຶບສິນຄ້ານີ້?
            </h3>
            <p className="text-sm text-slate-600 mb-2">
              ທ່ານຕ້ອງການລຶບສິນຄ້າ <span className="font-semibold text-slate-800 font-mono">[{deletingProduct.sku}] {deletingProduct.name}</span> ອອກຈາກລະບົບແທ້ບໍ່?
            </p>
            <p className="text-xs text-rose-500 font-medium mb-6">
              * ຄຳເຕືອນ: ການລຶບນີ້ຈະເອົາສິນຄ້ານີ້ອອກຈາກລາຍການທັງໝົດ
            </p>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(deletingProduct.id);
                  setDeletingProduct(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition cursor-pointer shadow-md shadow-rose-600/20"
              >
                ຢືນຢັນລຶບ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: Camera Capture ===================== */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => {
          setIsCameraModalOpen(false);
          setCameraTarget(null);
        }}
        onCapture={handlePhotoCaptured}
        productName={
          cameraTarget === 'form'
            ? formData.name || 'ສິນຄ້າໃໝ່'
            : cameraTarget && typeof cameraTarget === 'object'
            ? cameraTarget.name
            : undefined
        }
      />

      {/* ===================== MODAL: Zoom Image Preview ===================== */}
      {previewingImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-100">{previewingImage.name}</h4>
                <p className="text-xs text-indigo-400 font-mono mt-0.5">SKU: {previewingImage.sku}</p>
              </div>
              <button
                onClick={() => setPreviewingImage(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 aspect-square flex items-center justify-center bg-black/60 rounded-2xl overflow-hidden my-4 border border-slate-800">
              <img
                src={previewingImage.url}
                alt={previewingImage.name}
                className="max-h-full max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="flex justify-between items-center pt-1 text-xs">
              <span className="text-slate-400">ຮູບພາບສິນຄ້າຕົວຈິງ</span>
              <button
                onClick={() => setPreviewingImage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium cursor-pointer transition"
              >
                ປິດໜ້າຕ່າງ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: Quick Add Supplier ===================== */}
      {isQuickAddSupplierOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  ເພີ່ມຜູ້ສະໜອງໃໝ່ດ່ວນ (Quick Add Supplier)
                </h3>
              </div>
              <button
                onClick={() => setIsQuickAddSupplierOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSupplier} className="p-5 space-y-3.5 text-xs">
              {quickSupplierError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{quickSupplierError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ລະຫັດ (Code)
                  </label>
                  <input
                    type="text"
                    value={quickSupplierData.code}
                    onChange={e => setQuickSupplierData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    ຊື່ບໍລິສັດ / ຜູ້ສະໜອງ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickSupplierData.name}
                    onChange={e => setQuickSupplierData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ເຊັ່ນ: ບໍລິສັດ ຄ້າຂາອອກ-ຂາເຂົ້າ ລາວ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ຜູ້ຕິດຕໍ່ປະສານງານ
                  </label>
                  <input
                    type="text"
                    value={quickSupplierData.contactPerson}
                    onChange={e => setQuickSupplierData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="ເຊັ່ນ: ທ່ານ ສົມສັກ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ເບີໂທລະສັບຕິດຕໍ່ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickSupplierData.phone}
                    onChange={e => setQuickSupplierData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="020 55512345"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ໝວດໝູ່ຫຼັກ
                  </label>
                  <select
                    value={quickSupplierData.category}
                    onChange={e => setQuickSupplierData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white cursor-pointer"
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ເງື່ອນໄຂການຊຳລະ
                  </label>
                  <select
                    value={quickSupplierData.paymentTerms}
                    onChange={e => setQuickSupplierData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white cursor-pointer"
                  >
                    {SUPPLIER_PAYMENT_TERMS.map(term => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ທີ່ຢູ່ / ໂຮງງານ
                </label>
                <input
                  type="text"
                  value={quickSupplierData.address}
                  onChange={e => setQuickSupplierData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="ບ້ານ, ເມືອງ, ນະຄອນຫຼວງວຽງຈັນ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQuickAddSupplierOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  ບັນທຶກ ແລະ ເລືອກທັນທີ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
