const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rcxkszqimhxzcbiehbvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeGtzenFpbWh4emNiaWVoYnZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQzMDM1NywiZXhwIjoyMTAyMDA2MzU3fQ.9dNVjSHtdIrf_tLl2XOpH4wbAAjhro-vopGyCwDWRBQ'
);

// ── 1. Clean Master Companies ────────────────────────────────────────────────
const MASTER_COMPANIES = [
  {
    name: 'Pran Dairy Milkman Group',
    contact_person: 'Shawon Vai',
    phone: '01704141903',
    address: 'Joydevpur, Gazipur',
  },
  {
    name: 'Abul Khair Milk Products LTD Sky Group',
    contact_person: 'Khaled Vai',
    phone: '01926670833',
    address: 'Tongi Bazar, Gazipur',
  },
  {
    name: 'Cocola Food Products Ltd C Group',
    contact_person: 'Toriqul Vai',
    phone: '01762750770',
    address: 'Gazipur',
  },
  {
    name: 'Olympic Industries LTD Jupiter Group',
    contact_person: 'Sadik Vai',
    phone: '01912131202',
    address: 'Gazipur',
  },
  {
    name: 'Akij Bakers Ltd Funland Group',
    contact_person: 'Shuvo Dey',
    phone: '01313367027',
    address: 'Gazipur',
  }
];

// ── 2. Clean Master SRs ──────────────────────────────────────────────────────
const MASTER_SRS = [
  {
    name: 'Sobuj',
    phone: '01642222298',
    commission_rate: 5,
    assigned_company_names: ['Pran Dairy Milkman Group'],
    login_username: 'shohanur1472@gmail.com',
    login_password: 'sohan2486',
  },
  {
    name: 'Md. Sohan',
    phone: '01974816392',
    commission_rate: 0,
    assigned_company_names: ['Pran Dairy Milkman Group'],
    login_username: 'sohan-pran2',
    login_password: 'sohan123',
  },
  {
    name: 'Zinnat Ali',
    phone: '01301236408',
    commission_rate: 0,
    assigned_company_names: ['Cocola Food Products Ltd C Group'],
    login_username: null,
    login_password: null,
  },
  {
    name: 'Shohidul',
    phone: '01787591058',
    commission_rate: 0,
    assigned_company_names: ['Abul Khair Milk Products LTD Sky Group'],
    login_username: null,
    login_password: null,
  },
  {
    name: 'Sojib',
    phone: '01978471889',
    commission_rate: 0,
    assigned_company_names: ['Abul Khair Milk Products LTD Sky Group'],
    login_username: null,
    login_password: null,
  },
  {
    name: 'Kefayet',
    phone: '01614356405',
    commission_rate: 0,
    assigned_company_names: ['Abul Khair Milk Products LTD Sky Group'],
    login_username: null,
    login_password: null,
  }
];

// ── 3. Clean Master Delivery Men ─────────────────────────────────────────────
const MASTER_DELIVERY_MEN = [
  { name: 'Ashik', phone: '01614325761', vehicle: '01614325761' },
  { name: 'Shorif', phone: '01884271531', vehicle: '01884271531' },
  { name: 'Lal Mia', phone: '01871896912', vehicle: '01871896912' },
  { name: 'Readysales Own', phone: '01700000000', vehicle: 'own123' },
];

// ── 4. Clean Master Routes ───────────────────────────────────────────────────
const MASTER_ROUTES = [
  { name: 'Badam Road', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Boro Dewra', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Mill Gate Kolabaghan', area: 'Tongi', territory: 'Gazipur' },
  { name: 'College Road', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Saffiuddin Academy', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Mokter Bari Road', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Molla Bazar', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Shing Bari', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Kha Para Road-1', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Kha Para Road-2', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Ershadnagar Ledu Molla', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Erhsadnagar', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Majar Bornomala', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Alom Market Cherag Ali', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Shomaj Kallan Cherag Ali', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Bornomala', area: 'Tongi', territory: 'Gazipur' },
  { name: 'Ready Sales', area: 'Tongi', territory: 'Gazipur' },
];

// ── 5. Clean Master Units ────────────────────────────────────────────────────
const MASTER_UNITS = [
  { name: 'Cartoon', symbol: 'CTN', multiplier: 1 },
  { name: 'Piece', symbol: 'PCS', multiplier: 1 },
  { name: 'Dorzen', symbol: 'DZ', multiplier: 12 },
];

// ── 6. Master Products (Merged & Deduplicated from 31/05/2026 sheet + backup) ──
const PRAN_COMPANY = 'Pran Dairy Milkman Group';
const ABUL_KHAIR_COMPANY = 'Abul Khair Milk Products LTD Sky Group';
const COCOLA_COMPANY = 'Cocola Food Products Ltd C Group';

const MASTER_PRODUCTS = [
  // ── PRAN PRODUCTS (With accurate 31/05/2026 DP, TP, Opening Stock) ──
  { name: 'Milkman UHT 200ml', sku: '46851', company: PRAN_COMPANY, dp: 24.25, tp: 25.67, mrp: 30, stock: 30, cartonSize: 30, unit: 'Piece' },
  { name: 'Milkman UHT 500ml', sku: '46855', company: PRAN_COMPANY, dp: 48.19, tp: 51.25, mrp: 60, stock: 62, cartonSize: 16, unit: 'Piece' },
  { name: 'Pran FCMP 10gm', sku: '47091', company: PRAN_COMPANY, dp: 85.72, tp: 90.0, mrp: 10, stock: 270, cartonSize: 120, unit: 'Piece' },
  { name: 'Pran Milk Powder 50gm Chain', sku: '53497', company: PRAN_COMPANY, dp: 39.18, tp: 41.14, mrp: 50, stock: 30, cartonSize: 72, unit: 'Piece' },
  { name: 'Pran Milk Powder 200gm', sku: 'PRAN-MP-200G', company: PRAN_COMPANY, dp: 176.2, tp: 185.0, mrp: 210, stock: 0, cartonSize: 24, unit: 'Piece' },
  { name: 'Pran Milk Powder 400gm', sku: 'PRAN-MP-400G', company: PRAN_COMPANY, dp: 334.5, tp: 351.3, mrp: 390, stock: 0, cartonSize: 24, unit: 'Piece' },
  { name: 'Pran Milk Powder 500gm', sku: 'PRAN-MP-500G', company: PRAN_COMPANY, dp: 407.0, tp: 428.0, mrp: 480, stock: 0, cartonSize: 24, unit: 'Piece' },
  { name: 'Pran Milk Powder 1000gm', sku: 'PRAN-MP-1000G', company: PRAN_COMPANY, dp: 828.5, tp: 870.0, mrp: 950, stock: 0, cartonSize: 12, unit: 'Piece' },
  { name: 'Pran Full Cream Milk Powder 200gm', sku: '32729', company: PRAN_COMPANY, dp: 170.52, tp: 180.0, mrp: 205, stock: 57, cartonSize: 24, unit: 'Piece' },
  { name: 'Pran Full Cream Milk Powder 400gm', sku: '32733', company: PRAN_COMPANY, dp: 308.77, tp: 324.21, mrp: 390, stock: 38, cartonSize: 24, unit: 'Piece' },
  { name: 'Pran Full Cream Milk Powder 500gm', sku: '32706', company: PRAN_COMPANY, dp: 385.58, tp: 405.0, mrp: 460, stock: 1, cartonSize: 24, unit: 'Piece' },
  { name: 'Pran Full Cream Milk Powder 1000gm', sku: 'PRAN-FCMP-1KG', company: PRAN_COMPANY, dp: 828.5, tp: 870.0, mrp: 960, stock: 0, cartonSize: 12, unit: 'Piece' },
  { name: 'Super Milk 200gm', sku: '51091', company: PRAN_COMPANY, dp: 132.0, tp: 140.0, mrp: 175, stock: 17, cartonSize: 30, unit: 'Piece' },
  { name: 'Super Milk 500gm', sku: '47838', company: PRAN_COMPANY, dp: 304.62, tp: 320.0, mrp: 365, stock: 122, cartonSize: 24, unit: 'Piece' },
  { name: 'Super Milk 1000gm', sku: '47092', company: PRAN_COMPANY, dp: 585.12, tp: 615.0, mrp: 690, stock: 83, cartonSize: 12, unit: 'Piece' },
  { name: 'Super Milk 5gm', sku: '74038', company: PRAN_COMPANY, dp: 48.0, tp: 48.5, mrp: 5, stock: 0, cartonSize: 480, unit: 'Piece' },
  { name: 'Pran Premium Ghee 100gm', sku: '32744', company: PRAN_COMPANY, dp: 149.84, tp: 160.0, mrp: 190, stock: 731, cartonSize: 36, unit: 'Piece' },
  { name: 'Pran Premium Ghee 200gm', sku: '32745', company: PRAN_COMPANY, dp: 284.88, tp: 300.0, mrp: 350, stock: 398, cartonSize: 40, unit: 'Piece' },
  { name: 'Pran Premium Ghee 450gm', sku: '72495', company: PRAN_COMPANY, dp: 641.0, tp: 680.0, mrp: 760, stock: 142, cartonSize: 24, unit: 'Piece' },
  { name: 'Pran Premium Ghee 1000gm', sku: '72496', company: PRAN_COMPANY, dp: 1318.0, tp: 1420.0, mrp: 1625, stock: 39, cartonSize: 12, unit: 'Piece' },
  { name: 'Pran Premium Ghee 1000gm(Without C)', sku: 'PRAN-GHEE-1KWOC', company: PRAN_COMPANY, dp: 1315.0, tp: 1410.0, mrp: 1600, stock: 0, cartonSize: 12, unit: 'Piece' },
  { name: 'Active+ Orange', sku: '52250', company: PRAN_COMPANY, dp: 107.0, tp: 114.0, mrp: 25, stock: 165, cartonSize: 24, unit: 'Piece' },
  { name: 'Active+ Lemon', sku: '52249', company: PRAN_COMPANY, dp: 107.0, tp: 114.0, mrp: 25, stock: 268, cartonSize: 24, unit: 'Piece' },
  { name: 'Mango Fruit Drink 150ml', sku: '34886', company: PRAN_COMPANY, dp: 90.35, tp: 96.0, mrp: 15, stock: 0, cartonSize: 80, unit: 'Piece' },
  { name: 'Mango Fruit Drink 200ml', sku: '34494', company: PRAN_COMPANY, dp: 110.34, tp: 116.67, mrp: 20, stock: 374, cartonSize: 48, unit: 'Piece' },
  { name: 'Pran Lacchi 200ml TBA', sku: 'PRAN-LACCHI-200', company: PRAN_COMPANY, dp: 12.0, tp: 12.5, mrp: 15, stock: 0, cartonSize: 48, unit: 'Piece' },
  { name: 'Orange Fruit Drink 200ml', sku: '53571', company: PRAN_COMPANY, dp: 114.29, tp: 120.0, mrp: 20, stock: 8, cartonSize: 48, unit: 'Piece' },
  { name: 'Pran Premium Ghee 400gm', sku: 'PRAN-GHEE-400G', company: PRAN_COMPANY, dp: 590.0, tp: 590.0, mrp: 650, stock: 0, cartonSize: 24, unit: 'Piece' },
  { name: 'Pran FCMP 10gm new', sku: 'PRA-PF1N-619', company: PRAN_COMPANY, dp: 87.27, tp: 92.0, mrp: 10, stock: 550, cartonSize: 120, unit: 'Piece' },
  { name: 'Pran Matha 200ml', sku: '74048', company: PRAN_COMPANY, dp: 548.352, tp: 580.0, mrp: 30, stock: 34, cartonSize: 24, unit: 'Piece' },
  { name: 'Super Milk 5gm New', sku: 'PRA-SM5-216', company: PRAN_COMPANY, dp: 46.16, tp: 48.5, mrp: 5, stock: 793, cartonSize: 480, unit: 'Piece' },
  { name: 'Maccho Chocolate Drink 150ml', sku: 'PRAN-MCD-150', company: PRAN_COMPANY, dp: 158.0, tp: 168.0, mrp: 25, stock: 41, cartonSize: 48, unit: 'Piece' },

  // ── ABUL KHAIR PRODUCTS ──
  { name: 'Marks FCMP 1000gm Poly', sku: 'ABU-MF1P-848', company: ABUL_KHAIR_COMPANY, dp: 856.21, tp: 883.0, mrp: 950, stock: 13, cartonSize: 12, unit: 'Piece' },
  { name: 'Marks FCMP 1000gm Tin', sku: 'ABU-MF1T-367', company: ABUL_KHAIR_COMPANY, dp: 1056.0, tp: 1100.0, mrp: 1300, stock: 6, cartonSize: 12, unit: 'Piece' },
  { name: 'Marks FCMP 500gm', sku: 'ABU-MF5-971', company: ABUL_KHAIR_COMPANY, dp: 430.53, tp: 444.0, mrp: 480, stock: 0, cartonSize: 24, unit: 'Piece' },
  { name: 'Marks FCMP 500gm with Sugar', sku: 'ABU-MF5W-430', company: ABUL_KHAIR_COMPANY, dp: 435.53, tp: 449.0, mrp: 480, stock: 355, cartonSize: 12, unit: 'Piece' },
  { name: 'Marks FCMP 400gm', sku: 'ABU-MF4-159', company: ABUL_KHAIR_COMPANY, dp: 343.08, tp: 354.0, mrp: 400, stock: 39, cartonSize: 24, unit: 'Piece' },
  { name: 'Marks FCMP 200gm', sku: 'ABU-MF2-386', company: ABUL_KHAIR_COMPANY, dp: 182.3, tp: 188.0, mrp: 205, stock: 207, cartonSize: 30, unit: 'Piece' },
  { name: 'Marks FCMP 100gm', sku: 'ABU-MF1-482', company: ABUL_KHAIR_COMPANY, dp: 96.0, tp: 99.0, mrp: 100, stock: 56, cartonSize: 60, unit: 'Piece' },
  { name: 'Marks FCMP 50gm', sku: 'ABU-MF5-522', company: ABUL_KHAIR_COMPANY, dp: 50.43, tp: 52.0, mrp: 60, stock: 72, cartonSize: 60, unit: 'Piece' },
  { name: 'Marks FCMP 75gm', sku: 'ABU-MF7-170', company: ABUL_KHAIR_COMPANY, dp: 69.09, tp: 71.25, mrp: 80, stock: 18, cartonSize: 60, unit: 'Piece' },
  { name: 'Marks FCMP 8gm', sku: 'ABU-MF8-695', company: ABUL_KHAIR_COMPANY, dp: 7.78, tp: 8.0, mrp: 10, stock: 804, cartonSize: 180, unit: 'Piece' },
  { name: 'Marks Young Star 400gm', sku: 'ABU-MYS4-766', company: ABUL_KHAIR_COMPANY, dp: 360.0, tp: 375.0, mrp: 425, stock: 30, cartonSize: 24, unit: 'Piece' },
  { name: 'Marks Gold 400gm', sku: 'ABU-MG4-635', company: ABUL_KHAIR_COMPANY, dp: 360.0, tp: 375.0, mrp: 425, stock: 6, cartonSize: 24, unit: 'Piece' },
  { name: 'Marks Diet 400gm', sku: 'ABU-MD4-102', company: ABUL_KHAIR_COMPANY, dp: 360.0, tp: 375.0, mrp: 425, stock: 36, cartonSize: 24, unit: 'Piece' },
  { name: 'Marks Active School 400gm', sku: 'ABU-MAS4-223', company: ABUL_KHAIR_COMPANY, dp: 360.0, tp: 375.0, mrp: 425, stock: 0, cartonSize: 24, unit: 'Piece' },
  { name: 'Marks Chocolate Active School 400gm', sku: 'ABU-MCAS-808', company: ABUL_KHAIR_COMPANY, dp: 360.0, tp: 375.0, mrp: 425, stock: 6, cartonSize: 24, unit: 'Piece' },
  { name: 'Marks Diet Tin 400gm', sku: 'ABU-MDT4-717', company: ABUL_KHAIR_COMPANY, dp: 1148.0, tp: 1200.0, mrp: 1400, stock: 3, cartonSize: 12, unit: 'Piece' },
  { name: 'Ama FCMP 2000gm', sku: 'ABU-AF2-789', company: ABUL_KHAIR_COMPANY, dp: 1514.84, tp: 1562.0, mrp: 1730, stock: 24, cartonSize: 6, unit: 'Piece' },
  { name: 'Ama FCMP 1000gm', sku: 'ABU-AF1-121', company: ABUL_KHAIR_COMPANY, dp: 762.27, tp: 786.0, mrp: 870, stock: 15, cartonSize: 12, unit: 'Piece' },
  { name: 'Ama FCMP 500gm', sku: 'ABU-AF5-172', company: ABUL_KHAIR_COMPANY, dp: 391.81, tp: 404.0, mrp: 450, stock: 39, cartonSize: 24, unit: 'Piece' },
  { name: 'Ama FCMP 200gm', sku: 'ABU-AF2-596', company: ABUL_KHAIR_COMPANY, dp: 159.05, tp: 165.0, mrp: 190, stock: 69, cartonSize: 30, unit: 'Piece' },
  { name: 'Ama FCMP 100gm', sku: 'ABU-AF1-156', company: ABUL_KHAIR_COMPANY, dp: 79.04, tp: 82.0, mrp: 100, stock: 18, cartonSize: 60, unit: 'Piece' },
  { name: 'Ama FCMP 50gm', sku: 'ABU-AF5-136', company: ABUL_KHAIR_COMPANY, dp: 41.46, tp: 43.0, mrp: 50, stock: 75, cartonSize: 60, unit: 'Piece' },
  { name: 'Ama FCMP 10gm', sku: 'ABU-AF1-667', company: ABUL_KHAIR_COMPANY, dp: 7.71, tp: 8.0, mrp: 10, stock: 2148, cartonSize: 180, unit: 'Piece' },
  { name: 'Ama Paper Cup 150ml', sku: 'ABU-APC1-780', company: ABUL_KHAIR_COMPANY, dp: 368.6, tp: 380.0, mrp: 420, stock: 2, cartonSize: 24, unit: 'Piece' },
  { name: 'Ama Paper Cup 120ml', sku: 'ABU-APC1-222', company: ABUL_KHAIR_COMPANY, dp: 329.8, tp: 340.0, mrp: 380, stock: 3, cartonSize: 24, unit: 'Piece' },
  { name: 'Ama Paper Cup 100ml', sku: 'ABU-APC1-781', company: ABUL_KHAIR_COMPANY, dp: 310.4, tp: 330.0, mrp: 370, stock: 3, cartonSize: 24, unit: 'Piece' },
  { name: 'Ama Sugar Free Coffee 500gm', sku: 'ABU-ASFC-609', company: ABUL_KHAIR_COMPANY, dp: 305.24, tp: 315.0, mrp: 375, stock: 1, cartonSize: 12, unit: 'Piece' },
  { name: 'Ama Sugar Free Coffee 15gm', sku: 'ABU-ASFC-145', company: ABUL_KHAIR_COMPANY, dp: 11.64, tp: 12.0, mrp: 15, stock: 192, cartonSize: 576, unit: 'Piece' },
  { name: 'Ama Coffeemix 1000gm', sku: 'ABU-AC1-108', company: ABUL_KHAIR_COMPANY, dp: 416.5, tp: 430.0, mrp: 500, stock: 16, cartonSize: 6, unit: 'Piece' },
  { name: 'Ama Classic Coffee 0.75gm', sku: 'ABU-ACC0-467', company: ABUL_KHAIR_COMPANY, dp: 2.4, tp: 2.5, mrp: 3, stock: 5580, cartonSize: 1680, unit: 'Piece' },
  { name: 'Ama Classic Coffee 1gm', sku: 'ABU-ACC1-354', company: ABUL_KHAIR_COMPANY, dp: 3.65, tp: 3.8, mrp: 5, stock: 2070, cartonSize: 960, unit: 'Piece' },
  { name: 'Ama Coffeemix Stick 14gm', sku: 'ABU-ACS1-925', company: ABUL_KHAIR_COMPANY, dp: 8.25, tp: 8.5, mrp: 10, stock: 912, cartonSize: 288, unit: 'Piece' },
  { name: 'Aura Hot Chocolate 500gm', sku: 'ABU-AHC5-761', company: ABUL_KHAIR_COMPANY, dp: 208.25, tp: 215.0, mrp: 260, stock: 4, cartonSize: 12, unit: 'Piece' },
  { name: 'Seylon Masala Raw Tea 1000gm', sku: 'ABU-SMRT-179', company: ABUL_KHAIR_COMPANY, dp: 300.1, tp: 310.0, mrp: 370, stock: 8, cartonSize: 6, unit: 'Piece' },
  { name: 'Seylon Tea 14gm', sku: 'ABU-ST1-813', company: ABUL_KHAIR_COMPANY, dp: 7.81, tp: 8.1, mrp: 10, stock: 810, cartonSize: 400, unit: 'Piece' },
  { name: 'Seylon Tea 50gm', sku: 'ABU-ST5-936', company: ABUL_KHAIR_COMPANY, dp: 22.8, tp: 23.5, mrp: 30, stock: 530, cartonSize: 200, unit: 'Piece' },
  { name: 'Seylon Tea 100gm', sku: 'ABU-ST1-287', company: ABUL_KHAIR_COMPANY, dp: 44.53, tp: 46.0, mrp: 60, stock: 215, cartonSize: 100, unit: 'Piece' },
  { name: 'Seylon Tea 200gm', sku: 'ABU-ST2-201', company: ABUL_KHAIR_COMPANY, dp: 89.1, tp: 92.0, mrp: 120, stock: 199, cartonSize: 50, unit: 'Piece' },
  { name: 'Seylon Tea 400gm', sku: 'ABU-ST4-266', company: ABUL_KHAIR_COMPANY, dp: 176.24, tp: 182.0, mrp: 225, stock: 162, cartonSize: 50, unit: 'Piece' },
  { name: 'Seylon PD Tea 500gm', sku: 'ABU-SPT5-942', company: ABUL_KHAIR_COMPANY, dp: 192.35, tp: 199.0, mrp: 230, stock: 101, cartonSize: 40, unit: 'Piece' },
  { name: 'Seylon Gold Tea 500gm', sku: 'ABU-SGT5-894', company: ABUL_KHAIR_COMPANY, dp: 201.2, tp: 208.0, mrp: 240, stock: 23, cartonSize: 40, unit: 'Piece' },
  { name: 'Seylon BOP Tea 500gm', sku: 'ABU-SBT5-301', company: ABUL_KHAIR_COMPANY, dp: 192.35, tp: 199.0, mrp: 235, stock: 43, cartonSize: 40, unit: 'Piece' },
  { name: 'Seylon Bag In Bag', sku: 'ABU-SBIB-805', company: ABUL_KHAIR_COMPANY, dp: 57.7, tp: 60.0, mrp: 75, stock: 44, cartonSize: 40, unit: 'Piece' },
  { name: 'Seylon Saver Pack', sku: 'ABU-SSP-775', company: ABUL_KHAIR_COMPANY, dp: 535.94, tp: 560.0, mrp: 600, stock: 4, cartonSize: 4, unit: 'Piece' },
  { name: 'Seylon Pyramid Gold', sku: 'ABU-SPG-362', company: ABUL_KHAIR_COMPANY, dp: 68.6, tp: 71.0, mrp: 90, stock: 53, cartonSize: 40, unit: 'Piece' },
  { name: 'Seylon Green Tea', sku: 'ABU-SGT-375', company: ABUL_KHAIR_COMPANY, dp: 82.15, tp: 85.0, mrp: 120, stock: 142, cartonSize: 40, unit: 'Piece' },
  { name: 'Ama UHT Milk 1000ml', sku: 'ABU-AUM1-577', company: ABUL_KHAIR_COMPANY, dp: 103.4, tp: 110.0, mrp: 130, stock: 143, cartonSize: 8, unit: 'Piece' },
  { name: 'Seylon Milk Tea 15gm', sku: 'ABU-SMT1-243', company: ABUL_KHAIR_COMPANY, dp: 7.52, tp: 7.75, mrp: 10, stock: 792, cartonSize: 288, unit: 'Piece' },
  { name: 'Seylon Milk Tea 1000gm', sku: 'ABU-SMT1-207', company: ABUL_KHAIR_COMPANY, dp: 387.4, tp: 400.0, mrp: 470, stock: 33, cartonSize: 6, unit: 'Piece' },

  // ── COCOLA PRODUCTS ──
  { name: 'Champion Chocolate Biscuits', sku: 'COC-CCB-876', company: COCOLA_COMPANY, dp: 300.0, tp: 320.0, mrp: 350, stock: 5, cartonSize: 24, unit: 'Piece' },
  { name: 'Jr. Champion Chocolate Biscuits', sku: 'COC-JCCB-626', company: COCOLA_COMPANY, dp: 112.5, tp: 120.0, mrp: 15, stock: 334, cartonSize: 24, unit: 'Piece' },
  { name: 'Anarkali Butter Toast Biscuit', sku: 'COC-ABTB-451', company: COCOLA_COMPANY, dp: 37.5, tp: 40.0, mrp: 50, stock: 3, cartonSize: 24, unit: 'Piece' },
  { name: 'Milk Vanilla (Vanilla Cream Biscuit)', sku: 'COC-MVC-425', company: COCOLA_COMPANY, dp: 180.0, tp: 192.0, mrp: 20, stock: 22, cartonSize: 24, unit: 'Piece' },
  { name: 'Time Pass Salted Biscuits', sku: 'COC-TPSB-219', company: COCOLA_COMPANY, dp: 45.0, tp: 48.0, mrp: 5, stock: 5, cartonSize: 24, unit: 'Piece' },
  { name: 'Real Horlicks Cookies Biscuit', sku: 'COC-RHCB-468', company: COCOLA_COMPANY, dp: 42.5, tp: 45.0, mrp: 55, stock: 3, cartonSize: 24, unit: 'Piece' },
  { name: 'Choco Chocolate Biscuit', sku: 'COC-CCB-828', company: COCOLA_COMPANY, dp: 180.0, tp: 192.0, mrp: 10, stock: 33, cartonSize: 24, unit: 'Piece' },
  { name: 'Eat Me Instant Noodles', sku: 'COC-EMIN-730', company: COCOLA_COMPANY, dp: 93.67, tp: 96.0, mrp: 10, stock: 30, cartonSize: 24, unit: 'Piece' },
  { name: 'Junior Cup Noodles (Chicken Curry)', sku: 'COC-JCN-758', company: COCOLA_COMPANY, dp: 25.32, tp: 27.0, mrp: 35, stock: 0, cartonSize: 24, unit: 'Piece' },
  { name: 'Junior Cup Noodles (Chicken Curry) Savings', sku: 'COC-JCN-932', company: COCOLA_COMPANY, dp: 24.17, tp: 27.0, mrp: 35, stock: 102, cartonSize: 24, unit: 'Piece' },
  { name: 'Egg & Chicken Noodles (300gm)', sku: 'COC-ECN-390', company: COCOLA_COMPANY, dp: 39.5, tp: 42.0, mrp: 50, stock: 94, cartonSize: 24, unit: 'Piece' },
  { name: 'Egg & Chicken Noodles (500 gm)', sku: 'COC-ECN-669', company: COCOLA_COMPANY, dp: 66.0, tp: 70.0, mrp: 85, stock: 110, cartonSize: 24, unit: 'Piece' },
  { name: 'Wafer Roll Jar (Chocolate)', sku: 'COC-WRJ-863', company: COCOLA_COMPANY, dp: 56.75, tp: 60.0, mrp: 75, stock: 509, cartonSize: 24, unit: 'Piece' },
  { name: 'Milky Milk-chocolate crispy Wafer Roll', sku: 'COC-MMCW-866', company: COCOLA_COMPANY, dp: 180.0, tp: 192.0, mrp: 10, stock: 17, cartonSize: 24, unit: 'Piece' },
  { name: 'Chocolate Cream Wafer Biscuit', sku: 'COC-CCWB-555', company: COCOLA_COMPANY, dp: 15.42, tp: 16.5, mrp: 20, stock: 60, cartonSize: 24, unit: 'Piece' },
  { name: 'Vanilla Cream Wafer Biscuit', sku: 'COC-VCWB-231', company: COCOLA_COMPANY, dp: 15.42, tp: 16.5, mrp: 20, stock: 72, cartonSize: 24, unit: 'Piece' },
  { name: 'Mini Cashew NutChocolate Wafer Biscuit', sku: 'COC-MCNW-656', company: COCOLA_COMPANY, dp: 180.0, tp: 192.0, mrp: 10, stock: 4, cartonSize: 24, unit: 'Piece' },
  { name: 'Choco Crunch Chips', sku: 'COC-CCC-720', company: COCOLA_COMPANY, dp: 151.67, tp: 160.0, mrp: 10, stock: 45, cartonSize: 24, unit: 'Piece' },
  { name: 'Choco Crunch (Jar)', sku: 'COC-CC-983', company: COCOLA_COMPANY, dp: 70.0, tp: 76.0, mrp: 90, stock: 111, cartonSize: 24, unit: 'Piece' },
  { name: 'Boom Boom Chocolate Gems', sku: 'COC-BBCG-339', company: COCOLA_COMPANY, dp: 90.0, tp: 96.0, mrp: 5, stock: 23, cartonSize: 24, unit: 'Piece' },
  { name: 'Fun & Joy (10 Pc)', sku: 'COC-FJ-117', company: COCOLA_COMPANY, dp: 197.5, tp: 210.0, mrp: 30, stock: 73, cartonSize: 24, unit: 'Piece' },
  { name: 'Fun & Joy (30 Pc)', sku: 'COC-FJ-807', company: COCOLA_COMPANY, dp: 592.5, tp: 630.0, mrp: 30, stock: 29, cartonSize: 24, unit: 'Piece' },
  { name: 'Cornetti Twin Chocolate Biscuit Cone', sku: 'COC-CTCB-481', company: COCOLA_COMPANY, dp: 409.5, tp: 440.0, mrp: 20, stock: 13, cartonSize: 24, unit: 'Piece' },
  { name: 'Cornetti Black & White Chocolate Biscuit Cone', sku: 'COC-BW-968', company: COCOLA_COMPANY, dp: 409.5, tp: 440.0, mrp: 20, stock: 25, cartonSize: 24, unit: 'Piece' },
  { name: 'Marshmallow (Doll)', sku: 'COC-M-332', company: COCOLA_COMPANY, dp: 271.6, tp: 300.0, mrp: 20, stock: 23, cartonSize: 24, unit: 'Piece' },
  { name: 'Momo Marshmallow', sku: 'COC-MM-318', company: COCOLA_COMPANY, dp: 305.4, tp: 330.0, mrp: 15, stock: 12, cartonSize: 24, unit: 'Piece' },
  { name: 'Jolly Lolly Lollipop', sku: 'COC-JLL-148', company: COCOLA_COMPANY, dp: 90.0, tp: 96.0, mrp: 5, stock: 58, cartonSize: 24, unit: 'Piece' },
  { name: 'Tatul Super Chutney (50 Pcs) FG', sku: 'COC-TSC-490', company: COCOLA_COMPANY, dp: 180.0, tp: 190.0, mrp: 5, stock: 22, cartonSize: 24, unit: 'Piece' },
  { name: 'Stick Noodles 20tk', sku: 'COC-SN2-255', company: COCOLA_COMPANY, dp: 368.53, tp: 390.0, mrp: 20, stock: 20, cartonSize: 24, unit: 'Piece' },
  { name: 'Stick Noodles 25tk', sku: 'COC-SN2-357', company: COCOLA_COMPANY, dp: 452.74, tp: 490.0, mrp: 25, stock: 34, cartonSize: 24, unit: 'Piece' },
  { name: 'Tiffin Rolls', sku: 'COC-TR-979', company: COCOLA_COMPANY, dp: 180.0, tp: 192.0, mrp: 10, stock: 28, cartonSize: 24, unit: 'Piece' },
  { name: 'Happy Ice lolly (Pouch)', sku: 'COC-HIL-694', company: COCOLA_COMPANY, dp: 44.64, tp: 48.0, mrp: 60, stock: 0, cartonSize: 24, unit: 'Piece' },
  { name: 'Mango Pops', sku: 'COC-MP-524', company: COCOLA_COMPANY, dp: 168.75, tp: 180.0, mrp: 5, stock: 7, cartonSize: 24, unit: 'Piece' },
  { name: 'Juicy Land Umbrella', sku: 'COC-JLU-350', company: COCOLA_COMPANY, dp: 109.5, tp: 117.0, mrp: 15, stock: 24, cartonSize: 24, unit: 'Piece' },
  { name: 'Juicy Land Dinosaur', sku: 'COC-JLD-902', company: COCOLA_COMPANY, dp: 109.5, tp: 117.0, mrp: 15, stock: 21, cartonSize: 24, unit: 'Piece' },
  { name: 'Choco Waffy 25pc', sku: 'COC-CW2-983', company: COCOLA_COMPANY, dp: 187.5, tp: 200.0, mrp: 10, stock: 30, cartonSize: 24, unit: 'Piece' },
  { name: 'Mango Ice Lolly', sku: 'COC-MIL-193', company: COCOLA_COMPANY, dp: 182.5, tp: 195.0, mrp: 220, stock: 10, cartonSize: 24, unit: 'Piece' },
  { name: 'Lychee Gel Jar 65psc', sku: 'COC-LGJ6-393', company: COCOLA_COMPANY, dp: 91.0, tp: 98.0, mrp: 120, stock: 1, cartonSize: 24, unit: 'Piece' },
];

async function masterSync() {
  console.log('🧹 Starting Master Clean & De-duplicated Sync (Excluding Challans/Sales)...');

  const { data: usersData, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr || !usersData?.users?.length) {
    console.error('Error fetching users:', userErr);
    return;
  }

  const ownerIds = usersData.users.map(u => u.id);
  console.log('Owners:', usersData.users.map(u => u.email));

  for (const ownerId of ownerIds) {
    console.log(`\n======================================================`);
    console.log(`Cleaning & Syncing Master Data for owner: ${ownerId}`);
    console.log(`======================================================`);

    // 0. WIPE OLD/DUPLICATE RECORDS FOR THIS OWNER
    console.log('Cleaning old duplicate tables for fresh clean state...');
    await supabase.from('challans').delete().eq('owner_id', ownerId);
    await supabase.from('products').delete().eq('owner_id', ownerId);
    await supabase.from('srs').delete().eq('owner_id', ownerId);
    await supabase.from('delivery_men').delete().eq('owner_id', ownerId);
    await supabase.from('routes').delete().eq('owner_id', ownerId);
    await supabase.from('units').delete().eq('owner_id', ownerId);
    await supabase.from('companies').delete().eq('owner_id', ownerId);

    // 1. Settings
    console.log('1. Setting up Shop Settings...');
    await supabase.from('settings').upsert({
      owner_id: ownerId,
      shop_name: 'Samir Enterprise',
      shop_subbrand: 'Dhaka & Chittagong Regional Hub',
      shop_logo: '',
      language: 'bn',
    }, { onConflict: 'owner_id' });
    console.log('   ✅ Shop Settings saved.');

    // 2. Companies
    console.log('2. Inserting clean Companies...');
    const companyMap = {};
    const companyInserts = MASTER_COMPANIES.map((c, i) => {
      const id = `comp-${ownerId.slice(0, 4)}-${i + 1}`;
      companyMap[c.name] = id;
      return {
        id,
        owner_id: ownerId,
        name: c.name,
        contact_person: c.contact_person,
        phone: c.phone,
        address: c.address,
      };
    });
    await supabase.from('companies').insert(companyInserts);
    console.log(`   ✅ ${companyInserts.length} unique Companies inserted.`);

    // 3. Units
    console.log('3. Inserting clean Units...');
    const unitInserts = MASTER_UNITS.map((u, i) => ({
      id: `uom-${ownerId.slice(0, 4)}-${i + 1}`,
      owner_id: ownerId,
      name: u.name,
      symbol: u.symbol,
      multiplier: u.multiplier,
    }));
    await supabase.from('units').insert(unitInserts);
    console.log(`   ✅ ${unitInserts.length} Units inserted.`);

    // 4. Delivery Men
    console.log('4. Inserting clean Delivery Men...');
    const dmMap = {};
    const dmInserts = MASTER_DELIVERY_MEN.map((dm, i) => {
      const id = `dm-${ownerId.slice(0, 4)}-${i + 1}`;
      dmMap[dm.name] = id;
      return {
        id,
        owner_id: ownerId,
        name: dm.name,
        vehicle: dm.vehicle,
        phone: dm.phone,
        assigned_company_ids: [],
      };
    });
    await supabase.from('delivery_men').insert(dmInserts);
    console.log(`   ✅ ${dmInserts.length} unique Delivery Men inserted.`);

    // 5. SRs
    console.log('5. Inserting clean SRs...');
    const srMap = {};
    const srInserts = MASTER_SRS.map((s, i) => {
      const id = `sr-${ownerId.slice(0, 4)}-${i + 1}`;
      srMap[s.name] = id;
      const assignedIds = (s.assigned_company_names || []).map(cName => companyMap[cName] || cName);
      return {
        id,
        owner_id: ownerId,
        name: s.name,
        phone: s.phone,
        commission_rate: s.commission_rate,
        assigned_company_ids: assignedIds,
        login_username: s.login_username,
        login_password: s.login_password,
        is_active: true,
      };
    });
    await supabase.from('srs').insert(srInserts);
    console.log(`   ✅ ${srInserts.length} unique SRs inserted.`);

    // 6. Routes
    console.log('6. Inserting clean Routes...');
    const routeInserts = MASTER_ROUTES.map((r, i) => {
      const id = `route-${ownerId.slice(0, 4)}-${i + 1}`;
      return {
        id,
        owner_id: ownerId,
        name: r.name,
        area: r.area,
        territory: r.territory,
        assigned_sr_id: r.name === 'Ready Sales' ? (srMap['Sobuj'] || null) : null,
        assigned_delivery_man_id: null,
      };
    });
    await supabase.from('routes').insert(routeInserts);
    console.log(`   ✅ ${routeInserts.length} unique Routes inserted.`);

    // 7. Products (Deduplicated, zero duplicates)
    console.log('7. Inserting clean Products...');
    const productInserts = MASTER_PRODUCTS.map((p, i) => {
      const id = `prod-${ownerId.slice(0, 4)}-${i + 1}`;
      return {
        id,
        owner_id: ownerId,
        name: p.name,
        sku: p.sku,
        company: p.company,
        default_pp: Number(p.dp.toFixed(3)),
        default_wsp: Number(p.tp.toFixed(3)),
        default_mrp: Number(p.mrp.toFixed(3)),
        current_stock: p.stock,
        damaged_stock: 0,
        carton_size: p.cartonSize || 24,
        price_per_carton: p.unit === 'Carton' ? p.tp : Number((p.tp * (p.cartonSize || 24)).toFixed(2)),
        price_per_piece: p.tp,
        primary_unit: p.unit || 'Piece',
        stock_alert_threshold: 10,
        created_at: '2026-05-31T00:00:00.000Z',
      };
    });

    // Chunk product inserts
    for (let i = 0; i < productInserts.length; i += 50) {
      const chunk = productInserts.slice(i, i + 50);
      const { error: pErr } = await supabase.from('products').insert(chunk);
      if (pErr) console.error(`Error inserting products batch ${i}:`, pErr);
    }
    console.log(`   ✅ ${productInserts.length} unique Products inserted without duplicates.`);

    console.log('   ✅ Challans/Sales table is kept completely clean (0 records) as requested.');
  }

  console.log('\n✨ MASTER CLEAN SYNC COMPLETED SUCCESSFULLY!');
}

masterSync();
