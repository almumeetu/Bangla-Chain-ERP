// Types & Mock Data for FMCG Dealer (Diller) Management System

export interface CompanyBrand {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;      // e.g., "Pcs", "Carton", "Case"
  symbol?: string;   // e.g., "pc", "ctn", "doz"
  multiplier: number; // e.g., 24 (means 1 carton = 24 pcs)
  parentUnitId?: string; // Reference to parent unit for hierarchy (e.g., Dozen -> Pcs, Carton -> Dozen)
  description?: string; // Optional description of the unit
}

export interface Godown {
  id: string;
  name: string;
  location?: string;
  isDamageGodown?: boolean;
}

export interface Route {
  id: string;
  name: string;
  area: string;
  territory: string;
  assignedSRId?: string; // Mapped SR
  assignedDeliveryManId?: string; // Mapped Delivery Man
}

export interface SR {
  id: string;
  name: string;
  phone: string;
  commissionRate: number;      // SR Commission Rate in percentage (e.g. 5)
  assignedCompanyIds: string[]; // Companies this SR distributes for
  loginUsername?: string;       // Custom login username
  loginPassword?: string;       // Custom login password
}

export interface DeliveryMan {
  id: string;
  name: string;
  vehicle: string;
}

export interface DamageLogEntry {
  id: string;
  qty: number;
  deltaQty?: number;
  recordedAt: string;
  note?: string;
  type: 'existing' | 'new';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  company: string; // Brand / Manufacturer Company
  createdAt: string;
  categoryId?: string;
  uomId?: string;
  defaultGodownId?: string;
  defaultPP: number;  // Import Price / Purchase Price in BDT
  defaultMRP: number; // Retail Market Price in BDT
  defaultWSP: number; // Wholesale Supply Price in BDT
  currentStock: number;
  damagedStock?: number;
  damageHistory?: DamageLogEntry[];
}

export interface ProductAttribute {
  id: string;
  name: string;      // e.g., "Pack: 24pcs", "Flavor: Chocolate"
  type: string;      // "Packaging" | "Flavor" | "Weight"
  value: string;
  status: 'Active' | 'Inactive';
}

export interface ChallanItem {
  id: string;
  productName: string;
  company: string;          // Product's brand/manufacturer
  attribute: string; 
  qty: number;
  bonusQty: number;
  totalQty: number;         // qty + bonusQty
  rate: number;             // Trade Price (TP)
  totalAmount: number;      // adjusted amount after commission/value-add
  srName: string;           // Supplied by SR
  routeName: string;        // Route beat mapped
  deliveryManName: string;
  status: 'Pending' | 'Shipped' | 'Delivered';
  returnedQty: number;
  damagedQty: number;
  commissionAmount: number; // commission/deduction amount in BDT
  extraProfitAmount?: number; // extra profit/bonus amount in BDT
  extraCommissionAmount?: number; // for backward compatibility
  createdAt: string;        // ISO Date & Time string
  srCommissionType?: 'Percentage' | 'Fixed';
  srCommissionValue?: number;
  srCommissionAmount?: number;
}

export interface ProcurementItem {
  id: string;
  productId: string;
  productName: string;
  purchasePrice: number; // Import price
  mrp: number;
  wsp: number;
  qty: number;
  bonusQty: number;
  discountType: 'Flat' | 'Percentage';
  discountValue: number;
  totalPrice: number;
}

export interface Procurement {
  id: string;
  supplierName: string; // Company supplied from (Dynamic string)
  procurementName: string;
  invoiceRef: string;
  invoiceDate: string;
  deliveryDate: string;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  additionalCost: number; // Carriage/Transport cost
  items: ProcurementItem[];
  globalTotal: number; // Items price sum + additionalCost
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  attributeValue: string;
  oldQty: number;
  newQty: number;
  qtyChanged: number;
  adjustedBy: string;
  reason: string;
  date: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
}

export interface ExpenseRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  expenseDate: string;
  notes: string;
  paidTo: string;
}

// Initial Mock Data matching the Diller Management drawing
export const INITIAL_SRS: SR[] = [
  { id: 'sr-1', name: 'Rakib', phone: '01711223344', commissionRate: 200, assignedCompanyIds: ['comp-1'], loginUsername: 'rakib', loginPassword: 'rakib123' },
  { id: 'sr-2', name: 'Rahman', phone: '01811223344', commissionRate: 200, assignedCompanyIds: ['comp-2'], loginUsername: 'rahman', loginPassword: 'rahman123' },
  { id: 'sr-3', name: 'Rahim', phone: '01911223344', commissionRate: 200, assignedCompanyIds: ['comp-3'], loginUsername: 'rahim', loginPassword: 'rahim123' },
];

export const INITIAL_DELIVERY_MEN: DeliveryMan[] = [
  { id: 'dm-1', name: 'Abul Kalam', vehicle: 'PickUp Truck (Metro-Tha-11-2044)' },
  { id: 'dm-2', name: 'Sujon Mia', vehicle: 'Covered Van (Metro-Cha-54-9988)' },
  { id: 'dm-3', name: 'Khorshed Alam', vehicle: 'Three Wheeler Cargo (Dhaka-H-12-3456)' },
];

// Products categorized by Company: Pran, Olympic, Haque
export const INITIAL_PRODUCTS: Product[] = [
  // PRAN Products
  { id: 'prod-1', name: 'Pran Mango Juice 250ml', sku: 'PRN-MJ-250', company: 'Pran', createdAt: '2026-06-01T09:15:00Z', defaultPP: 22, defaultMRP: 30, defaultWSP: 25, currentStock: 2500, damagedStock: 15, damageHistory: [{ id: 'damage-prod-1', qty: 15, recordedAt: '2026-06-03T10:00:00Z', type: 'existing' }] },
  { id: 'prod-2', name: 'Pran UP Lemon Drink 250ml', sku: 'PRN-UP-250', company: 'Pran', createdAt: '2026-06-02T10:30:00Z', defaultPP: 21, defaultMRP: 30, defaultWSP: 24, currentStock: 1800, damagedStock: 8, damageHistory: [{ id: 'damage-prod-2', qty: 8, recordedAt: '2026-06-04T12:45:00Z', type: 'existing' }] },
  { id: 'prod-3', name: 'Pran Premium Toast Biscuit 350g', sku: 'PRN-TB-350', company: 'Pran', createdAt: '2026-06-03T11:45:00Z', defaultPP: 55, defaultMRP: 80, defaultWSP: 65, currentStock: 1200, damagedStock: 0 },

  // OLYMPIC Products
  { id: 'prod-4', name: 'Olympic Energy Plus Biscuit 60g', sku: 'OLY-EP-60', company: 'Olympic', createdAt: '2026-06-04T08:20:00Z', defaultPP: 8, defaultMRP: 15, defaultWSP: 10, currentStock: 5000, damagedStock: 25, damageHistory: [{ id: 'damage-prod-4', qty: 25, recordedAt: '2026-06-07T15:10:00Z', type: 'existing' }] },
  { id: 'prod-5', name: 'Olympic Lexus Vegetable Cracker', sku: 'OLY-LX-120', company: 'Olympic', createdAt: '2026-06-05T13:05:00Z', defaultPP: 32, defaultMRP: 50, defaultWSP: 40, currentStock: 3200, damagedStock: 12, damageHistory: [{ id: 'damage-prod-5', qty: 12, recordedAt: '2026-06-08T09:35:00Z', type: 'existing' }] },

  // HAQUE Products
  { id: 'prod-6', name: 'Haque Mr. Cookie Biscuit 150g', sku: 'HAQ-MC-150', company: 'Haque', createdAt: '2026-06-06T14:10:00Z', defaultPP: 25, defaultMRP: 40, defaultWSP: 32, currentStock: 2100, damagedStock: 5, damageHistory: [{ id: 'damage-prod-6', qty: 5, recordedAt: '2026-06-09T11:20:00Z', type: 'existing' }] },
  { id: 'prod-7', name: 'Haque Bourbon Chocolate Biscuit', sku: 'HAQ-BB-100', company: 'Haque', createdAt: '2026-06-07T16:25:00Z', defaultPP: 15, defaultMRP: 25, defaultWSP: 19, currentStock: 1500, damagedStock: 0 },
];

export const INITIAL_ATTRIBUTES: ProductAttribute[] = [
  { id: 'attr-1', name: 'Pack: Case of 24', type: 'Packaging', value: 'Case of 24', status: 'Active' },
  { id: 'attr-2', name: 'Pack: Carton of 48', type: 'Packaging', value: 'Carton of 48', status: 'Active' },
  { id: 'attr-3', name: 'Flavor: Mango', type: 'Flavor', value: 'Mango', status: 'Active' },
  { id: 'attr-4', name: 'Flavor: Chocolate', type: 'Flavor', value: 'Chocolate', status: 'Active' },
  { id: 'attr-5', name: 'Weight: 250ml', type: 'Weight', value: '250ml', status: 'Active' },
];

export const INITIAL_CHALLAN_ITEMS: ChallanItem[] = [
  {
    id: 'ch-1',
    productName: 'Pran Mango Juice 250ml',
    company: 'Pran',
    attribute: 'Pack: Case of 24, Flavor: Mango',
    qty: 240, // 10 cases
    bonusQty: 12,
    totalQty: 252,
    rate: 25,
    totalAmount: 6000,
    srName: 'Rakib',
    routeName: 'Elephant Road Beat',
    deliveryManName: 'Abul Kalam',
    status: 'Delivered',
    returnedQty: 0,
    damagedQty: 0,
    commissionAmount: 300, // 6000 * 0.05
    createdAt: '2026-06-25T11:00:00Z',
  },
  {
    id: 'ch-2',
    productName: 'Olympic Lexus Vegetable Cracker',
    company: 'Olympic',
    attribute: 'Pack: Carton of 48',
    qty: 96, // 2 cartons
    bonusQty: 4,
    totalQty: 100,
    rate: 40,
    totalAmount: 3840,
    srName: 'Rahman',
    routeName: 'Chawkbazar Beat',
    deliveryManName: 'Sujon Mia',
    status: 'Shipped',
    returnedQty: 0,
    damagedQty: 0,
    commissionAmount: 192, // 3840 * 0.05
    createdAt: '2026-06-26T14:30:00Z',
  },
  {
    id: 'ch-3',
    productName: 'Haque Mr. Cookie Biscuit 150g',
    company: 'Haque',
    attribute: 'Pack: Case of 24',
    qty: 480, // 20 cases
    bonusQty: 24,
    totalQty: 504,
    rate: 32,
    totalAmount: 15360,
    srName: 'Rahim',
    routeName: 'Bogura Sadar Beat',
    deliveryManName: 'Khorshed Alam',
    status: 'Pending',
    returnedQty: 0,
    damagedQty: 0,
    commissionAmount: 768, // 15360 * 0.05
    createdAt: '2026-06-27T09:15:00Z',
  },
];

export const INITIAL_PROCUREMENTS: Procurement[] = [
  {
    id: 'proc-1',
    supplierName: 'Pran',
    procurementName: 'Pran Juice & Toast Import Batch A',
    invoiceRef: 'PRN-2026-INV-99',
    invoiceDate: '2026-06-10',
    deliveryDate: '2026-06-12',
    paymentStatus: 'Paid',
    additionalCost: 2500,
    items: [
      {
        id: 'pi-1',
        productId: 'prod-1',
        productName: 'Pran Mango Juice 250ml',
        purchasePrice: 22,
        mrp: 30,
        wsp: 25,
        qty: 1000,
        bonusQty: 50,
        discountType: 'Percentage',
        discountValue: 3,
        totalPrice: 21340, // (22 * 1000) * 0.97
      }
    ],
    globalTotal: 23840, // 21340 + 2500
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'proc-2',
    supplierName: 'Olympic',
    procurementName: 'Olympic Biscuit Lexus Cargo Import',
    invoiceRef: 'OLY-MON-9982',
    invoiceDate: '2026-06-18',
    deliveryDate: '2026-06-20',
    paymentStatus: 'Partial',
    additionalCost: 4000,
    items: [
      {
        id: 'pi-2',
        productId: 'prod-5',
        productName: 'Olympic Lexus Vegetable Cracker',
        purchasePrice: 32,
        mrp: 50,
        wsp: 40,
        qty: 2000,
        bonusQty: 100,
        discountType: 'Flat',
        discountValue: 1500,
        totalPrice: 62500, // (32 * 2000) - 1500
      }
    ],
    globalTotal: 66500, // 62500 + 4000
    createdAt: '2026-06-18T14:30:00Z',
  }
];

export const INITIAL_STOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj-1',
    productId: 'prod-1',
    productName: 'Pran Mango Juice 250ml',
    attributeValue: 'Pack: Case of 24',
    oldQty: 2450,
    newQty: 2500,
    qtyChanged: 50,
    adjustedBy: 'Samir Chowdhury (Admin)',
    reason: 'Stock counting check: found extra crate during audit',
    date: '2026-06-22T11:45:00Z',
  }
];

export const INITIAL_EXP_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-1', name: 'SR Salaries & Commission', description: 'Monthly fixed salary and performance commissions paid to SRs' },
  { id: 'cat-2', name: 'Carriage & Transport Fuel', description: 'Fuel and tolls for supplying goods to retail markets' },
  { id: 'cat-3', name: 'Warehouse Rent & Electric', description: 'Utility bills and floor space rent for storing brand stock' },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    categoryId: 'cat-2',
    categoryName: 'Carriage & Transport Fuel',
    amount: 15000,
    expenseDate: '2026-06-18',
    notes: 'Fuel costs for Abul Kalam and Sujon Miah for market runs',
    paidTo: 'Tejgaon Petrol Center',
  },
  {
    id: 'exp-2',
    categoryId: 'cat-1',
    categoryName: 'SR Salaries & Commission',
    amount: 25000,
    expenseDate: '2026-06-25',
    notes: 'Rakib, Rahman, Rahim monthly commissions payment',
    paidTo: 'SR Team Cash Payout',
  }
];

export const INITIAL_COMPANIES: CompanyBrand[] = [
  { id: 'comp-1', name: 'Pran', contactPerson: 'Kamal Ahmed', phone: '01711122233', address: 'Pran Center, Badda, Dhaka' },
  { id: 'comp-2', name: 'Olympic', contactPerson: 'Rafiqul Islam', phone: '01811122233', address: 'Olympic House, Tejgaon, Dhaka' },
  { id: 'comp-3', name: 'Haque', contactPerson: 'Zakir Hasan', phone: '01911122233', address: 'Haque Chamber, Motijheel, Dhaka' }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Juice', description: 'Fresh fruit juices and nectars' },
  { id: 'cat-2', name: 'Biscuit', description: 'Sweet and dry biscuits' },
  { id: 'cat-3', name: 'Toast', description: 'Premium baked toasts' },
  { id: 'cat-4', name: 'Crackers', description: 'Salted crackers and snacks' }
];

export const INITIAL_UNITS: UnitOfMeasure[] = [
  { id: 'uom-1', name: 'Piece', symbol: 'pc', multiplier: 1, description: 'Single unit' },
  { id: 'uom-2', name: 'Dozen', symbol: 'doz', multiplier: 12, parentUnitId: 'uom-1', description: '12 pieces' },
  { id: 'uom-3', name: 'Carton', symbol: 'ctn', multiplier: 240, parentUnitId: 'uom-2', description: '20 dozens = 240 pieces' }
];

export const INITIAL_GODOWNS: Godown[] = [
  { id: 'g-1', name: 'Tongi Mollabari Warehouse', location: 'Tongi Mollabari, Gazipur', isDamageGodown: false }
];

export const INITIAL_ROUTES: Route[] = [
  { id: 'route-1', name: 'Elephant Road Beat', area: 'Dhanmondi', territory: 'Dhaka South', assignedSRId: 'sr-1' },
  { id: 'route-2', name: 'Chawkbazar Beat', area: 'Sadarghat', territory: 'Dhaka South', assignedSRId: 'sr-2' },
  { id: 'route-3', name: 'Bogura Sadar Beat', area: 'Bogura Sadar', territory: 'Rajshahi Division', assignedSRId: 'sr-3' }
];
