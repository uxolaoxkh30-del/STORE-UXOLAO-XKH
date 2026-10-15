export interface Product {
  id: string;
  sku: string; // ລະຫັດສິນຄ້າ (SKU)
  barcode?: string; // ບາໂຄ້ດ
  name: string; // ຊື່ສິນຄ້າ
  category: string; // ໝວດໝູ່
  unit: string; // ຫົວໜ່ວຍ (ແກັດ, ອັນ, ກ່ອງ, ແພັກ, etc.)
  costPrice: number; // ລາຄາຕົ້ນທຶນ (ກີບ)
  sellingPrice: number; // ລາຄາຂາຍ (ກີບ)
  quantity: number; // ຍອດຄົງເຫຼືອປັດຈຸບັນ
  minStockAlert: number; // ຈຸດເຕືອນສະຕັອກຂັ້ນຕ່ຳ
  location: string; // ບ່ອນຈັດເກັບ / ໂຊນ (A-01, Shelf B, etc.)
  imageUrl?: string; // ຮູບພາບສິນຄ້າ (Data URL ຫຼື ຮູບຖ່າຍຈາກກ້ອງ)
  supplier?: string; // ຜູ້ສະໜອງ
  notes?: string; // ໝາຍເຫດ
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUST';

export interface StockMovement {
  id: string;
  documentNo: string; // ເລກທີໃບຮັບ/ໃບເບີກ
  type: MovementType; // IN (ຮັບເຂົ້າ), OUT (ເບີກອອກ), ADJUST (ປັບປຸງ)
  productId: string;
  productSku: string;
  productName: string;
  unit: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalValue: number;
  partyName: string; // ຜູ້ສົ່ງມອບ (Supplier) ຫຼື ຜູ້ເບີກ (Requester)
  staffName: string; // ຜູ້ຮັບເຄື່ອງ ຫຼື ຜູ້ອະນຸມັດ/ຜູ້ຈ່າຍ
  reason: string; // ເຫດຜົນ
  date: string; // YYYY-MM-DD HH:mm
  notes?: string;
  referenceDoc?: string; // ເອກະສານອ້າງອີງ
}

export const PRODUCT_CATEGORIES = [
  'ເຄື່ອງດື່ມ',
  'ອາຫານ ແລະ ເຄື່ອງບໍລິໂພກ',
  'ເຄື່ອງໃຊ້ໃນຄົວເຮືອນ',
  'ເຄື່ອງໃຊ້ໄຟຟ້າ',
  'ເຄື່ອງກໍ່ສ້າງ & ສ້ອມແປງ',
  'ເຄື່ອງໃຊ້ຫ້ອງການ',
  'ອຸປະກອນໄອທີ',
  'ສິນຄ້າອື່ນໆ',
] as const;

export const PRODUCT_UNITS = [
  'ແກັດ',
  'ອັນ',
  'ກ່ອງ',
  'ແພັກ',
  'ຖົງ',
  'ຕຸກ',
  'ຊຸດ',
  'ກິໂລ',
  'ເປົາ',
  'ເຄື່ອງ',
  'ແມັດ',
  'ມ້ວນ',
] as const;

export const STOCK_IN_REASONS = [
  'ສັ່ງຊື້ສິນຄ້າເຂົ້າໃໝ່ (Purchase)',
  'ຮັບຄືນຈາກລູກຄ້າ (Customer Return)',
  'ຍ້າຍມາຈາກສາງອື່ນ (Warehouse Transfer)',
  'ສິນຄ້າຜະລິດສຳເລັດ (Production)',
  'ປັບຍອດສະຕັອກເກີນ (Stock Surplus)',
  'ອື່ນໆ (Other)',
] as const;

export const STOCK_OUT_REASONS = [
  'ຂາຍໃຫ້ລູກຄ້າ (Sales Order)',
  'ເບີກໃຊ້ພາຍໃນບໍລິສັດ (Internal Use)',
  'ຍ້າຍໄປສາງອື່ນ (Warehouse Transfer)',
  'ສົ່ງຄືນຜູ້ສະໜອງ (Supplier Return)',
  'ສິນຄ້າຊຳລຸດ/ໝົດອາຍຸ (Damaged/Expired)',
  'ປັບຍອດສະຕັອກຂາດ (Stock Loss)',
  'ອື່ນໆ (Other)',
] as const;

export interface WarehouseZone {
  code: string; // A, B, C, D, E, F
  name: string;
  category: string;
  description: string;
  capacityLimit: number; // max units
  color: string;
  badgeColor: string;
}

export const WAREHOUSE_ZONES: WarehouseZone[] = [
  {
    code: 'ໂຊນ A',
    name: 'ໂຊນ A (ເຄື່ອງດື່ມ & ສາງເຢັນ)',
    category: 'ເຄື່ອງດື່ມ',
    description: 'ຈັດເກັບເບຍ, ນ້ຳດື່ມ, ເຄື່ອງດື່ມກະປ໋ອງ ແລະ ຂວດ',
    capacityLimit: 800,
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-700',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    code: 'ໂຊນ B',
    name: 'ໂຊນ B (ອາຫານ & ເຄື່ອງບໍລິໂພກ)',
    category: 'ອາຫານ ແລະ ເຄື່ອງບໍລິໂພກ',
    description: 'ເຂົ້າສານ, ກາເຟ, ໝີ່, ເຄື່ອງປຸງລົດຊາດ',
    capacityLimit: 600,
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-700',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    code: 'ໂຊນ C',
    name: 'ໂຊນ C (ເຄື່ອງໃຊ້ໃນຄົວເຮືອນ)',
    category: 'ເຄື່ອງໃຊ້ໃນຄົວເຮືອນ',
    description: 'ສະບູ່ຝຸ່ນ, ນ້ຳຢາທຳຄວາມສະອາດ, ເຄື່ອງໃຊ້ທົ່ວໄປ',
    capacityLimit: 400,
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-700',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    code: 'ໂຊນ D',
    name: 'ໂຊນ D (ເຄື່ອງໃຊ້ຫ້ອງການ & ເຄື່ອງຂຽນ)',
    category: 'ເຄື່ອງໃຊ້ຫ້ອງການ',
    description: 'ເຈ້ຍ A4, ປຶ້ມ, ອຸປະກອນສຳນັກງານ',
    capacityLimit: 300,
    color: 'from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-700',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  {
    code: 'ໂຊນ E',
    name: 'ໂຊນ E (ເຄື່ອງໃຊ້ໄຟຟ້າ & ໄອທີ)',
    category: 'ເຄື່ອງໃຊ້ໄຟຟ້າ',
    description: 'ພັດລົມ, ດອກໄຟ, ສາຍໄຟ, ອຸປະກອນໄຟຟ້າ',
    capacityLimit: 350,
    color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-700',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  {
    code: 'ໂຊນ F',
    name: 'ໂຊນ F (ສາງກໍ່ສ້າງ & ສ້ອມແປງ)',
    category: 'ເຄື່ອງກໍ່ສ້າງ & ສ້ອມແປງ',
    description: 'ປູນຊີມັງ, ອຸປະກອນກໍ່ສ້າງ, ເຄື່ອງມືຊ່າງ',
    capacityLimit: 1000,
    color: 'from-slate-500/20 to-zinc-500/20 border-slate-500/30 text-slate-700',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
];

export interface WarehouseSettings {
  warehouseName: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  taxId?: string;
  currency: 'LAK' | 'THB' | 'USD';
  thbRate: number; // e.g. 620 LAK per 1 THB
  usdRate: number; // e.g. 22000 LAK per 1 USD
}

export interface Supplier {
  id: string;
  code: string; // e.g. SUP-001
  name: string; // ຊື່ບໍລິສັດ/ຜູ້ສະໜອງ
  contactPerson: string; // ຜູ້ຕິດຕໍ່ປະສານງານ
  phone: string; // ເບີໂທລະສັບ
  email?: string; // ອີເມລ
  address: string; // ທີ່ຢູ່
  category?: string; // ໝວດໝູ່ສິນຄ້າຫຼັກ
  taxId?: string; // ເລກປະຈຳຕົວຜູ້ເສຍພາສີ
  paymentTerms?: string; // ເງື່ອນໄຂການຊຳລະ (ເງິນສົດ, ເຄຣດິດ 30 ວັນ, etc.)
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const SUPPLIER_PAYMENT_TERMS = [
  'ເງິນສົດ (Cash On Delivery)',
  'ໂອນຜ່ານທະນາຄານ (Bank Transfer)',
  'ເຄຣດິດ 15 ວັນ (Credit 15 Days)',
  'ເຄຣດິດ 30 ວັນ (Credit 30 Days)',
  'ເຄຣດິດ 60 ວັນ (Credit 60 Days)',
  'ມັດຈຳ 50% / ຊຳລະເມື່ອສົ່ງມອບ 50%',
] as const;

