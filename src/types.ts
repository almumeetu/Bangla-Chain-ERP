// Types & Mock Data for FMCG Dealer (Diller) Management System

export interface SR {
  id: string;
  name: string;
  phone: string;
}

export interface Customer {
  id: string;
  name: string;
  market: string;
  phone: string;
  assignedSR: string; // e.g., "Rakib", "Rahman", "Rahim"
}

export interface DeliveryMan {
  id: string;
  name: string;
  vehicle: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  company: 'Pran' | 'Olympic' | 'Haque'; // Brand / Manufacturer Company
  defaultPP: number;  // Import Price / Purchase Price in BDT
  defaultMRP: number; // Retail Market Price in BDT
  defaultWSP: number; // Wholesale Supply Price in BDT
  currentStock: number;
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
  attribute: string; 
  qty: number;
  bonusQty: number;
  totalQty: number;  // qty + bonusQty
  rate: number;      // Wholesale Supply Price
  totalAmount: number; // rate * qty
  srName: string; // Supplied by SR
  customerNames: string[]; // Mapped to Shops
  deliveryManName: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Returned';
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
  supplierName: 'Pran' | 'Olympic' | 'Haque'; // Company supplied from
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
  { id: 'sr-1', name: 'Rakib', phone: '01711223344' },
  { id: 'sr-2', name: 'Rahman', phone: '01811223344' },
  { id: 'sr-3', name: 'Rahim', phone: '01911223344' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  // Rakib's Shops
  { id: 'cust-1', name: 'Shop-1 (Bismillah Store)', market: 'Elephant Road Market', phone: '01722998877', assignedSR: 'Rakib' },
  { id: 'cust-2', name: 'Shop-2 (Maa General Store)', market: 'Chawkbazar Lane', phone: '01822998877', assignedSR: 'Rakib' },
  { id: 'cust-3', name: 'Shop-3 (New Quality Foods)', market: 'Sadarghat Road', phone: '01922998877', assignedSR: 'Rakib' },
  
  // Rahman's Shops
  { id: 'cust-6', name: 'Shop-6 (Chowdhury Mart)', market: 'Bogura Sadar Market', phone: '01522998877', assignedSR: 'Rahman' },
  { id: 'cust-7', name: 'Shop-7 (Popular Store)', market: 'Zilla School Crossing', phone: '01622998877', assignedSR: 'Rahman' },
  
  // Rahim's Shops
  { id: 'cust-4', name: 'Shop-4 (Rahman Brother Grocers)', market: 'Terribazar Alley', phone: '01622998899', assignedSR: 'Rahim' },
  { id: 'cust-5', name: 'Shop-5 (Al-Madina Groceries)', market: 'Sarker Tower Bazar', phone: '01622998811', assignedSR: 'Rahim' },
];

export const INITIAL_DELIVERY_MEN: DeliveryMan[] = [
  { id: 'dm-1', name: 'Abul Kalam', vehicle: 'PickUp Truck (Metro-Tha-11-2044)' },
  { id: 'dm-2', name: 'Sujon Mia', vehicle: 'Covered Van (Metro-Cha-54-9988)' },
  { id: 'dm-3', name: 'Khorshed Alam', vehicle: 'Three Wheeler Cargo (Dhaka-H-12-3456)' },
];

// Products categorized by Company: Pran, Olympic, Haque
export const INITIAL_PRODUCTS: Product[] = [
  // PRAN Products
  { id: 'prod-1', name: 'Pran Mango Juice 250ml', sku: 'PRN-MJ-250', company: 'Pran', defaultPP: 22, defaultMRP: 30, defaultWSP: 25, currentStock: 2500 },
  { id: 'prod-2', name: 'Pran UP Lemon Drink 250ml', sku: 'PRN-UP-250', company: 'Pran', defaultPP: 21, defaultMRP: 30, defaultWSP: 24, currentStock: 1800 },
  { id: 'prod-3', name: 'Pran Premium Toast Biscuit 350g', sku: 'PRN-TB-350', company: 'Pran', defaultPP: 55, defaultMRP: 80, defaultWSP: 65, currentStock: 1200 },

  // OLYMPIC Products
  { id: 'prod-4', name: 'Olympic Energy Plus Biscuit 60g', sku: 'OLY-EP-60', company: 'Olympic', defaultPP: 8, defaultMRP: 15, defaultWSP: 10, currentStock: 5000 },
  { id: 'prod-5', name: 'Olympic Lexus Vegetable Cracker', sku: 'OLY-LX-120', company: 'Olympic', defaultPP: 32, defaultMRP: 50, defaultWSP: 40, currentStock: 3200 },

  // HAQUE Products
  { id: 'prod-6', name: 'Haque Mr. Cookie Biscuit 150g', sku: 'HAQ-MC-150', company: 'Haque', defaultPP: 25, defaultMRP: 40, defaultWSP: 32, currentStock: 2100 },
  { id: 'prod-7', name: 'Haque Bourbon Chocolate Biscuit', sku: 'HAQ-BB-100', company: 'Haque', defaultPP: 15, defaultMRP: 25, defaultWSP: 19, currentStock: 1500 },
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
    attribute: 'Pack: Case of 24, Flavor: Mango',
    qty: 240, // 10 cases
    bonusQty: 12,
    totalQty: 252,
    rate: 25,
    totalAmount: 6000,
    srName: 'Rakib',
    customerNames: ['Shop-1 (Bismillah Store)', 'Shop-2 (Maa General Store)'],
    deliveryManName: 'Abul Kalam',
    status: 'Delivered',
  },
  {
    id: 'ch-2',
    productName: 'Olympic Lexus Vegetable Cracker',
    attribute: 'Pack: Carton of 48',
    qty: 96, // 2 cartons
    bonusQty: 4,
    totalQty: 100,
    rate: 40,
    totalAmount: 3840,
    srName: 'Rahman',
    customerNames: ['Shop-6 (Chowdhury Mart)'],
    deliveryManName: 'Sujon Mia',
    status: 'Shipped',
  },
  {
    id: 'ch-3',
    productName: 'Haque Mr. Cookie Biscuit 150g',
    attribute: 'Pack: Case of 24',
    qty: 480, // 20 cases
    bonusQty: 24,
    totalQty: 504,
    rate: 32,
    totalAmount: 15360,
    srName: 'Rahim',
    customerNames: ['Shop-4 (Rahman Brother Grocers)', 'Shop-5 (Al-Madina Groceries)'],
    deliveryManName: 'Khorshed Alam',
    status: 'Pending',
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
