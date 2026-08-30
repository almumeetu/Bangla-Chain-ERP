// Types & Mock Data for FMCG Dealer (Diller) Management System

export interface CompanyBrand {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;   // e.g., "Piece", "Carton", "Case"
  symbol: string; // e.g., "PCS", "CTN"
  // Legacy fields kept for backward-compatibility with stored data — not used in UI
  multiplier?: number;
  parentUnitId?: string;
  secondaryUnitName?: string;
  secondaryMultiplier?: number;
  description?: string;
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
  companyId?: string;
  assignedSRId?: string; // Mapped SR
  assignedDeliveryManId?: string; // Mapped Delivery Man
}

export interface SR {
  id: string;
  name: string;
  phone: string;
  commissionRate: number;      // SR Commission Rate in percentage (e.g. 5)
  assignedCompanyIds: string[]; // Companies this SR distributes for
  companyId?: string;           // Primary assigned company ID
  companyName?: string;         // Primary assigned company name
  assignedRouteId?: string;     // Primary assigned route ID
  employeeId?: string;          // Employee ID
  isActive?: boolean;           // Active status
  loginUsername?: string;       // Custom login username
  loginPassword?: string;       // Custom login password
}

export interface SRAttendance {
  id: string;
  srId: string;
  srName: string;
  date: string;            // 'YYYY-MM-DD'
  dayStart?: string;       // ISO timestamp
  dayEnd?: string;         // ISO timestamp
  routeName?: string;
  notes?: string;
  createdAt?: string;
}

export interface SRCollection {
  id: string;
  srId: string;
  srName: string;
  challanId: string;
  customerName: string;
  customerId?: string;
  companyId?: string;
  amount: number;
  paymentMethod: 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Cheque';
  collectedAt: string;
  notes?: string;
}

export interface SRTarget {
  id: string;
  srId: string;
  srName: string;
  month: string;           // 'YYYY-MM'
  companyId?: string;
  companyName?: string;
  targetAmount: number;
  createdAt?: string;
}

export interface DeliveryMan {
  id: string;
  name: string;
  vehicle: string;
  phone?: string;
  assignedCompanyIds?: string[];
}

export interface DamageLogEntry {
  id: string;
  qty: number;
  deltaQty?: number;
  recordedAt: string;
  note?: string;
  type: 'existing' | 'new';
  damageType?: string;
  claimStatus?: string;
}

export interface ProductUnit {
  name: string;      // e.g., "Dozen", "Carton", "Box"
  multiplier: number; // e.g., 12, 24
  secondaryUnitName?: string;
  secondaryMultiplier?: number;
  customDP?: number; // Optional price overrides for this unit tier
  customTP?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  company: string; // Brand / Manufacturer Company
  createdAt: string;
  categoryId?: string;
  uomId?: string;
  customUnits?: ProductUnit[]; // Multiple custom units for this product
  defaultGodownId?: string;
  defaultPP: number;  // Import Price / Purchase Price in BDT
  defaultMRP: number; // Retail Market Price in BDT
  defaultWSP: number; // Wholesale Supply Price in BDT
  currentStock: number;
  damagedStock?: number;
  damageHistory?: DamageLogEntry[];
  cartonSize: number; // How many Pieces inside 1 Carton
  pricePerCarton: number;
  pricePerPiece: number;
  primaryUnit?: 'Piece' | 'Carton';
  stockAlertThreshold?: number; // Alert when stock falls below this value (in primary unit pcs)
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
  customerId?: string;
  customerName?: string;
  // Split return fields: carton-level and piece-level returns (Piece-based products only)
  returnedCartons?: number;
  returnedPcs?: number;
  damagedCartons?: number;
  damagedPcs?: number;
  commissionAmount: number; // commission/deduction amount in BDT
  extraProfitAmount?: number; // extra profit/bonus amount in BDT
  extraCommissionAmount?: number; // for backward compatibility
  createdAt: string;        // ISO Date & Time string
  selectedUnitName?: string;  // e.g. "Dozen", "Carton", "Pcs"
  srCommissionType?: 'Percentage' | 'Fixed';
  srCommissionValue?: number;
  srCommissionAmount?: number;
}

export interface ProcurementItem {
  id: string;
  productId: string;
  productName: string;
  purchasePrice: number; // Import price (per piece or per carton? Let's check legacy usage. Usually it is per piece, but we can compute it accordingly)
  mrp: number;
  wsp: number;
  qty: number; // Total quantity in pieces
  cartons: number; // Carton quantity purchased
  pcs: number;     // Piece quantity purchased
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

export const INITIAL_SRS: SR[] = [
  {
    id: "sr-1783255426553",
    name: "Sobuj",
    phone: "01642222298",
    commissionRate: 5,
    assignedCompanyIds: ["Pran Dairy Milkman Group", "comp-1783247007277"],
    loginUsername: "shohanur1472@gmail.com",
    loginPassword: "sohan2486"
  },
  {
    id: "sr-1783255480881",
    name: "Md. Sohan",
    phone: "01974816392",
    commissionRate: 0,
    assignedCompanyIds: ["Pran Dairy Milkman Group", "comp-1783247007277"],
    loginUsername: "sohan-pran2",
    loginPassword: "sohan123"
  },
  {
    id: "sr-1783255524637",
    name: "Zinnat Ali",
    phone: "01301236408",
    commissionRate: 0,
    assignedCompanyIds: ["Cocola Food Products Ltd C Group", "comp-1783247144876"],
    loginUsername: "zinnat",
    loginPassword: "zinnat123"
  },
  {
    id: "sr-1783255587859",
    name: "Shohidul",
    phone: "01787591058",
    commissionRate: 0,
    assignedCompanyIds: ["Abul Khair Milk Products LTD Sky Group", "comp-1783247065744"],
    loginUsername: "shohidul",
    loginPassword: "shohidul123"
  },
  {
    id: "sr-1783255614409",
    name: "Sojib",
    phone: "01978471889",
    commissionRate: 0,
    assignedCompanyIds: ["Abul Khair Milk Products LTD Sky Group", "comp-1783247065744"],
    loginUsername: "sojib",
    loginPassword: "sojib123"
  },
  {
    id: "sr-1783255662354",
    name: "Kefayet",
    phone: "01614356405",
    commissionRate: 0,
    assignedCompanyIds: ["Abul Khair Milk Products LTD Sky Group", "comp-1783247065744"],
    loginUsername: "kefayet",
    loginPassword: "kefayet123"
  }
];

export const INITIAL_DELIVERY_MEN: DeliveryMan[] = [
  {
    id: "dm-1783255189686",
    name: "Ashik",
    vehicle: "01614325761",
    phone: "01614325761",
    assignedCompanyIds: ["Pran Dairy Milkman Group", "comp-1783247007277"]
  },
  {
    id: "dm-1783255221258",
    name: "Shorif",
    vehicle: "01884271531",
    phone: "01884271531",
    assignedCompanyIds: ["Pran Dairy Milkman Group", "comp-1783247007277"]
  },
  {
    id: "dm-1783255251938",
    name: "Lal Mia",
    vehicle: "01871896912",
    phone: "01871896912",
    assignedCompanyIds: ["Pran Dairy Milkman Group", "comp-1783247007277", "Abul Khair Milk Products LTD Sky Group", "comp-1783247065744"]
  },
  {
    id: "dm-1784883900823",
    name: "Readysales Own",
    vehicle: "own123",
    phone: "own123",
    assignedCompanyIds: ["Pran Dairy Milkman Group", "comp-1783247007277", "Abul Khair Milk Products LTD Sky Group", "comp-1783247065744"]
  }
];

// Products categorized by Company: Pran Dairy Milkman Group, Cocola Food Products Ltd C Group, Abul Khair Milk Products LTD Sky Group
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1783248232464",
    name: "Milkman UHT 200ml",
    sku: "46851",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 24.25,
    defaultWSP: 25.67,
    defaultMRP: 30,
    currentStock: 1709,
    createdAt: "2026-05-01T07:09:51.694Z",
    damagedStock: 0,
    customUnits: [{ name: "Carton", multiplier: 30 }],
    cartonSize: 30,
    pricePerCarton: 770.1,
    pricePerPiece: 25.67,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783248942773",
    name: "Milkman UHT 500ml",
    sku: "46855",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 49.65,
    defaultWSP: 52.5,
    defaultMRP: 60,
    currentStock: 0,
    damagedStock: 0,
    createdAt: "2026-05-01T07:10:22.160Z",
    customUnits: [{ name: "Carton", multiplier: 16 }],
    cartonSize: 16,
    pricePerCarton: 840,
    pricePerPiece: 52.5,
    primaryUnit: "Piece",
    stockAlertThreshold: 80
  },
  {
    id: "prod-1783249048217",
    name: "Pran FCMP 10gm",
    sku: "47091",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247469418",
    defaultPP: 7.15,
    defaultWSP: 7.83,
    defaultMRP: 10,
    currentStock: 6720,
    createdAt: "2026-05-01T07:10:43.354Z",
    customUnits: [{ name: "Carton", multiplier: 120 }],
    damagedStock: 0,
    cartonSize: 120,
    pricePerCarton: 939.6,
    pricePerPiece: 7.83,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783249198385",
    name: "Pran Milk Powder 50gm Chain",
    sku: "53497",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 39.18,
    defaultWSP: 41.14,
    defaultMRP: 50,
    currentStock: 114,
    damagedStock: 0,
    createdAt: "2026-05-01T07:10:53.587Z",
    customUnits: [{ name: "Carton", multiplier: 72 }],
    cartonSize: 72,
    pricePerCarton: 2962.08,
    pricePerPiece: 41.14,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783249257480",
    name: "Pran Full Cream Milk Powder 200gm",
    sku: "32729",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 170.52,
    defaultWSP: 180,
    defaultMRP: 205,
    currentStock: 84,
    damagedStock: 0,
    createdAt: "2026-05-01T07:11:02.715Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 4320,
    pricePerPiece: 180,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783249385932",
    name: "Pran Full Cream Milk Powder 400gm",
    sku: "32733",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 308.77,
    defaultWSP: 325,
    defaultMRP: 390,
    currentStock: 60,
    damagedStock: 0,
    createdAt: "2026-05-01T07:11:14.857Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 7800,
    pricePerPiece: 325,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783249456368",
    name: "Pran Full Cream Milk Powder 500gm",
    sku: "32706",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 385.58,
    defaultWSP: 405,
    defaultMRP: 460,
    currentStock: 4,
    damagedStock: 0,
    createdAt: "2026-05-01T07:11:30.935Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 9720,
    pricePerPiece: 405,
    primaryUnit: "Piece",
    stockAlertThreshold: 12
  },
  {
    id: "prod-1783249516685",
    name: "Super Milk 200gm",
    sku: "51091",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 132,
    defaultWSP: 140,
    defaultMRP: 175,
    currentStock: 67,
    damagedStock: 0,
    createdAt: "2026-05-01T07:11:38.311Z",
    customUnits: [{ name: "Carton", multiplier: 30 }],
    cartonSize: 30,
    pricePerCarton: 4200,
    pricePerPiece: 140,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783249591128",
    name: "Super Milk 500gm",
    sku: "47838",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 304.62,
    defaultWSP: 320,
    defaultMRP: 365,
    currentStock: 16,
    createdAt: "2026-05-01T07:11:47.067Z",
    damagedStock: 0,
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 7680,
    pricePerPiece: 320,
    primaryUnit: "Piece",
    stockAlertThreshold: 48
  },
  {
    id: "prod-1783249704719",
    name: "Super Milk 1000gm",
    sku: "47092",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 585.12,
    defaultWSP: 615,
    defaultMRP: 690,
    currentStock: 83,
    createdAt: "2026-05-01T07:11:54.321Z",
    damagedStock: 0,
    customUnits: [{ name: "Carton", multiplier: 12 }],
    cartonSize: 12,
    pricePerCarton: 7380,
    pricePerPiece: 615,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783249799083",
    name: "Super Milk 5gm",
    sku: "74038",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247469418",
    defaultPP: 4,
    defaultWSP: 4.17,
    defaultMRP: 5,
    currentStock: 2916,
    createdAt: "2026-05-01T07:12:05.622Z",
    damagedStock: 0,
    customUnits: [{ name: "Carton", multiplier: 480 }],
    cartonSize: 480,
    pricePerCarton: 2001.6,
    pricePerPiece: 4.17,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783250134600",
    name: "Pran Premium Ghee 100gm",
    sku: "32744",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 149.84,
    defaultWSP: 160,
    defaultMRP: 190,
    currentStock: 1031,
    createdAt: "2026-05-01T07:12:38.683Z",
    damagedStock: 0,
    customUnits: [{ name: "Carton", multiplier: 36 }],
    cartonSize: 36,
    pricePerCarton: 5760,
    pricePerPiece: 160,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783250214554",
    name: "Pran Premium Ghee 200gm",
    sku: "32745",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 284.88,
    defaultWSP: 300,
    defaultMRP: 350,
    currentStock: 384,
    createdAt: "2026-05-01T07:13:10.508Z",
    damagedStock: 0,
    customUnits: [{ name: "Carton", multiplier: 40 }],
    cartonSize: 40,
    pricePerCarton: 12000,
    pricePerPiece: 300,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783250342182",
    name: "Pran Premium Ghee 450gm",
    sku: "72495",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 641,
    defaultWSP: 680,
    defaultMRP: 760,
    currentStock: 100,
    createdAt: "2026-05-01T07:13:18.240Z",
    damagedStock: 0,
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 16320,
    pricePerPiece: 680,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783250395116",
    name: "Pran Premium Ghee 1000gm",
    sku: "72496",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247459352",
    defaultPP: 1318,
    defaultWSP: 1420,
    defaultMRP: 1625,
    currentStock: 9,
    createdAt: "2026-05-01T07:13:29.262Z",
    damagedStock: 0,
    customUnits: [{ name: "Carton", multiplier: 12 }],
    cartonSize: 12,
    pricePerCarton: 17040,
    pricePerPiece: 1420,
    primaryUnit: "Piece",
    stockAlertThreshold: 12
  },
  {
    id: "prod-1783250483407",
    name: "Mango Fruit Drink 200ml",
    sku: "34494",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247514768",
    defaultPP: 13.79,
    defaultWSP: 14.59,
    defaultMRP: 20,
    currentStock: 3760,
    createdAt: "2026-05-01T07:13:37.295Z",
    damagedStock: 0,
    customUnits: [{ name: "Carton", multiplier: 48 }],
    cartonSize: 48,
    pricePerCarton: 700.32,
    pricePerPiece: 14.59,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783250537609",
    name: "Mango Fruit Drink 150ml",
    sku: "34886",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247514768",
    defaultPP: 11.29,
    defaultWSP: 12,
    defaultMRP: 15,
    currentStock: 0,
    damagedStock: 0,
    createdAt: "2026-05-01T07:13:43.598Z",
    customUnits: [{ name: "Carton", multiplier: 80 }],
    cartonSize: 80,
    pricePerCarton: 960,
    pricePerPiece: 12,
    primaryUnit: "Piece",
    stockAlertThreshold: 80
  },
  {
    id: "prod-1783250613069",
    name: "Orange Fruit Drink 200ml",
    sku: "53571",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247514768",
    defaultPP: 14.29,
    defaultWSP: 15,
    defaultMRP: 20,
    currentStock: 304,
    damagedStock: 0,
    createdAt: "2026-05-01T07:13:50.271Z",
    customUnits: [{ name: "Carton", multiplier: 48 }],
    cartonSize: 48,
    pricePerCarton: 720,
    pricePerPiece: 15,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783250742499",
    name: "Pran FCMP 10gm new",
    sku: "PRA-PF1N-619",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247469418",
    defaultPP: 7.39,
    defaultWSP: 7.84,
    defaultMRP: 10,
    currentStock: 1524,
    damagedStock: 0,
    createdAt: "2026-05-01T07:13:57.515Z",
    customUnits: [{ name: "Carton", multiplier: 120 }],
    cartonSize: 120,
    pricePerCarton: 940.8,
    pricePerPiece: 7.84,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783250818474",
    name: "Active+ Lemon",
    sku: "52249",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247538460",
    defaultPP: 17.83,
    defaultWSP: 19,
    defaultMRP: 25,
    currentStock: 1200,
    createdAt: "2026-05-01T07:14:05.323Z",
    damagedStock: 0,
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 456,
    pricePerPiece: 19,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783250861129",
    name: "Active+ Orange",
    sku: "52250",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247538460",
    defaultPP: 17.83,
    defaultWSP: 19,
    defaultMRP: 25,
    currentStock: 852,
    damagedStock: 0,
    createdAt: "2026-05-01T07:14:12.247Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 456,
    pricePerPiece: 19,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783251021700",
    name: "Pran Matha 200ml",
    sku: "74048",
    company: "Pran Dairy Milkman Group",
    uomId: "uom-1783247304023",
    defaultPP: 548.36,
    defaultWSP: 13920,
    defaultMRP: 30,
    currentStock: 0,
    damagedStock: 0,
    createdAt: "2026-05-01T07:14:19.440Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 13920,
    pricePerPiece: 580,
    primaryUnit: "Carton",
    stockAlertThreshold: 72
  },
  {
    id: "prod-1783251836203",
    name: "Champion Chocolate Biscuits",
    sku: "COC-CCB-876",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251757334",
    defaultPP: 300,
    defaultWSP: 320,
    defaultMRP: 400,
    currentStock: 6,
    damagedStock: 0,
    createdAt: "2026-05-01T07:34:12.135Z",
    customUnits: [{ name: "Carton", multiplier: 20 }],
    cartonSize: 20,
    pricePerCarton: 320,
    pricePerPiece: 16,
    primaryUnit: "Carton",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783251898150",
    name: "Jr. Champion Chocolate Biscuits",
    sku: "COC-JCCB-626",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 112.5,
    defaultWSP: 120,
    defaultMRP: 15,
    currentStock: 334,
    damagedStock: 0,
    createdAt: "2026-05-01T15:03:37.777Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    cartonSize: 4,
    pricePerCarton: 480,
    pricePerPiece: 120,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783251992147",
    name: "Anarkali Butter Toast Biscuit",
    sku: "COC-ABTB-451",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247459352",
    defaultPP: 37.5,
    defaultWSP: 40,
    defaultMRP: 0,
    currentStock: 7,
    damagedStock: 0,
    createdAt: "2026-05-01T15:03:51.367Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    cartonSize: 6,
    pricePerCarton: 240,
    pricePerPiece: 40,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252075309",
    name: "Milk Vanilla (Vanilla Cream Biscuit)",
    sku: "COC-MVC-425",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 180,
    defaultWSP: 192,
    defaultMRP: 20,
    currentStock: 22,
    damagedStock: 0,
    createdAt: "2026-05-01T15:04:03.430Z",
    customUnits: [{ name: "Carton", multiplier: 2 }],
    cartonSize: 2,
    pricePerCarton: 384,
    pricePerPiece: 192,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252118886",
    name: "Time Pass Salted Biscuits",
    sku: "COC-TPSB-219",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 45,
    defaultWSP: 48,
    defaultMRP: 5,
    currentStock: 5,
    damagedStock: 0,
    createdAt: "2026-05-01T15:04:18.419Z",
    customUnits: [{ name: "Carton", multiplier: 3 }],
    cartonSize: 3,
    pricePerCarton: 144,
    pricePerPiece: 48,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252158606",
    name: "Real Horlicks Cookies Biscuit",
    sku: "COC-RHCB-468",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 42.5,
    defaultWSP: 45,
    defaultMRP: 0,
    currentStock: 3,
    damagedStock: 0,
    createdAt: "2026-05-01T15:04:25.186Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    cartonSize: 6,
    pricePerCarton: 270,
    pricePerPiece: 45,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252203203",
    name: "Choco Chocolate Biscuit",
    sku: "COC-CCB-828",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 180,
    defaultWSP: 192,
    defaultMRP: 10,
    currentStock: 33,
    damagedStock: 0,
    createdAt: "2026-05-01T15:04:30.074Z",
    customUnits: [{ name: "Carton", multiplier: 2 }],
    cartonSize: 2,
    pricePerCarton: 384,
    pricePerPiece: 192,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252270119",
    name: "Eat Me Instant Noodles",
    sku: "COC-EMIN-730",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247469418",
    defaultPP: 93.67,
    defaultWSP: 96,
    defaultMRP: 10,
    currentStock: 30,
    damagedStock: 0,
    createdAt: "2026-05-01T15:04:35.293Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    cartonSize: 6,
    pricePerCarton: 576,
    pricePerPiece: 96,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252320424",
    name: "Junior Cup Noodles (Chicken Curry)",
    sku: "COC-JCN-758",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247459352",
    defaultPP: 25.32,
    defaultWSP: 27,
    defaultMRP: 35,
    currentStock: 0,
    damagedStock: 0,
    createdAt: "2026-05-01T15:04:43.671Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 648,
    pricePerPiece: 27,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252355581",
    name: "Junior Cup Noodles (Chicken Curry) Savings",
    sku: "COC-JCN-932",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 24.17,
    defaultWSP: 27,
    defaultMRP: 35,
    currentStock: 102,
    damagedStock: 0,
    createdAt: "2026-05-01T15:08:06.654Z",
    customUnits: [{ name: "Carton", multiplier: 48 }],
    cartonSize: 48,
    pricePerCarton: 1296,
    pricePerPiece: 27,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252408027",
    name: "Egg & Chicken Noodles (300gm)",
    sku: "COC-ECN-390",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247459352",
    defaultPP: 39.5,
    defaultWSP: 42,
    defaultMRP: 50,
    currentStock: 98,
    damagedStock: 0,
    createdAt: "2026-05-01T15:08:13.463Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    cartonSize: 12,
    pricePerCarton: 504,
    pricePerPiece: 42,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252452797",
    name: "Egg & Chicken Noodles (500 gm)",
    sku: "COC-ECN-669",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247459352",
    defaultPP: 66,
    defaultWSP: 70,
    defaultMRP: 85,
    currentStock: 110,
    damagedStock: 0,
    createdAt: "2026-05-01T15:08:18.371Z",
    customUnits: [{ name: "Carton", multiplier: 10 }],
    cartonSize: 10,
    pricePerCarton: 700,
    pricePerPiece: 70,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252618515",
    name: "Wafer Roll Jar (Chocolate)",
    sku: "COC-WRJ-863",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 56.75,
    defaultWSP: 60,
    defaultMRP: 0,
    currentStock: 509,
    damagedStock: 0,
    createdAt: "2026-05-01T15:08:27.592Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    cartonSize: 6,
    pricePerCarton: 360,
    pricePerPiece: 60,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252776789",
    name: "Milky Milk-chocolate crispy Wafer Roll",
    sku: "COC-MMCW-866",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 180,
    defaultWSP: 192,
    defaultMRP: 10,
    currentStock: 17,
    damagedStock: 0,
    createdAt: "2026-05-01T15:08:33.280Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    cartonSize: 4,
    pricePerCarton: 768,
    pricePerPiece: 192,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252925620",
    name: "Chocolate Cream Wafer Biscuit",
    sku: "COC-CCWB-555",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247459352",
    defaultPP: 15.42,
    defaultWSP: 16.5,
    defaultMRP: 20,
    currentStock: 60,
    damagedStock: 0,
    createdAt: "2026-05-01T15:08:46.544Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    cartonSize: 12,
    pricePerCarton: 198,
    pricePerPiece: 16.5,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783252986676",
    name: "Vanilla Cream Wafer Biscuit",
    sku: "COC-VCWB-231",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247459352",
    defaultPP: 15.42,
    defaultWSP: 16.5,
    defaultMRP: 20,
    currentStock: 72,
    damagedStock: 0,
    createdAt: "2026-05-01T15:08:52.050Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    cartonSize: 12,
    pricePerCarton: 198,
    pricePerPiece: 16.5,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253041942",
    name: "Mini Cashew NutChocolate Wafer Biscuit",
    sku: "COC-MCNW-656",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 180,
    defaultWSP: 192,
    defaultMRP: 10,
    currentStock: 4,
    damagedStock: 0,
    createdAt: "2026-05-01T15:09:05.706Z",
    customUnits: [{ name: "Carton", multiplier: 3 }],
    cartonSize: 3,
    pricePerCarton: 576,
    pricePerPiece: 192,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253099116",
    name: "Choco Crunch Chips",
    sku: "COC-CCC-720",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 151.67,
    defaultWSP: 160,
    defaultMRP: 10,
    currentStock: 45,
    damagedStock: 0,
    createdAt: "2026-05-01T15:09:12.688Z",
    customUnits: [{ name: "Carton", multiplier: 3 }],
    cartonSize: 3,
    pricePerCarton: 480,
    pricePerPiece: 160,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253149272",
    name: "Choco Crunch (Jar)",
    sku: "COC-CC-983",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 70,
    defaultWSP: 76,
    defaultMRP: 90,
    currentStock: 111,
    damagedStock: 0,
    createdAt: "2026-05-01T15:09:20.432Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    cartonSize: 12,
    pricePerCarton: 912,
    pricePerPiece: 76,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253199006",
    name: "Boom Boom Chocolate Gems",
    sku: "COC-BBCG-339",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 90,
    defaultWSP: 96,
    defaultMRP: 5,
    currentStock: 23,
    damagedStock: 0,
    createdAt: "2026-05-01T15:09:25.467Z",
    customUnits: [{ name: "Carton", multiplier: 3 }],
    cartonSize: 3,
    pricePerCarton: 288,
    pricePerPiece: 96,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253305060",
    name: "Fun & Joy (10 Pc)",
    sku: "COC-FJ-117",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 197.5,
    defaultWSP: 210,
    defaultMRP: 30,
    currentStock: 73,
    damagedStock: 0,
    createdAt: "2026-05-01T15:09:32.030Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    cartonSize: 6,
    pricePerCarton: 1260,
    pricePerPiece: 210,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253364151",
    name: "Fun & Joy (30 Pc)",
    sku: "COC-FJ-807",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 592.5,
    defaultWSP: 630,
    defaultMRP: 30,
    currentStock: 29,
    damagedStock: 0,
    createdAt: "2026-05-01T15:09:36.842Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    cartonSize: 4,
    pricePerCarton: 2520,
    pricePerPiece: 630,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253531821",
    name: "Cornetti Twin Chocolate Biscuit Cone",
    sku: "COC-CTCB-481",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 409.5,
    defaultWSP: 440,
    defaultMRP: 20,
    currentStock: 13,
    damagedStock: 0,
    createdAt: "2026-05-01T15:09:41.992Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    cartonSize: 4,
    pricePerCarton: 1760,
    pricePerPiece: 440,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253577817",
    name: "Cornetti Black & White Chocolate Biscuit Cone",
    sku: "COC-BW-968",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 409.5,
    defaultWSP: 440,
    defaultMRP: 20,
    currentStock: 25,
    damagedStock: 0,
    createdAt: "2026-05-01T15:09:47.126Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    cartonSize: 4,
    pricePerCarton: 1760,
    pricePerPiece: 440,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253694932",
    name: "Marshmallow (Doll)",
    sku: "COC-M-332",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 271.6,
    defaultWSP: 300,
    defaultMRP: 20,
    currentStock: 23,
    damagedStock: 0,
    createdAt: "2026-05-01T15:09:52.503Z",
    customUnits: [{ name: "Carton", multiplier: 3 }],
    cartonSize: 3,
    pricePerCarton: 900,
    pricePerPiece: 300,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253919739",
    name: "Momo Marshmallow",
    sku: "COC-MM-318",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 305.4,
    defaultWSP: 330,
    defaultMRP: 15,
    currentStock: 12,
    damagedStock: 0,
    createdAt: "2026-05-01T15:09:56.737Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    cartonSize: 4,
    pricePerCarton: 1320,
    pricePerPiece: 330,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783253970863",
    name: "Jolly Lolly Lollipop",
    sku: "COC-JLL-148",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 90,
    defaultWSP: 96,
    defaultMRP: 5,
    currentStock: 58,
    damagedStock: 0,
    createdAt: "2026-05-01T15:10:02.370Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    cartonSize: 4,
    pricePerCarton: 384,
    pricePerPiece: 96,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254034954",
    name: "Tatul Super Chutney (50 Pcs) FG",
    sku: "COC-TSC-490",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 180,
    defaultWSP: 190,
    defaultMRP: 5,
    currentStock: 22,
    damagedStock: 0,
    createdAt: "2026-05-01T15:10:08.183Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    cartonSize: 6,
    pricePerCarton: 1140,
    pricePerPiece: 190,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254095550",
    name: "Stick Noodles 20tk",
    sku: "COC-SN2-255",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247304023",
    defaultPP: 368.53,
    defaultWSP: 390,
    defaultMRP: 0,
    currentStock: 20,
    damagedStock: 0,
    createdAt: "2026-05-01T15:10:37.617Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 390,
    pricePerPiece: 16.25,
    primaryUnit: "Carton",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254140956",
    name: "Stick Noodles 25tk",
    sku: "COC-SN2-357",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247304023",
    defaultPP: 452.74,
    defaultWSP: 490,
    defaultMRP: 0,
    currentStock: 34,
    damagedStock: 0,
    createdAt: "2026-05-01T15:10:50.870Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    cartonSize: 24,
    pricePerCarton: 490,
    pricePerPiece: 20.42,
    primaryUnit: "Carton",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254197702",
    name: "Tiffin Rolls",
    sku: "COC-TR-979",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 180,
    defaultWSP: 192,
    defaultMRP: 10,
    currentStock: 28,
    damagedStock: 0,
    createdAt: "2026-05-01T15:10:57.396Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    cartonSize: 4,
    pricePerCarton: 768,
    pricePerPiece: 192,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254246067",
    name: "Happy Ice lolly (Pouch)",
    sku: "COC-HIL-694",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783251797413",
    defaultPP: 44.64,
    defaultWSP: 48,
    defaultMRP: 0,
    currentStock: 0,
    damagedStock: 0,
    createdAt: "2026-05-01T15:11:22.243Z",
    customUnits: [{ name: "Carton", multiplier: 10 }],
    cartonSize: 10,
    pricePerCarton: 480,
    pricePerPiece: 48,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254290329",
    name: "Mango Pops",
    sku: "COC-MP-524",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 168.75,
    defaultWSP: 180,
    defaultMRP: 5,
    currentStock: 7,
    damagedStock: 0,
    createdAt: "2026-05-01T15:11:30.866Z",
    customUnits: [{ name: "Carton", multiplier: 1 }],
    cartonSize: 1,
    pricePerCarton: 180,
    pricePerPiece: 180,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254334054",
    name: "Juicy Land Umbrella",
    sku: "COC-JLU-350",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 109.5,
    defaultWSP: 117,
    defaultMRP: 0,
    currentStock: 24,
    damagedStock: 0,
    createdAt: "2026-05-01T15:11:40.052Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    cartonSize: 6,
    pricePerCarton: 702,
    pricePerPiece: 117,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254376345",
    name: "Juicy Land Dinosaur",
    sku: "COC-JLD-902",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 109.5,
    defaultWSP: 117,
    defaultMRP: 0,
    currentStock: 21,
    damagedStock: 0,
    createdAt: "2026-05-01T15:11:46.551Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    cartonSize: 6,
    pricePerCarton: 702,
    pricePerPiece: 117,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254422621",
    name: "Choco Waffy 25pc",
    sku: "COC-CW2-983",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 187.5,
    defaultWSP: 200,
    defaultMRP: 10,
    currentStock: 30,
    damagedStock: 0,
    createdAt: "2026-05-01T15:11:51.698Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    cartonSize: 4,
    pricePerCarton: 800,
    pricePerPiece: 200,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254471002",
    name: "Mango Ice Lolly",
    sku: "COC-MIL-193",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 182.5,
    defaultWSP: 195,
    defaultMRP: 0,
    currentStock: 10,
    damagedStock: 0,
    createdAt: "2026-05-01T15:11:59.446Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    cartonSize: 4,
    pricePerCarton: 780,
    pricePerPiece: 195,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1783254524710",
    name: "Lychee Gel Jar 65psc",
    sku: "COC-LGJ6-393",
    company: "Cocola Food Products Ltd C Group",
    uomId: "uom-1783247549042",
    defaultPP: 91,
    defaultWSP: 98,
    defaultMRP: 0,
    currentStock: 1,
    damagedStock: 0,
    createdAt: "2026-05-01T15:12:12.620Z",
    customUnits: [{ name: "Carton", multiplier: 5 }],
    cartonSize: 5,
    pricePerCarton: 490,
    pricePerPiece: 98,
    primaryUnit: "Piece",
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784297523296",
    name: "Marks FCMP 1000gm Poly",
    sku: "ABU-MF1P-848",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:20:19.489Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    defaultPP: 856.21,
    defaultWSP: 883,
    defaultMRP: 950,
    currentStock: 23,
    cartonSize: 12,
    pricePerCarton: 10596,
    pricePerPiece: 883,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784297788297",
    name: "Marks FCMP 1000gm Tin",
    sku: "ABU-MF1T-367",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:20:24.654Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    defaultPP: 1056,
    defaultWSP: 1100,
    defaultMRP: 1300,
    currentStock: 6,
    cartonSize: 12,
    pricePerCarton: 13200,
    pricePerPiece: 1100,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784298492160",
    name: "Marks FCMP 500gm",
    sku: "ABU-MF5-971",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:20:35.795Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 430.53,
    defaultWSP: 444,
    defaultMRP: 480,
    currentStock: 0,
    cartonSize: 24,
    pricePerCarton: 10656,
    pricePerPiece: 444,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784298620609",
    name: "Marks FCMP 500gm with Sugar",
    sku: "ABU-MF5W-430",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:20:48.768Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    defaultPP: 435.53,
    defaultWSP: 449,
    defaultMRP: 480,
    currentStock: 409,
    cartonSize: 12,
    pricePerCarton: 5388,
    pricePerPiece: 449,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784307123505",
    name: "Marks FCMP 400gm",
    sku: "ABU-MF4-159",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:20:57.197Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 343.08,
    defaultWSP: 354,
    defaultMRP: 400,
    currentStock: 42,
    cartonSize: 24,
    pricePerCarton: 8496,
    pricePerPiece: 354,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784307262821",
    name: "Marks FCMP 200gm",
    sku: "ABU-MF2-386",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:21:04.095Z",
    customUnits: [{ name: "Carton", multiplier: 30 }],
    defaultPP: 182.3,
    defaultWSP: 188,
    defaultMRP: 205,
    currentStock: 218,
    cartonSize: 30,
    pricePerCarton: 5640,
    pricePerPiece: 188,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784307358053",
    name: "Marks FCMP 100gm",
    sku: "ABU-MF1-482",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:21:32.602Z",
    customUnits: [{ name: "Carton", multiplier: 60 }],
    defaultPP: 96,
    defaultWSP: 99,
    defaultMRP: 100,
    currentStock: 56,
    cartonSize: 60,
    pricePerCarton: 5940,
    pricePerPiece: 99,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784307958965",
    name: "Marks FCMP 50gm",
    sku: "ABU-MF5-522",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:21:38.681Z",
    customUnits: [{ name: "Carton", multiplier: 60 }],
    defaultPP: 50.43,
    defaultWSP: 52,
    defaultMRP: 60,
    currentStock: 72,
    cartonSize: 60,
    pricePerCarton: 3120,
    pricePerPiece: 52,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308030495",
    name: "Marks FCMP 75gm",
    sku: "ABU-MF7-170",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:21:44.042Z",
    customUnits: [{ name: "Carton", multiplier: 60 }],
    defaultPP: 69.09,
    defaultWSP: 71.25,
    defaultMRP: 80,
    currentStock: 18,
    cartonSize: 60,
    pricePerCarton: 4275,
    pricePerPiece: 71.25,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308142934",
    name: "Marks FCMP 8gm",
    sku: "ABU-MF8-695",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:21:50.555Z",
    customUnits: [{ name: "Carton", multiplier: 180 }],
    defaultPP: 7.78,
    defaultWSP: 8,
    defaultMRP: 10,
    currentStock: 804,
    cartonSize: 180,
    pricePerCarton: 1440,
    pricePerPiece: 8,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308206921",
    name: "Marks Young Star 400gm",
    sku: "ABU-MYS4-766",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:21:56.215Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 360,
    defaultWSP: 375,
    defaultMRP: 425,
    currentStock: 30,
    cartonSize: 24,
    pricePerCarton: 9000,
    pricePerPiece: 375,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308277260",
    name: "Marks Gold 400gm",
    sku: "ABU-MG4-635",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:22:01.343Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 360,
    defaultWSP: 375,
    defaultMRP: 425,
    currentStock: 6,
    cartonSize: 24,
    pricePerCarton: 9000,
    pricePerPiece: 375,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308335452",
    name: "Marks Diet 400gm",
    sku: "ABU-MD4-102",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:22:07.741Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 360,
    defaultWSP: 375,
    defaultMRP: 425,
    currentStock: 36,
    cartonSize: 24,
    pricePerCarton: 9000,
    pricePerPiece: 375,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308387668",
    name: "Marks Active School 400gm",
    sku: "ABU-MAS4-223",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:22:18.117Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 360,
    defaultWSP: 375,
    defaultMRP: 425,
    currentStock: 0,
    cartonSize: 24,
    pricePerCarton: 9000,
    pricePerPiece: 375,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308428710",
    name: "Marks Chocolate Active School 400gm",
    sku: "ABU-MCAS-808",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:22:25.549Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 360,
    defaultWSP: 375,
    defaultMRP: 425,
    currentStock: 6,
    cartonSize: 24,
    pricePerCarton: 9000,
    pricePerPiece: 375,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308502216",
    name: "Marks Diet Tin 400gm",
    sku: "ABU-MDT4-717",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:22:31.944Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    defaultPP: 1148,
    defaultWSP: 1200,
    defaultMRP: 1400,
    currentStock: 3,
    cartonSize: 12,
    pricePerCarton: 14400,
    pricePerPiece: 1200,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308703034",
    name: "Ama FCMP 2000gm",
    sku: "ABU-AF2-789",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:22:36.987Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    defaultPP: 1514.84,
    defaultWSP: 1562,
    defaultMRP: 1730,
    currentStock: 24,
    cartonSize: 6,
    pricePerCarton: 9372,
    pricePerPiece: 1562,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308769833",
    name: "Ama FCMP 1000gm",
    sku: "ABU-AF1-121",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:22:42.332Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    defaultPP: 762.27,
    defaultWSP: 786,
    defaultMRP: 870,
    currentStock: 15,
    cartonSize: 12,
    pricePerCarton: 9432,
    pricePerPiece: 786,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308831997",
    name: "Ama FCMP 500gm",
    sku: "ABU-AF5-172",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:22:48.039Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 391.81,
    defaultWSP: 404,
    defaultMRP: 450,
    currentStock: 40,
    cartonSize: 24,
    pricePerCarton: 9696,
    pricePerPiece: 404,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308923621",
    name: "Ama FCMP 200gm",
    sku: "ABU-AF2-596",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:22:54.278Z",
    customUnits: [{ name: "Carton", multiplier: 30 }],
    defaultPP: 159.05,
    defaultWSP: 165,
    defaultMRP: 190,
    currentStock: 75,
    cartonSize: 30,
    pricePerCarton: 4950,
    pricePerPiece: 165,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784308996705",
    name: "Ama FCMP 100gm",
    sku: "ABU-AF1-156",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:23:06.794Z",
    customUnits: [{ name: "Carton", multiplier: 60 }],
    defaultPP: 79.04,
    defaultWSP: 82,
    defaultMRP: 100,
    currentStock: 24,
    cartonSize: 60,
    pricePerCarton: 4920,
    pricePerPiece: 82,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784309093133",
    name: "Ama FCMP 50gm",
    sku: "ABU-AF5-136",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:23:16.978Z",
    customUnits: [{ name: "Carton", multiplier: 60 }],
    defaultPP: 41.46,
    defaultWSP: 43,
    defaultMRP: 50,
    currentStock: 75,
    cartonSize: 60,
    pricePerCarton: 2580,
    pricePerPiece: 43,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784309268051",
    name: "Ama FCMP 10gm",
    sku: "ABU-AF1-667",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:23:22.595Z",
    customUnits: [{ name: "Carton", multiplier: 180 }],
    defaultPP: 7.71,
    defaultWSP: 8,
    defaultMRP: 10,
    currentStock: 2976,
    cartonSize: 180,
    pricePerCarton: 1440,
    pricePerPiece: 8,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784349714138",
    name: "Ama Paper Cup 150ml",
    sku: "ABU-APC1-780",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:23:28.128Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 368.6,
    defaultWSP: 380,
    defaultMRP: 0,
    currentStock: 2,
    cartonSize: 24,
    pricePerCarton: 380,
    pricePerPiece: 15.83,
    primaryUnit: "Carton",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784349816077",
    name: "Ama Paper Cup 120ml",
    sku: "ABU-APC1-222",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:23:34.099Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 329.8,
    defaultWSP: 340,
    defaultMRP: 0,
    currentStock: 3,
    cartonSize: 24,
    pricePerCarton: 340,
    pricePerPiece: 14.17,
    primaryUnit: "Carton",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784350018364",
    name: "Ama Paper Cup 100ml",
    sku: "ABU-APC1-781",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:24:26.251Z",
    customUnits: [{ name: "Carton", multiplier: 24 }],
    defaultPP: 310.4,
    defaultWSP: 330,
    defaultMRP: 0,
    currentStock: 3,
    cartonSize: 24,
    pricePerCarton: 330,
    pricePerPiece: 13.75,
    primaryUnit: "Carton",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784350295577",
    name: "Ama Sugar Free Coffee 500gm",
    sku: "ABU-ASFC-609",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:24:45.162Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    defaultPP: 305.24,
    defaultWSP: 315,
    defaultMRP: 375,
    currentStock: 4,
    cartonSize: 12,
    pricePerCarton: 3780,
    pricePerPiece: 315,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784350683288",
    name: "Ama Sugar Free Coffee 15gm",
    sku: "ABU-ASFC-145",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:24:52.542Z",
    customUnits: [{ name: "Carton", multiplier: 576 }],
    defaultPP: 11.64,
    defaultWSP: 12,
    defaultMRP: 0,
    currentStock: 192,
    cartonSize: 576,
    pricePerCarton: 6912,
    pricePerPiece: 12,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784350976217",
    name: "Ama Coffeemix 1000gm",
    sku: "ABU-AC1-108",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:25:04.733Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    defaultPP: 416.5,
    defaultWSP: 430,
    defaultMRP: 500,
    currentStock: 20,
    cartonSize: 6,
    pricePerCarton: 2580,
    pricePerPiece: 430,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784351127672",
    name: "Ama Classic Coffee 0.75gm",
    sku: "ABU-ACC0-467",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:25:10.748Z",
    customUnits: [{ name: "Carton", multiplier: 1680 }],
    defaultPP: 2.4,
    defaultWSP: 2.5,
    defaultMRP: 3,
    currentStock: 5904,
    cartonSize: 1680,
    pricePerCarton: 4200,
    pricePerPiece: 2.5,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784351236848",
    name: "Ama Classic Coffee 1gm",
    sku: "ABU-ACC1-354",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:25:16.791Z",
    customUnits: [{ name: "Carton", multiplier: 960 }],
    defaultPP: 3.65,
    defaultWSP: 3.8,
    defaultMRP: 5,
    currentStock: 2210,
    cartonSize: 960,
    pricePerCarton: 3648,
    pricePerPiece: 3.8,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784351378539",
    name: "Ama Coffeemix Stick 14gm",
    sku: "ABU-ACS1-925",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:25:23.219Z",
    customUnits: [{ name: "Carton", multiplier: 288 }],
    defaultPP: 8.25,
    defaultWSP: 8.5,
    defaultMRP: 10,
    currentStock: 1224,
    cartonSize: 288,
    pricePerCarton: 2448,
    pricePerPiece: 8.5,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784351482121",
    name: "Aura Hot Chocolate 500gm",
    sku: "ABU-AHC5-761",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:25:28.526Z",
    customUnits: [{ name: "Carton", multiplier: 12 }],
    defaultPP: 208.25,
    defaultWSP: 215,
    defaultMRP: 260,
    currentStock: 4,
    cartonSize: 12,
    pricePerCarton: 2580,
    pricePerPiece: 215,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784351581568",
    name: "Seylon Masala Raw Tea 1000gm",
    sku: "ABU-SMRT-179",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:25:34.425Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    defaultPP: 300.1,
    defaultWSP: 310,
    defaultMRP: 370,
    currentStock: 8,
    cartonSize: 6,
    pricePerCarton: 1860,
    pricePerPiece: 310,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784525514428",
    name: "Seylon Tea 14gm",
    sku: "ABU-ST1-813",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:25:40.737Z",
    customUnits: [{ name: "Carton", multiplier: 400 }],
    defaultPP: 7.81,
    defaultWSP: 8.1,
    defaultMRP: 10,
    currentStock: 930,
    cartonSize: 400,
    pricePerCarton: 3240,
    pricePerPiece: 8.1,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784526297597",
    name: "Seylon Tea 50gm",
    sku: "ABU-ST5-936",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:25:46.571Z",
    customUnits: [{ name: "Carton", multiplier: 200 }],
    defaultPP: 22.8,
    defaultWSP: 23.5,
    defaultMRP: 30,
    currentStock: 550,
    cartonSize: 200,
    pricePerCarton: 4700,
    pricePerPiece: 23.5,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784526774396",
    name: "Seylon Tea 100gm",
    sku: "ABU-ST1-287",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:25:53.094Z",
    customUnits: [{ name: "Carton", multiplier: 100 }],
    defaultPP: 44.53,
    defaultWSP: 46,
    defaultMRP: 60,
    currentStock: 215,
    cartonSize: 100,
    pricePerCarton: 4600,
    pricePerPiece: 46,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784526942733",
    name: "Seylon Tea 200gm",
    sku: "ABU-ST2-201",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:26:03.562Z",
    customUnits: [{ name: "Carton", multiplier: 50 }],
    defaultPP: 89.1,
    defaultWSP: 92,
    defaultMRP: 120,
    currentStock: 213,
    cartonSize: 50,
    pricePerCarton: 4600,
    pricePerPiece: 92,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784527103450",
    name: "Seylon Tea 400gm",
    sku: "ABU-ST4-266",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:26:11.302Z",
    customUnits: [{ name: "Carton", multiplier: 50 }],
    defaultPP: 176.24,
    defaultWSP: 182,
    defaultMRP: 225,
    currentStock: 171,
    cartonSize: 50,
    pricePerCarton: 9100,
    pricePerPiece: 182,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784527266951",
    name: "Seylon PD Tea 500gm",
    sku: "ABU-SPT5-942",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:26:17.275Z",
    customUnits: [{ name: "Carton", multiplier: 40 }],
    defaultPP: 192.35,
    defaultWSP: 199,
    defaultMRP: 230,
    currentStock: 104,
    cartonSize: 40,
    pricePerCarton: 7960,
    pricePerPiece: 199,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784527335125",
    name: "Seylon Gold Tea 500gm",
    sku: "ABU-SGT5-894",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:26:23.749Z",
    customUnits: [{ name: "Carton", multiplier: 40 }],
    defaultPP: 201.2,
    defaultWSP: 208,
    defaultMRP: 240,
    currentStock: 85,
    cartonSize: 40,
    pricePerCarton: 8320,
    pricePerPiece: 208,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784527511122",
    name: "Seylon BOP Tea 500gm",
    sku: "ABU-SBT5-301",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:26:30.453Z",
    customUnits: [{ name: "Carton", multiplier: 40 }],
    defaultPP: 192.35,
    defaultWSP: 199,
    defaultMRP: 235,
    currentStock: 46,
    cartonSize: 40,
    pricePerCarton: 7960,
    pricePerPiece: 199,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784527643549",
    name: "Seylon Bag In Bag",
    sku: "ABU-SBIB-805",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:26:41.109Z",
    customUnits: [{ name: "Carton", multiplier: 40 }],
    defaultPP: 57.7,
    defaultWSP: 60,
    defaultMRP: 75,
    currentStock: 44,
    cartonSize: 40,
    pricePerCarton: 2400,
    pricePerPiece: 60,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784527759308",
    name: "Seylon Saver Pack",
    sku: "ABU-SSP-775",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:26:47.255Z",
    customUnits: [{ name: "Carton", multiplier: 4 }],
    defaultPP: 535.94,
    defaultWSP: 560,
    defaultMRP: 600,
    currentStock: 4,
    cartonSize: 4,
    pricePerCarton: 2240,
    pricePerPiece: 560,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784527856144",
    name: "Seylon Pyramid Gold",
    sku: "ABU-SPG-362",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:26:52.725Z",
    customUnits: [{ name: "Carton", multiplier: 40 }],
    defaultPP: 68.6,
    defaultWSP: 71,
    defaultMRP: 90,
    currentStock: 53,
    cartonSize: 40,
    pricePerCarton: 2840,
    pricePerPiece: 71,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784527988159",
    name: "Seylon Green Tea",
    sku: "ABU-SGT-375",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:27:21.519Z",
    customUnits: [{ name: "Carton", multiplier: 40 }],
    defaultPP: 82.15,
    defaultWSP: 85,
    defaultMRP: 120,
    currentStock: 146,
    cartonSize: 40,
    pricePerCarton: 3400,
    pricePerPiece: 85,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784528269919",
    name: "Ama UHT Milk 1000ml",
    sku: "ABU-AUM1-577",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:27:27.036Z",
    customUnits: [{ name: "Carton", multiplier: 8 }],
    defaultPP: 103.4,
    defaultWSP: 110,
    defaultMRP: 130,
    currentStock: 145,
    cartonSize: 8,
    pricePerCarton: 880,
    pricePerPiece: 110,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784635440602",
    name: "Seylon Milk Tea 15gm",
    sku: "ABU-SMT1-243",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:27:32.631Z",
    customUnits: [{ name: "Carton", multiplier: 288 }],
    defaultPP: 7.52,
    defaultWSP: 7.75,
    defaultMRP: 10,
    currentStock: 1056,
    cartonSize: 288,
    pricePerCarton: 2232,
    pricePerPiece: 7.75,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784635627096",
    name: "Seylon Milk Tea 1000gm",
    sku: "ABU-SMT1-207",
    company: "Abul Khair Milk Products LTD Sky Group",
    createdAt: "2026-05-01T07:27:38.906Z",
    customUnits: [{ name: "Carton", multiplier: 6 }],
    defaultPP: 387.4,
    defaultWSP: 400,
    defaultMRP: 470,
    currentStock: 39,
    cartonSize: 6,
    pricePerCarton: 2400,
    pricePerPiece: 400,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  },
  {
    id: "prod-1784901919211",
    name: "Super Milk 5gm New",
    sku: "PRA-SM5-216",
    company: "Pran Dairy Milkman Group",
    createdAt: "2026-05-01T07:27:44.577Z",
    customUnits: [{ name: "Carton", multiplier: 480 }],
    defaultPP: 3.85,
    defaultWSP: 4.04,
    defaultMRP: 5,
    currentStock: 0,
    cartonSize: 480,
    pricePerCarton: 1939.2,
    pricePerPiece: 4.04,
    primaryUnit: "Piece",
    damagedStock: 0,
    stockAlertThreshold: 50
  }
];

export const INITIAL_ATTRIBUTES: ProductAttribute[] = [
  { id: 'attr-1', name: 'Pack: Case of 24', type: 'Packaging', value: 'Case of 24', status: 'Active' },
  { id: 'attr-2', name: 'Pack: Carton of 48', type: 'Packaging', value: 'Carton of 48', status: 'Active' },
  { id: 'attr-3', name: 'Flavor: Mango', type: 'Flavor', value: 'Mango', status: 'Active' },
  { id: 'attr-4', name: 'Flavor: Chocolate', type: 'Flavor', value: 'Chocolate', status: 'Active' },
  { id: 'attr-5', name: 'Weight: 250ml', type: 'Weight', value: '250ml', status: 'Active' },
];

export const INITIAL_CHALLAN_ITEMS: ChallanItem[] = [];

export const INITIAL_PROCUREMENTS: Procurement[] = [];

export const INITIAL_STOCK_ADJUSTMENTS: StockAdjustment[] = [];

export const INITIAL_EXP_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-1', name: 'SR Salaries & Commission', description: 'Monthly fixed salary and performance commissions paid to SRs' },
  { id: 'cat-2', name: 'Carriage & Transport Fuel', description: 'Fuel and tolls for supplying goods to retail markets' },
  { id: 'cat-3', name: 'Warehouse Rent & Electric', description: 'Utility bills and floor space rent for storing brand stock' },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const INITIAL_COMPANIES: CompanyBrand[] = [
  {
    id: "comp-1783247007277",
    name: "Pran Dairy Milkman Group",
    contactPerson: "Shawon Vai",
    phone: "01704141903",
    address: "Dhaka",
  },
  {
    id: "comp-1783247065744",
    name: "Abul Khair Milk Products LTD Sky Group",
    contactPerson: "Khaled Vai",
    phone: "01926670833",
    address: "Dhaka",
  },
  {
    id: "comp-1783247144876",
    name: "Cocola Food Products Ltd C Group",
    contactPerson: "Toriqul Vai",
    phone: "01762750770",
    address: "Dhaka",
  },
  {
    id: "comp-1783247199503",
    name: "Olympic Industries LTD Jupiter Group",
    contactPerson: "Sadik Vai",
    phone: "01912131202",
    address: "Dhaka",
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Milk & Dairy', description: 'Milk, UHT, Ghee & Milk Powder' },
  { id: 'cat-2', name: 'Biscuit & Wafer', description: 'Sweet, savory, cookies & wafers' },
  { id: 'cat-3', name: 'Noodles & Snacks', description: 'Instant noodles, cup noodles & snacks' },
  { id: 'cat-4', name: 'Tea & Coffee', description: 'Premium tea, coffee & beverage mixes' }
];

export const INITIAL_UNITS: UnitOfMeasure[] = [
  { id: "uom-1784297360115", name: "Cartoon", symbol: "CTN" },
  { id: "uom-1784297380091", name: "Piece",   symbol: "PCS" },
  { id: "uom-1784349585052", name: "Dorzen",  symbol: "DZ"  },
];

export const INITIAL_GODOWNS: Godown[] = [
  { id: 'g-1', name: 'Tongi Mollabari Central Godown', location: 'Tongi Mollabari, Gazipur', isDamageGodown: false },
  { id: 'g-damage', name: 'Damage & Return Godown', location: 'Section B, Tongi Hub', isDamageGodown: true }
];

export const INITIAL_ROUTES: Route[] = [
  { id: "route-1783254698665", name: "Badam Road", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783254726183", name: "Boro Dewra", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783254782749", name: "Mill Gate Kolabaghan", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783254804964", name: "College Road", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783254830610", name: "Saffiuddin Academy", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783254885918", name: "Mokter Bari Road", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783254916467", name: "Molla Bazar", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783254937121", name: "Shing Bari", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783254979908", name: "Kha Para Road-1", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783254996008", name: "Kha Para Road-2", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783255024267", name: "Ershadnagar Ledu Molla", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783255047544", name: "Erhsadnagar", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783255073055", name: "Majar Bornomala", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783255097268", name: "Alom Market Cherag Ali", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783255122843", name: "Shomaj Kallan Cherag Ali", area: "Tongi", territory: "Gazipur" },
  { id: "route-1783255151429", name: "Bornomala", area: "Tongi", territory: "Gazipur" },
  { id: "route-1784897391723", name: "Ready Sales", area: "Tongi", territory: "Gazipur", assignedSRId: "sr-1783255426553" }
];

export interface Claim {
  id: string;
  claimDate: string;
  companyId: string;
  companyName: string;
  srId: string;
  srName: string;
  productId: string;
  productName: string;
  qty: number;
  reason: string;
  notes: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  type?: 'Claim' | 'Display';
  claimValue?: number;
}

export interface ClaimSettlement {
  id: string;
  settlementDate: string;
  monthKey: string;
  companyId: string;
  companyName: string;
  amount: number;
  paymentMode: string;
  referenceNo: string;
  notes: string;
  recordedAt: string;
}

