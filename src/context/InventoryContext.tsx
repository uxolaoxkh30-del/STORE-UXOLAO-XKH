import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, StockMovement, WarehouseSettings, Supplier } from '../types/inventory';
import { INITIAL_PRODUCTS, INITIAL_MOVEMENTS, INITIAL_SUPPLIERS } from '../data/mockData';
import { generateDocNumber } from '../utils/formatters';

interface InventoryStats {
  totalSkus: number;
  totalQuantity: number;
  totalCostValue: number;
  totalSellingValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalMovements: number;
  monthlyInQty: number;
  monthlyOutQty: number;
  monthlyInValue: number;
  monthlyOutValue: number;
}

interface InventoryContextType {
  products: Product[];
  movements: StockMovement[];
  suppliers: Supplier[];
  stats: InventoryStats;
  settings: WarehouseSettings;
  updateSettings: (updates: Partial<WarehouseSettings>) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => boolean;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => boolean;
  findSupplier: (idOrName: string) => Supplier | undefined;
  recordStockIn: (params: {
    productId: string;
    quantity: number;
    unitCost?: number;
    supplier: string;
    staffName: string;
    reason: string;
    notes?: string;
    referenceDoc?: string;
    customDocNo?: string;
    date?: string;
  }) => { success: boolean; movement?: StockMovement; error?: string };
  recordStockOut: (params: {
    productId: string;
    quantity: number;
    requester: string;
    staffName: string;
    reason: string;
    notes?: string;
    referenceDoc?: string;
    customDocNo?: string;
    date?: string;
  }) => { success: boolean; movement?: StockMovement; error?: string };
  adjustStock: (params: {
    productId: string;
    newQuantity: number;
    reason: string;
    staffName: string;
    notes?: string;
  }) => { success: boolean; movement?: StockMovement; error?: string };
  batchAuditReconcile: (items: {
    productId: string;
    countedQty: number;
    reason: string;
    staffName: string;
    notes?: string;
  }[]) => { count: number };
  exportBackup: () => void;
  importBackup: (jsonString: string) => { success: boolean; error?: string };
  resetToDemoData: () => void;
  clearAllData: () => void;
  findProduct: (idOrSku: string) => Product | undefined;
}

const STORAGE_KEY_PRODUCTS = 'lao_warehouse_products_v1';
const STORAGE_KEY_MOVEMENTS = 'lao_warehouse_movements_v1';
const STORAGE_KEY_SUPPLIERS = 'lao_warehouse_suppliers_v1';
const STORAGE_KEY_SETTINGS = 'lao_warehouse_settings_v1';

export const DEFAULT_SETTINGS: WarehouseSettings = {
  warehouseName: 'ສາງສິນຄ້າສູນກາງ ວຽງຈັນ',
  companyName: 'ບໍລິສັດ ຄຸ້ມຄອງສາງ ແລະ ຂົນສົ່ງ ລາວ ຈຳກັດຜູ້ດຽວ',
  address: 'ຖະໜົນ ໄກສອນ ພົມວິຫານ, ເມືອງ ໄຊເສດຖາ, ນະຄອນຫຼວງວຽງຈັນ',
  phone: '+856 21 450000 / 020 55512345',
  email: 'warehouse@lao-wms.la',
  currency: 'LAK',
  thbRate: 620,
  usdRate: 22000,
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WarehouseSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Error loading settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading products from storage', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading movements from storage', e);
    }
    return INITIAL_MOVEMENTS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading suppliers from storage', e);
    }
    return INITIAL_SUPPLIERS;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
    } catch (e) {
      console.error('Error saving movements', e);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(suppliers));
    } catch (e) {
      console.error('Error saving suppliers', e);
    }
  }, [suppliers]);

  // Compute live statistics
  const stats: InventoryStats = React.useMemo(() => {
    const totalSkus = products.length;
    let totalQuantity = 0;
    let totalCostValue = 0;
    let totalSellingValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalQuantity += p.quantity;
      totalCostValue += p.quantity * p.costPrice;
      totalSellingValue += p.quantity * p.sellingPrice;

      if (p.quantity === 0) {
        outOfStockCount++;
      } else if (p.quantity <= p.minStockAlert) {
        lowStockCount++;
      }
    }

    let monthlyInQty = 0;
    let monthlyOutQty = 0;
    let monthlyInValue = 0;
    let monthlyOutValue = 0;

    // Filter movements this month
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    for (const m of movements) {
      const isThisMonth = m.date.startsWith(currentYearMonth);
      if (m.type === 'IN') {
        if (isThisMonth) {
          monthlyInQty += m.quantity;
          monthlyInValue += m.totalValue;
        }
      } else if (m.type === 'OUT') {
        if (isThisMonth) {
          monthlyOutQty += m.quantity;
          monthlyOutValue += m.totalValue;
        }
      }
    }

    return {
      totalSkus,
      totalQuantity,
      totalCostValue,
      totalSellingValue,
      lowStockCount,
      outOfStockCount,
      totalMovements: movements.length,
      monthlyInQty,
      monthlyOutQty,
      monthlyInValue,
      monthlyOutValue,
    };
  }, [products, movements]);

  const findProduct = (idOrSku: string): Product | undefined => {
    return products.find(p => p.id === idOrSku || p.sku.toLowerCase() === idOrSku.toLowerCase());
  };

  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();
    const newProd: Product = {
      ...data,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now,
    };

    setProducts(prev => [newProd, ...prev]);

    // If initial quantity > 0, log an initial stock in movement
    if (newProd.quantity > 0) {
      const inDoc = generateDocNumber('IN', movements.filter(m => m.type === 'IN').length + 1);
      const initialMove: StockMovement = {
        id: `mov-${Date.now()}`,
        documentNo: inDoc,
        type: 'IN',
        productId: newProd.id,
        productSku: newProd.sku,
        productName: newProd.name,
        unit: newProd.unit,
        quantity: newProd.quantity,
        previousStock: 0,
        newStock: newProd.quantity,
        unitCost: newProd.costPrice,
        totalValue: newProd.quantity * newProd.costPrice,
        partyName: newProd.supplier || 'ສາງເບື້ອງຕົ້ນ',
        staffName: 'ຜູ້ເບິ່ງແຍງລະບົບ',
        reason: 'ສັ່ງຊື້ສິນຄ້າເຂົ້າໃໝ່ (Purchase)',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        notes: 'ຍອດສະຕັອກເລີ່ມຕົ້ນຕອນເພີ່ມສິນຄ້າໃໝ່',
      };
      setMovements(prev => [initialMove, ...prev]);
    }

    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string): boolean => {
    setProducts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier => {
    const nextNum = suppliers.length + 1;
    const code = supplierData.code?.trim() || `SUP-${String(nextNum).padStart(3, '0')}`;
    const newSup: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSuppliers(prev => [newSup, ...prev]);
    return newSup;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === id) {
          return {
            ...s,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );
  };

  const deleteSupplier = (id: string): boolean => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    return true;
  };

  const findSupplier = (idOrName: string): Supplier | undefined => {
    if (!idOrName) return undefined;
    const lower = idOrName.toLowerCase().trim();
    return suppliers.find(
      s => s.id === idOrName || s.code.toLowerCase() === lower || s.name.toLowerCase() === lower
    );
  };

  const recordStockIn = ({
    productId,
    quantity,
    unitCost,
    supplier,
    staffName,
    reason,
    notes,
    referenceDoc,
    customDocNo,
    date,
  }: {
    productId: string;
    quantity: number;
    unitCost?: number;
    supplier: string;
    staffName: string;
    reason: string;
    notes?: string;
    referenceDoc?: string;
    customDocNo?: string;
    date?: string;
  }) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      return { success: false, error: 'ບໍ່ພົບຂໍ້ມູນສິນຄ້ານີ້ໃນລະບົບ' };
    }

    if (quantity <= 0) {
      return { success: false, error: 'ຈຳນວນຮັບເຂົ້າຕ້ອງຫຼາຍກວ່າ 0' };
    }

    const cost = unitCost !== undefined && unitCost >= 0 ? unitCost : product.costPrice;
    const previousStock = product.quantity;
    const newStock = previousStock + quantity;

    const inCount = movements.filter(m => m.type === 'IN').length + 1;
    const docNo = customDocNo || generateDocNumber('IN', inCount);
    const moveDate = date || new Date().toISOString().replace('T', ' ').substring(0, 16);

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      documentNo: docNo,
      type: 'IN',
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      unit: product.unit,
      quantity,
      previousStock,
      newStock,
      unitCost: cost,
      totalValue: quantity * cost,
      partyName: supplier || product.supplier || 'ຜູ້ສະໜອງທົ່ວໄປ',
      staffName: staffName || 'ເຈົ້າໜ້າທີ່ສາງ',
      reason,
      date: moveDate,
      notes,
      referenceDoc,
    };

    // Update product stock and optionally cost price
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            quantity: newStock,
            costPrice: cost,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    setMovements(prev => [movement, ...prev]);

    return { success: true, movement };
  };

  const recordStockOut = ({
    productId,
    quantity,
    requester,
    staffName,
    reason,
    notes,
    referenceDoc,
    customDocNo,
    date,
  }: {
    productId: string;
    quantity: number;
    requester: string;
    staffName: string;
    reason: string;
    notes?: string;
    referenceDoc?: string;
    customDocNo?: string;
    date?: string;
  }) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      return { success: false, error: 'ບໍ່ພົບຂໍ້ມູນສິນຄ້ານີ້ໃນລະບົບ' };
    }

    if (quantity <= 0) {
      return { success: false, error: 'ຈຳນວນເບີກອອກຕ້ອງຫຼາຍກວ່າ 0' };
    }

    if (quantity > product.quantity) {
      return {
        success: false,
        error: `ຍອດສິນຄ້າໃນສາງບໍ່ພໍເບີກ! ຍອດຄົງເຫຼືອປັດຈຸບັນມີພຽງ ${product.quantity} ${product.unit}`,
      };
    }

    const previousStock = product.quantity;
    const newStock = previousStock - quantity;

    const outCount = movements.filter(m => m.type === 'OUT').length + 1;
    const docNo = customDocNo || generateDocNumber('OUT', outCount);
    const moveDate = date || new Date().toISOString().replace('T', ' ').substring(0, 16);

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      documentNo: docNo,
      type: 'OUT',
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      unit: product.unit,
      quantity,
      previousStock,
      newStock,
      unitCost: product.costPrice,
      totalValue: quantity * product.costPrice,
      partyName: requester || 'ພະແນກພາຍໃນ',
      staffName: staffName || 'ເຈົ້າໜ້າທີ່ສາງ',
      reason,
      date: moveDate,
      notes,
      referenceDoc,
    };

    // Update product stock
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            quantity: newStock,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    setMovements(prev => [movement, ...prev]);

    return { success: true, movement };
  };

  const adjustStock = ({
    productId,
    newQuantity,
    reason,
    staffName,
    notes,
  }: {
    productId: string;
    newQuantity: number;
    reason: string;
    staffName: string;
    notes?: string;
  }) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      return { success: false, error: 'ບໍ່ພົບຂໍ້ມູນສິນຄ້າ' };
    }

    if (newQuantity < 0) {
      return { success: false, error: 'ຍອດຄົງເຫຼືອບໍ່ສາມາດຕິດລົບໄດ້' };
    }

    const diff = newQuantity - product.quantity;
    if (diff === 0) {
      return { success: false, error: 'ຍອດໃໝ່ເທົ່າກັບຍອດເກົ່າ ບໍ່ມີການປ່ຽນແປງ' };
    }

    const adjCount = movements.filter(m => m.type === 'ADJUST').length + 1;
    const docNo = generateDocNumber('ADJUST', adjCount);

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      documentNo: docNo,
      type: 'ADJUST',
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      unit: product.unit,
      quantity: Math.abs(diff),
      previousStock: product.quantity,
      newStock: newQuantity,
      unitCost: product.costPrice,
      totalValue: Math.abs(diff) * product.costPrice,
      partyName: diff > 0 ? 'ປັບຍອດເພີ່ມ (Surplus)' : 'ປັບຍອດຫຼຸດ (Deficit)',
      staffName: staffName || 'ຜູ້ກວດສອບສະຕັອກ',
      reason: reason || 'ກວດນັບສະຕັອກປະຈຳງວດ',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: notes || `ປັບປຸງຍອດຈາກ ${product.quantity} ເປັນ ${newQuantity} (${diff > 0 ? '+' : ''}${diff} ${product.unit})`,
    };

    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            quantity: newQuantity,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    setMovements(prev => [movement, ...prev]);

    return { success: true, movement };
  };

  const updateSettings = (updates: Partial<WarehouseSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const batchAuditReconcile = (items: {
    productId: string;
    countedQty: number;
    reason: string;
    staffName: string;
    notes?: string;
  }[]): { count: number } => {
    let reconciledCount = 0;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newMovements: StockMovement[] = [];
    const updatedProductsMap = new Map<string, number>();

    items.forEach((item, idx) => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) return;

      const diff = item.countedQty - prod.quantity;
      if (diff === 0) return; // no difference

      reconciledCount++;
      updatedProductsMap.set(prod.id, item.countedQty);

      const docNo = generateDocNumber('ADJUST', movements.length + idx + 1);
      newMovements.push({
        id: `mov-${Date.now()}-${idx}`,
        documentNo: docNo,
        type: 'ADJUST',
        productId: prod.id,
        productSku: prod.sku,
        productName: prod.name,
        unit: prod.unit,
        quantity: Math.abs(diff),
        previousStock: prod.quantity,
        newStock: item.countedQty,
        unitCost: prod.costPrice,
        totalValue: Math.abs(diff) * prod.costPrice,
        partyName: diff > 0 ? 'ປັບຍອດເພີ່ມ (Surplus)' : 'ປັບຍອດຫຼຸດ (Deficit)',
        staffName: item.staffName || 'ເຈົ້າໜ້າທີ່ກວດນັບ',
        reason: item.reason || 'ກວດນັບສະຕັອກປະຈຳງວດ',
        date: nowStr,
        notes: item.notes || `ກວດນັບຕົວຈິງ: ${prod.quantity} ➔ ${item.countedQty} (${diff > 0 ? '+' : ''}${diff} ${prod.unit})`,
      });
    });

    if (reconciledCount > 0) {
      setProducts(prev =>
        prev.map(p => {
          if (updatedProductsMap.has(p.id)) {
            return {
              ...p,
              quantity: updatedProductsMap.get(p.id)!,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        })
      );
      setMovements(prev => [...newMovements, ...prev]);
    }

    return { count: reconciledCount };
  };

  const exportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      products,
      movements,
      suppliers,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lao_warehouse_backup_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importBackup = (jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.products) || !Array.isArray(parsed.movements)) {
        return { success: false, error: 'ຮູບແບບໄຟລ໌ Backup ບໍ່ຖືກຕ້ອງ' };
      }
      setProducts(parsed.products);
      setMovements(parsed.movements);
      if (Array.isArray(parsed.suppliers)) {
        setSuppliers(parsed.suppliers);
      }
      if (parsed.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'ເກີດຂໍ້ຜິດພາດໃນການອ່ານໄຟລ໌' };
    }
  };

  const resetToDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setMovements(INITIAL_MOVEMENTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEY_SUPPLIERS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
  };

  const clearAllData = () => {
    setProducts([]);
    setMovements([]);
    setSuppliers([]);
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEY_SUPPLIERS);
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        movements,
        suppliers,
        stats,
        settings,
        updateSettings,
        addProduct,
        updateProduct,
        deleteProduct,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        findSupplier,
        recordStockIn,
        recordStockOut,
        adjustStock,
        batchAuditReconcile,
        exportBackup,
        importBackup,
        resetToDemoData,
        clearAllData,
        findProduct,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
