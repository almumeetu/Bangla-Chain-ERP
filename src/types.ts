// Types & Mock Data for Enterprise Supply Chain & Inventory ERP

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
  defaultPP: number;  // Purchase Price in BDT
  defaultMRP: number; // Retail Price in BDT
  defaultWSP: number; // Wholesale Price in BDT
  currentStock: number;
}

export interface ProductAttribute {
  id: string;
  name: string;      // e.g., "Size: 42", "Color: Black"
  type: string;      // "Size" | "Color" | "Weight"
  value: string;     // e.g., "42", "Black", "1.2kg"
  status: 'Active' | 'Inactive';
}

export interface ChallanItem {
  id: string;
  productName: string;
  attribute: string; // e.g. "Size 10, Black"
  qty: number;
  bonusQty: number;
  totalQty: number;  // auto-calculated: qty + bonusQty
  rate: number;      // Wholesale Price per product
  totalAmount: number; // rate * qty
  srName: string;
  customerNames: string[]; // multi-customer pill badge support
  deliveryManName: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Returned';
}

export interface ProcurementItem {
  id: string;
  productId: string;
  productName: string;
  purchasePrice: number;
  mrp: number;
  wsp: number;
  qty: number;
  bonusQty: number;
  discountType: 'Flat' | 'Percentage';
  discountValue: number;
  totalPrice: number; // Auto calculated
}

export interface Procurement {
  id: string;
  supplierName: string;
  procurementName: string;
  invoiceRef: string;
  invoiceDate: string;
  deliveryDate: string;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  additionalCost: number;
  items: ProcurementItem[];
  globalTotal: number; // Calculated sum of items totalPrice + additionalCost
  createdAt: string; // ISO string
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  attributeValue: string;
  oldQty: number;
  newQty: number;
  qtyChanged: number; // positive or negative
  adjustedBy: string;
  reason: string;
  date: string; // ISO string
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

// Initial Mock Data (Bangladeshi business context)
export const INITIAL_SRS: SR[] = [
  { id: 'sr-1', name: 'Mizanur Rahman', phone: '01711223344' },
  { id: 'sr-2', name: 'Arif Islam', phone: '01811223344' },
  { id: 'sr-3', name: 'Kamrul Hassan', phone: '01911223344' },
  { id: 'sr-4', name: 'Tanvir Ahmed', phone: '01511223344' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Bismillah Shoes Market', market: 'Elephant Road, Dhaka', phone: '01722998877' },
  { id: 'cust-2', name: 'Al-Madina Department Store', market: 'Chawkbazar, Dhaka', phone: '01822998877' },
  { id: 'cust-3', name: 'New Quality Footwear', market: 'Sadarghat, Dhaka', phone: '01922998877' },
  { id: 'cust-4', name: 'Rahman Brother Traders', market: 'Zilla School Road, Bogura', phone: '01522998877' },
  { id: 'cust-5', name: 'Maa Enterprise', market: 'Terribazar, Chattogram', phone: '01622998877' },
];

export const INITIAL_DELIVERY_MEN: DeliveryMan[] = [
  { id: 'dm-1', name: 'Abul Kalam', vehicle: 'PickUp Truck (Metro-Tha-11-2044)' },
  { id: 'dm-2', name: 'Sujon Mia', vehicle: 'Covered Van (Metro-Cha-54-9988)' },
  { id: 'dm-3', name: 'Khorshed Alam', vehicle: 'Three Wheeler Cargo (Dhaka-H-12-3456)' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Sandal Apex 12345', sku: 'APX-S-12345', defaultPP: 450, defaultMRP: 850, defaultWSP: 650, currentStock: 1250 },
  { id: 'prod-2', name: 'Lotto Sports Runner X', sku: 'LOT-R-10022', defaultPP: 1200, defaultMRP: 2200, defaultWSP: 1750, currentStock: 480 },
  { id: 'prod-3', name: 'Bata Classic Leather Belt', sku: 'BAT-B-998', defaultPP: 300, defaultMRP: 600, defaultWSP: 450, currentStock: 900 },
  { id: 'prod-4', name: 'Sponge Sandal Star-20', sku: 'ST-SS-20', defaultPP: 90, defaultMRP: 180, defaultWSP: 130, currentStock: 3500 },
  { id: 'prod-5', name: 'Ladies Comfort Flat 44', sku: 'CMF-FL-44', defaultPP: 250, defaultMRP: 499, defaultWSP: 360, currentStock: 150 },
  { id: 'prod-6', name: 'Kids School Shoe Active', sku: 'KID-SCH-01', defaultPP: 400, defaultMRP: 750, defaultWSP: 550, currentStock: 620 },
];

export const INITIAL_ATTRIBUTES: ProductAttribute[] = [
  { id: 'attr-1', name: 'Size: 42', type: 'Size', value: '42', status: 'Active' },
  { id: 'attr-2', name: 'Size: 43', type: 'Size', value: '43', status: 'Active' },
  { id: 'attr-3', name: 'Color: Jet Black', type: 'Color', value: 'Jet Black', status: 'Active' },
  { id: 'attr-4', name: 'Color: Chocolate Brown', type: 'Color', value: 'Chocolate Brown', status: 'Active' },
  { id: 'attr-5', name: 'Weight: Light (250g)', type: 'Weight', value: 'Light (250g)', status: 'Active' },
  { id: 'attr-6', name: 'Size: 39', type: 'Size', value: '39', status: 'Inactive' },
];

export const INITIAL_CHALLAN_ITEMS: ChallanItem[] = [
  {
    id: 'ch-1',
    productName: 'Sandal Apex 12345',
    attribute: 'Size: 42, Color: Jet Black',
    qty: 100,
    bonusQty: 5,
    totalQty: 105,
    rate: 650,
    totalAmount: 65000,
    srName: 'Mizanur Rahman',
    customerNames: ['Bismillah Shoes Market', 'Al-Madina Department Store'],
    deliveryManName: 'Abul Kalam',
    status: 'Delivered',
  },
  {
    id: 'ch-2',
    productName: 'Lotto Sports Runner X',
    attribute: 'Size: 43, Color: Jet Black',
    qty: 30,
    bonusQty: 1,
    totalQty: 31,
    rate: 1750,
    totalAmount: 52500,
    srName: 'Arif Islam',
    customerNames: ['New Quality Footwear'],
    deliveryManName: 'Sujon Mia',
    status: 'Shipped',
  },
  {
    id: 'ch-3',
    productName: 'Sponge Sandal Star-20',
    attribute: 'Size: 42',
    qty: 500,
    bonusQty: 25,
    totalQty: 525,
    rate: 130,
    totalAmount: 65000,
    srName: 'Kamrul Hassan',
    customerNames: ['Rahman Brother Traders', 'Maa Enterprise', 'Bismillah Shoes Market'],
    deliveryManName: 'Khorshed Alam',
    status: 'Pending',
  },
  {
    id: 'ch-4',
    productName: 'Bata Classic Leather Belt',
    attribute: 'Color: Chocolate Brown',
    qty: 50,
    bonusQty: 0,
    totalQty: 50,
    rate: 450,
    totalAmount: 22500,
    srName: 'Tanvir Ahmed',
    customerNames: ['Maa Enterprise'],
    deliveryManName: 'Abul Kalam',
    status: 'Delivered',
  },
  {
    id: 'ch-5',
    productName: 'Kids School Shoe Active',
    attribute: 'Size: 42, Color: Jet Black',
    qty: 40,
    bonusQty: 2,
    totalQty: 42,
    rate: 550,
    totalAmount: 22000,
    srName: 'Mizanur Rahman',
    customerNames: ['Al-Madina Department Store'],
    deliveryManName: 'Sujon Mia',
    status: 'Returned',
  }
];

export const INITIAL_PROCUREMENTS: Procurement[] = [
  {
    id: 'proc-1',
    supplierName: 'Apex Footwear Ltd.',
    procurementName: 'Apex Sandal Eid Bulk Supply',
    invoiceRef: 'APX-2026-INV-509',
    invoiceDate: '2026-06-10',
    deliveryDate: '2026-06-15',
    paymentStatus: 'Paid',
    additionalCost: 3500,
    items: [
      {
        id: 'pi-1',
        productId: 'prod-1',
        productName: 'Sandal Apex 12345',
        purchasePrice: 450,
        mrp: 850,
        wsp: 650,
        qty: 500,
        bonusQty: 25,
        discountType: 'Percentage',
        discountValue: 5, // 5% discount
        totalPrice: 213750, // (450 * 500) * 0.95
      }
    ],
    globalTotal: 217250, // 213750 + 3500
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'proc-2',
    supplierName: 'Lotto Bangladesh Ltd.',
    procurementName: 'Lotto Runner Monsoon Procurement',
    invoiceRef: 'LOT-99827-26',
    invoiceDate: '2026-06-20',
    deliveryDate: '2026-06-24',
    paymentStatus: 'Partial',
    additionalCost: 5000,
    items: [
      {
        id: 'pi-2',
        productId: 'prod-2',
        productName: 'Lotto Sports Runner X',
        purchasePrice: 1200,
        mrp: 2200,
        wsp: 1750,
        qty: 150,
        bonusQty: 5,
        discountType: 'Flat',
        discountValue: 2000, // Flat discount BDT 2000
        totalPrice: 178000, // (1200 * 150) - 2000
      }
    ],
    globalTotal: 183000, // 178000 + 5000
    createdAt: '2026-06-20T14:30:00Z',
  }
];

export const INITIAL_STOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj-1',
    productId: 'prod-1',
    productName: 'Sandal Apex 12345',
    attributeValue: 'Size: 42',
    oldQty: 1200,
    newQty: 1250,
    qtyChanged: 50,
    adjustedBy: 'Admin (Muin)',
    reason: 'Physical stock count correction (found extra box in shelf C)',
    date: '2026-06-22T11:45:00Z',
  },
  {
    id: 'adj-2',
    productId: 'prod-3',
    productName: 'Bata Classic Leather Belt',
    attributeValue: 'Color: Chocolate Brown',
    oldQty: 920,
    newQty: 900,
    qtyChanged: -20,
    adjustedBy: 'Admin (Muin)',
    reason: 'Water damage during cleaning',
    date: '2026-06-24T09:15:00Z',
  }
];

export const INITIAL_EXP_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-1', name: 'Office Rent & Utility', description: 'Monthly warehouse and head office rent, electricity, water' },
  { id: 'cat-2', name: 'Delivery Van Fuel', description: 'Octane / Diesel and toll expenses for delivery trucks' },
  { id: 'cat-3', name: 'Staff Salary & Allowance', description: 'Salaray for showroom, warehouse workers, and SR commissions' },
  { id: 'cat-4', name: 'Entertainment & Client Lunch', description: 'Tea, biscuits, lunch with wholesale buyers' },
  { id: 'cat-5', name: 'Marketing & Poster Print', description: 'Leaflets, banners in local shoe market' },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    categoryId: 'cat-2',
    categoryName: 'Delivery Van Fuel',
    amount: 12000,
    expenseDate: '2026-06-18',
    notes: 'Fuel voucher for PickUp Truck (Metro-Tha-11-2044) for 5 roundtrips to Elephant Road',
    paidTo: 'Kader Petrol Pump, Tejgaon',
  },
  {
    id: 'exp-2',
    categoryId: 'cat-4',
    categoryName: 'Entertainment & Client Lunch',
    amount: 3500,
    expenseDate: '2026-06-21',
    notes: 'Lunch at Star Kabab for Elephant Road shop owners',
    paidTo: 'Star Kabab & Restaurant',
  },
  {
    id: 'exp-3',
    categoryId: 'cat-1',
    categoryName: 'Office Rent & Utility',
    amount: 35000,
    expenseDate: '2026-06-05',
    notes: 'Warehouse space B-2 electricity bill & floor rent portion',
    paidTo: 'Haji Shafiul Alam (Landlord)',
  }
];
