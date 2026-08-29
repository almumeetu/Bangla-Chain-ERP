-- ============================================================
-- Bangla-Chain ERP: Complete Master Database Setup Script
-- Seeds Settings, Companies, Units, Categories, Godowns, SRs, Delivery Men, Routes & 55 Products
-- (No dummy sales / challan records included — Fresh Start)
-- ============================================================

DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- 1. Identify the Admin User
  SELECT id INTO v_owner_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  
  IF v_owner_id IS NULL THEN
    RAISE NOTICE 'No auth user found in auth.users. Please register/login to Supabase first.';
    RETURN;
  END IF;

  -- 2. SETTINGS (Branding & Owner)
  INSERT INTO settings (owner_id, shop_name, shop_subbrand, owner_name, language)
  VALUES (
    v_owner_id,
    'Samir Enterprise',
    'Dhaka & Chittagong Regional Hub',
    'Sohanur Rahman Sohan',
    'bn'
  )
  ON CONFLICT (owner_id) DO UPDATE SET
    shop_name     = EXCLUDED.shop_name,
    shop_subbrand = EXCLUDED.shop_subbrand,
    owner_name    = EXCLUDED.owner_name,
    language      = EXCLUDED.language,
    updated_at    = NOW();

  -- 3. COMPANIES (4 Companies)
  INSERT INTO companies (id, owner_id, name, contact_person, phone, address)
  VALUES
    ('comp-1783247007277', v_owner_id, 'Pran Dairy Milkman Group', 'Shawon Vai', '01704141903', 'Dhaka'),
    ('comp-1783247065744', v_owner_id, 'Abul Khair Milk Products LTD Sky Group', 'Khaled Vai', '01926670833', 'Dhaka'),
    ('comp-1783247144876', v_owner_id, 'Cocola Food Products Ltd C Group', 'Toriqul Vai', '01762750770', 'Dhaka'),
    ('comp-1783247199503', v_owner_id, 'Olympic Industries LTD Jupiter Group', 'Sadik Vai', '01912131202', 'Dhaka')
  ON CONFLICT (id) DO UPDATE SET
    name           = EXCLUDED.name,
    contact_person = EXCLUDED.contact_person,
    phone          = EXCLUDED.phone,
    address        = EXCLUDED.address;

  -- 4. UNITS OF MEASURE (3 Units)
  INSERT INTO units (id, owner_id, name, multiplier)
  VALUES
    ('uom-1784297360115', v_owner_id, 'Cartoon', 1),
    ('uom-1784297380091', v_owner_id, 'Piece', 1),
    ('uom-1784349585052', v_owner_id, 'Dorzen', 12)
  ON CONFLICT (id) DO UPDATE SET
    name       = EXCLUDED.name,
    multiplier = EXCLUDED.multiplier;

  -- 5. PRODUCT CATEGORIES (4 Categories)
  INSERT INTO product_categories (id, owner_id, name, description)
  VALUES
    ('cat-1', v_owner_id, 'Milk & Dairy', 'Milk, UHT, Ghee & Milk Powder'),
    ('cat-2', v_owner_id, 'Biscuit & Wafer', 'Sweet, savory, cookies & wafers'),
    ('cat-3', v_owner_id, 'Noodles & Snacks', 'Instant noodles, cup noodles & snacks'),
    ('cat-4', v_owner_id, 'Tea & Coffee', 'Premium tea, coffee & beverage mixes')
  ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description;

  -- 6. GODOWNS / WAREHOUSES (2 Godowns)
  INSERT INTO godowns (id, owner_id, name, location, is_damage_godown)
  VALUES
    ('g-1', v_owner_id, 'Tongi Mollabari Central Godown', 'Tongi Mollabari, Gazipur', false),
    ('g-damage', v_owner_id, 'Damage & Return Godown', 'Section B, Tongi Hub', true)
  ON CONFLICT (id) DO UPDATE SET
    name             = EXCLUDED.name,
    location         = EXCLUDED.location,
    is_damage_godown = EXCLUDED.is_damage_godown;

  -- 7. SALES REPRESENTATIVES (SRs with login accounts)
  INSERT INTO srs (id, owner_id, name, phone, commission_rate, assigned_company_ids, login_username, login_password)
  VALUES
    ('sr-1', v_owner_id, 'Rakib', '01711223344', 5.00, ARRAY['Pran Dairy Milkman Group', 'comp-1783247007277'], 'rakib', 'rakib123'),
    ('sr-2', v_owner_id, 'Rahman', '01811223344', 5.00, ARRAY['Cocola Food Products Ltd C Group', 'comp-1783247144876', 'Olympic Industries LTD Jupiter Group', 'comp-1783247199503'], 'rahman', 'rahman123'),
    ('sr-3', v_owner_id, 'Rahim', '01911223344', 5.00, ARRAY['Abul Khair Milk Products LTD Sky Group', 'comp-1783247065744'], 'rahim', 'rahim123')
  ON CONFLICT (id) DO UPDATE SET
    name                 = EXCLUDED.name,
    phone                = EXCLUDED.phone,
    commission_rate      = EXCLUDED.commission_rate,
    assigned_company_ids = EXCLUDED.assigned_company_ids,
    login_username       = EXCLUDED.login_username,
    login_password       = EXCLUDED.login_password;

  -- 8. DELIVERY MEN
  INSERT INTO delivery_men (id, owner_id, name, vehicle)
  VALUES
    ('dm-1', v_owner_id, 'Abul Kalam', 'PickUp Truck (Metro-Tha-11-2044)'),
    ('dm-2', v_owner_id, 'Sujon Mia', 'Covered Van (Metro-Cha-54-9988)'),
    ('dm-3', v_owner_id, 'Khorshed Alam', 'Three Wheeler Cargo (Dhaka-H-12-3456)')
  ON CONFLICT (id) DO UPDATE SET
    name    = EXCLUDED.name,
    vehicle = EXCLUDED.vehicle;

  -- 9. ROUTES / BEATS
  INSERT INTO routes (id, owner_id, name, area, territory, assigned_sr_id)
  VALUES
    ('route-1', v_owner_id, 'Elephant Road Beat', 'Dhanmondi & Science Lab', 'Dhaka South', 'sr-1'),
    ('route-2', v_owner_id, 'Chawkbazar Beat', 'Sadarghat & Chawkbazar', 'Old Dhaka Hub', 'sr-2'),
    ('route-3', v_owner_id, 'Bogura Sadar Beat', 'Bogura Sadar & Rail Market', 'North Bengal Region', 'sr-3')
  ON CONFLICT (id) DO UPDATE SET
    name           = EXCLUDED.name,
    area           = EXCLUDED.area,
    territory      = EXCLUDED.territory,
    assigned_sr_id = EXCLUDED.assigned_sr_id;

  -- 10. EXPENSE CATEGORIES
  INSERT INTO expense_categories (id, owner_id, name, description)
  VALUES
    ('cat-1', v_owner_id, 'SR Salaries & Commission', 'Monthly fixed salary and performance commissions paid to SRs'),
    ('cat-2', v_owner_id, 'Carriage & Transport Fuel', 'Fuel and tolls for supplying goods to retail markets'),
    ('cat-3', v_owner_id, 'Warehouse Rent & Electric', 'Utility bills and floor space rent for storing brand stock')
  ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description;

  -- 11. PRODUCTS (55 Items)
  INSERT INTO products (id, owner_id, name, sku, company, uom_id, default_pp, default_wsp, default_mrp, current_stock, damaged_stock)
  VALUES
    ('prod-1783248232464', v_owner_id, 'Milkman UHT 200ml', '46851', 'Pran Dairy Milkman Group', 'uom-1783247459352', 24.25, 25.67, 30, 1709, 0),
    ('prod-1783248942773', v_owner_id, 'Milkman UHT 500ml', '46855', 'Pran Dairy Milkman Group', 'uom-1783247459352', 49.65, 52.5, 60, 0, 0),
    ('prod-1783249048217', v_owner_id, 'Pran FCMP 10gm', '47091', 'Pran Dairy Milkman Group', 'uom-1783247469418', 7.15, 7.83, 10, 6720, 0),
    ('prod-1783249198385', v_owner_id, 'Pran Milk Powder 50gm Chain', '53497', 'Pran Dairy Milkman Group', 'uom-1783247459352', 39.18, 41.14, 50, 114, 0),
    ('prod-1783249257480', v_owner_id, 'Pran Full Cream Milk Powder 200gm', '32729', 'Pran Dairy Milkman Group', 'uom-1783247459352', 170.52, 180, 205, 84, 0),
    ('prod-1783249385932', v_owner_id, 'Pran Full Cream Milk Powder 400gm', '32733', 'Pran Dairy Milkman Group', 'uom-1783247459352', 308.77, 325, 390, 60, 0),
    ('prod-1783249456368', v_owner_id, 'Pran Full Cream Milk Powder 500gm', '32706', 'Pran Dairy Milkman Group', 'uom-1783247459352', 385.58, 405, 460, 4, 0),
    ('prod-1783249516685', v_owner_id, 'Super Milk 200gm', '51091', 'Pran Dairy Milkman Group', 'uom-1783247459352', 132, 140, 175, 67, 0),
    ('prod-1783249591128', v_owner_id, 'Super Milk 500gm', '47838', 'Pran Dairy Milkman Group', 'uom-1783247459352', 304.62, 320, 365, 16, 0),
    ('prod-1783249704719', v_owner_id, 'Super Milk 1000gm', '47092', 'Pran Dairy Milkman Group', 'uom-1783247459352', 585.12, 615, 690, 83, 0),
    ('prod-1783249799083', v_owner_id, 'Super Milk 5gm', '74038', 'Pran Dairy Milkman Group', 'uom-1783247469418', 4, 4.17, 5, 2916, 0),
    ('prod-1783250134600', v_owner_id, 'Pran Premium Ghee 100gm', '32744', 'Pran Dairy Milkman Group', 'uom-1783247459352', 149.84, 160, 190, 1031, 0),
    ('prod-1783250214554', v_owner_id, 'Pran Premium Ghee 200gm', '32745', 'Pran Dairy Milkman Group', 'uom-1783247459352', 284.88, 300, 350, 384, 0),
    ('prod-1783250342182', v_owner_id, 'Pran Premium Ghee 450gm', '72495', 'Pran Dairy Milkman Group', 'uom-1783247459352', 641, 680, 760, 100, 0),
    ('prod-1783250395116', v_owner_id, 'Pran Premium Ghee 1000gm', '72496', 'Pran Dairy Milkman Group', 'uom-1783247459352', 1318, 1420, 1625, 9, 0),
    ('prod-1783250483407', v_owner_id, 'Mango Fruit Drink 200ml', '34494', 'Pran Dairy Milkman Group', 'uom-1783247514768', 13.79, 14.59, 20, 3760, 0),
    ('prod-1783250537609', v_owner_id, 'Mango Fruit Drink 150ml', '34886', 'Pran Dairy Milkman Group', 'uom-1783247514768', 11.29, 12, 15, 0, 0),
    ('prod-1783250613069', v_owner_id, 'Orange Fruit Drink 200ml', '53571', 'Pran Dairy Milkman Group', 'uom-1783247514768', 14.29, 15, 20, 304, 0),
    ('prod-1783250742499', v_owner_id, 'Pran FCMP 10gm new', 'PRA-PF1N-619', 'Pran Dairy Milkman Group', 'uom-1783247469418', 7.39, 7.84, 10, 1524, 0),
    ('prod-1783250818474', v_owner_id, 'Active+ Lemon', '52249', 'Pran Dairy Milkman Group', 'uom-1783247538460', 17.83, 19, 25, 1200, 0),
    ('prod-1783250861129', v_owner_id, 'Active+ Orange', '52250', 'Pran Dairy Milkman Group', 'uom-1783247538460', 17.83, 19, 25, 852, 0),
    ('prod-1783251021700', v_owner_id, 'Pran Matha 200ml', '74048', 'Pran Dairy Milkman Group', 'uom-1783247304023', 548.36, 13920, 30, 0, 0),
    ('prod-1783251836203', v_owner_id, 'Champion Chocolate Biscuits', 'COC-CCB-876', 'Cocola Food Products Ltd C Group', 'uom-1783251757334', 300, 320, 400, 6, 0),
    ('prod-1783251898150', v_owner_id, 'Jr. Champion Chocolate Biscuits', 'COC-JCCB-626', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 112.5, 120, 15, 334, 0),
    ('prod-1783251992147', v_owner_id, 'Anarkali Butter Toast Biscuit', 'COC-ABTB-451', 'Cocola Food Products Ltd C Group', 'uom-1783247459352', 37.5, 40, 0, 7, 0),
    ('prod-1783252075309', v_owner_id, 'Milk Vanilla (Vanilla Cream Biscuit)', 'COC-MVC-425', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 180, 192, 20, 22, 0),
    ('prod-1783252118886', v_owner_id, 'Time Pass Salted Biscuits', 'COC-TPSB-219', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 45, 48, 5, 5, 0),
    ('prod-1783252158606', v_owner_id, 'Real Horlicks Cookies Biscuit', 'COC-RHCB-468', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 42.5, 45, 0, 3, 0),
    ('prod-1783252203203', v_owner_id, 'Choco Chocolate Biscuit', 'COC-CCB-828', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 180, 192, 10, 33, 0),
    ('prod-1783252270119', v_owner_id, 'Eat Me Instant Noodles', 'COC-EMIN-730', 'Cocola Food Products Ltd C Group', 'uom-1783247469418', 93.67, 96, 10, 30, 0),
    ('prod-1783252320424', v_owner_id, 'Junior Cup Noodles (Chicken Curry)', 'COC-JCN-758', 'Cocola Food Products Ltd C Group', 'uom-1783247459352', 25.32, 27, 35, 0, 0),
    ('prod-1783252355581', v_owner_id, 'Junior Cup Noodles (Chicken Curry) Savings', 'COC-JCN-932', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 24.17, 27, 35, 102, 0),
    ('prod-1783252408027', v_owner_id, 'Egg & Chicken Noodles (300gm)', 'COC-ECN-390', 'Cocola Food Products Ltd C Group', 'uom-1783247459352', 39.5, 42, 50, 98, 0),
    ('prod-1783252452797', v_owner_id, 'Egg & Chicken Noodles (500 gm)', 'COC-ECN-669', 'Cocola Food Products Ltd C Group', 'uom-1783247459352', 66, 70, 85, 110, 0),
    ('prod-1783252618515', v_owner_id, 'Wafer Roll Jar (Chocolate)', 'COC-WRJ-863', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 56.75, 60, 0, 509, 0),
    ('prod-1783252776789', v_owner_id, 'Milky Milk-chocolate crispy Wafer Roll', 'COC-MMCW-866', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 180, 192, 10, 17, 0),
    ('prod-1783252925620', v_owner_id, 'Chocolate Cream Wafer Biscuit', 'COC-CCWB-555', 'Cocola Food Products Ltd C Group', 'uom-1783247459352', 15.42, 16.5, 20, 60, 0),
    ('prod-1783252986676', v_owner_id, 'Vanilla Cream Wafer Biscuit', 'COC-VCWB-231', 'Cocola Food Products Ltd C Group', 'uom-1783247459352', 15.42, 16.5, 20, 72, 0),
    ('prod-1783253041942', v_owner_id, 'Mini Cashew NutChocolate Wafer Biscuit', 'COC-MCNW-656', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 180, 192, 10, 4, 0),
    ('prod-1783253099116', v_owner_id, 'Choco Crunch Chips', 'COC-CCC-720', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 151.67, 160, 10, 45, 0),
    ('prod-1783253149272', v_owner_id, 'Choco Crunch (Jar)', 'COC-CC-983', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 70, 76, 90, 111, 0),
    ('prod-1783253199006', v_owner_id, 'Boom Boom Chocolate Gems', 'COC-BBCG-339', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 90, 96, 5, 23, 0),
    ('prod-1783253305060', v_owner_id, 'Fun & Joy (10 Pc)', 'COC-FJ-117', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 197.5, 210, 30, 73, 0),
    ('prod-1783253364151', v_owner_id, 'Fun & Joy (30 Pc)', 'COC-FJ-807', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 592.5, 630, 30, 29, 0),
    ('prod-1783253531821', v_owner_id, 'Cornetti Twin Chocolate Biscuit Cone', 'COC-CTCB-481', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 409.5, 440, 20, 13, 0),
    ('prod-1783253577817', v_owner_id, 'Cornetti Black & White Chocolate Biscuit Cone', 'COC-BW-968', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 409.5, 440, 20, 25, 0),
    ('prod-1783253694932', v_owner_id, 'Marshmallow (Doll)', 'COC-M-332', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 271.6, 300, 20, 23, 0),
    ('prod-1783253919739', v_owner_id, 'Momo Marshmallow', 'COC-MM-318', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 305.4, 330, 15, 12, 0),
    ('prod-1783253970863', v_owner_id, 'Jolly Lolly Lollipop', 'COC-JLL-148', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 90, 96, 5, 58, 0),
    ('prod-1783254034954', v_owner_id, 'Tatul Super Chutney (50 Pcs) FG', 'COC-TSC-490', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 180, 190, 5, 22, 0),
    ('prod-1783254095550', v_owner_id, 'Stick Noodles 20tk', 'COC-SN2-255', 'Cocola Food Products Ltd C Group', 'uom-1783247304023', 368.53, 390, 0, 20, 0),
    ('prod-1783254140956', v_owner_id, 'Stick Noodles 25tk', 'COC-SN2-357', 'Cocola Food Products Ltd C Group', 'uom-1783247304023', 452.74, 490, 0, 34, 0),
    ('prod-1783254197702', v_owner_id, 'Tiffin Rolls', 'COC-TR-979', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 180, 192, 10, 28, 0),
    ('prod-1783254246067', v_owner_id, 'Happy Ice lolly (Pouch)', 'COC-HIL-694', 'Cocola Food Products Ltd C Group', 'uom-1783251797413', 44.64, 48, 0, 0, 0),
    ('prod-1783254290329', v_owner_id, 'Mango Pops', 'COC-MP-524', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 168.75, 180, 5, 7, 0),
    ('prod-1783254334054', v_owner_id, 'Juicy Land Umbrella', 'COC-JLU-350', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 109.5, 117, 0, 24, 0),
    ('prod-1783254376345', v_owner_id, 'Juicy Land Dinosaur', 'COC-JLD-902', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 109.5, 117, 0, 21, 0),
    ('prod-1783254422621', v_owner_id, 'Choco Waffy 25pc', 'COC-CW2-983', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 187.5, 200, 10, 30, 0),
    ('prod-1783254471002', v_owner_id, 'Mango Ice Lolly', 'COC-MIL-193', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 182.5, 195, 0, 10, 0),
    ('prod-1783254524710', v_owner_id, 'Lychee Gel Jar 65psc', 'COC-LGJ6-393', 'Cocola Food Products Ltd C Group', 'uom-1783247549042', 91, 98, 0, 1, 0),
    ('prod-1784297523296', v_owner_id, 'Marks FCMP 1000gm Poly', 'ABU-MF1P-848', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 856.21, 883, 950, 23, 0),
    ('prod-1784297788297', v_owner_id, 'Marks FCMP 1000gm Tin', 'ABU-MF1T-367', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 1056, 1100, 1300, 6, 0),
    ('prod-1784298492160', v_owner_id, 'Marks FCMP 500gm', 'ABU-MF5-971', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 430.53, 444, 480, 0, 0),
    ('prod-1784298620609', v_owner_id, 'Marks FCMP 500gm with Sugar', 'ABU-MF5W-430', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 435.53, 449, 480, 409, 0),
    ('prod-1784307123505', v_owner_id, 'Marks FCMP 400gm', 'ABU-MF4-159', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 343.08, 354, 400, 42, 0),
    ('prod-1784307262821', v_owner_id, 'Marks FCMP 200gm', 'ABU-MF2-386', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 182.3, 188, 205, 218, 0),
    ('prod-1784307358053', v_owner_id, 'Marks FCMP 100gm', 'ABU-MF1-482', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 96, 99, 100, 56, 0),
    ('prod-1784307958965', v_owner_id, 'Marks FCMP 50gm', 'ABU-MF5-522', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 50.43, 52, 60, 72, 0),
    ('prod-1784308030495', v_owner_id, 'Marks FCMP 75gm', 'ABU-MF7-170', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 69.09, 71.25, 80, 18, 0),
    ('prod-1784308142934', v_owner_id, 'Marks FCMP 8gm', 'ABU-MF8-695', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 7.78, 8, 10, 804, 0),
    ('prod-1784308206921', v_owner_id, 'Marks Young Star 400gm', 'ABU-MYS4-766', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 360, 375, 425, 30, 0),
    ('prod-1784308277260', v_owner_id, 'Marks Gold 400gm', 'ABU-MG4-635', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 360, 375, 425, 6, 0),
    ('prod-1784308335452', v_owner_id, 'Marks Diet 400gm', 'ABU-MD4-102', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 360, 375, 425, 36, 0),
    ('prod-1784308387668', v_owner_id, 'Marks Active School 400gm', 'ABU-MAS4-223', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 360, 375, 425, 0, 0),
    ('prod-1784308428710', v_owner_id, 'Marks Chocolate Active School 400gm', 'ABU-MCAS-808', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 360, 375, 425, 6, 0),
    ('prod-1784308502216', v_owner_id, 'Marks Diet Tin 400gm', 'ABU-MDT4-717', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 1148, 1200, 1400, 3, 0),
    ('prod-1784308703034', v_owner_id, 'Ama FCMP 2000gm', 'ABU-AF2-789', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 1514.84, 1562, 1730, 24, 0),
    ('prod-1784308769833', v_owner_id, 'Ama FCMP 1000gm', 'ABU-AF1-121', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 762.27, 786, 870, 15, 0),
    ('prod-1784308831997', v_owner_id, 'Ama FCMP 500gm', 'ABU-AF5-172', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 391.81, 404, 450, 40, 0),
    ('prod-1784308923621', v_owner_id, 'Ama FCMP 200gm', 'ABU-AF2-596', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 159.05, 165, 190, 75, 0),
    ('prod-1784308996705', v_owner_id, 'Ama FCMP 100gm', 'ABU-AF1-156', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 79.04, 82, 100, 24, 0),
    ('prod-1784309093133', v_owner_id, 'Ama FCMP 50gm', 'ABU-AF5-136', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 41.46, 43, 50, 75, 0),
    ('prod-1784309268051', v_owner_id, 'Ama FCMP 10gm', 'ABU-AF1-667', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 7.71, 8, 10, 2976, 0),
    ('prod-1784349714138', v_owner_id, 'Ama Paper Cup 150ml', 'ABU-APC1-780', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297360115', 368.6, 380, 0, 2, 0),
    ('prod-1784349816077', v_owner_id, 'Ama Paper Cup 120ml', 'ABU-APC1-222', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297360115', 329.8, 340, 0, 3, 0),
    ('prod-1784350018364', v_owner_id, 'Ama Paper Cup 100ml', 'ABU-APC1-781', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297360115', 310.4, 330, 0, 3, 0),
    ('prod-1784350295577', v_owner_id, 'Ama Sugar Free Coffee 500gm', 'ABU-ASFC-609', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 305.24, 315, 375, 4, 0),
    ('prod-1784350683288', v_owner_id, 'Ama Sugar Free Coffee 15gm', 'ABU-ASFC-145', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 11.64, 12, 0, 192, 0),
    ('prod-1784350976217', v_owner_id, 'Ama Coffeemix 1000gm', 'ABU-AC1-108', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 416.5, 430, 500, 20, 0),
    ('prod-1784351127672', v_owner_id, 'Ama Classic Coffee 0.75gm', 'ABU-ACC0-467', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 2.4, 2.5, 3, 5904, 0),
    ('prod-1784351236848', v_owner_id, 'Ama Classic Coffee 1gm', 'ABU-ACC1-354', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 3.65, 3.8, 5, 2210, 0),
    ('prod-1784351378539', v_owner_id, 'Ama Coffeemix Stick 14gm', 'ABU-ACS1-925', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 8.25, 8.5, 10, 1224, 0),
    ('prod-1784351482121', v_owner_id, 'Aura Hot Chocolate 500gm', 'ABU-AHC5-761', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 208.25, 215, 260, 4, 0),
    ('prod-1784351581568', v_owner_id, 'Seylon Masala Raw Tea 1000gm', 'ABU-SMRT-179', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 300.1, 310, 370, 8, 0),
    ('prod-1784525514428', v_owner_id, 'Seylon Tea 14gm', 'ABU-ST1-813', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 7.81, 8.1, 10, 930, 0),
    ('prod-1784526297597', v_owner_id, 'Seylon Tea 50gm', 'ABU-ST5-936', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 22.8, 23.5, 30, 550, 0),
    ('prod-1784526774396', v_owner_id, 'Seylon Tea 100gm', 'ABU-ST1-287', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 44.53, 46, 60, 215, 0),
    ('prod-1784526942733', v_owner_id, 'Seylon Tea 200gm', 'ABU-ST2-201', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 89.1, 92, 120, 213, 0),
    ('prod-1784527103450', v_owner_id, 'Seylon Tea 400gm', 'ABU-ST4-266', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 176.24, 182, 225, 171, 0),
    ('prod-1784527266951', v_owner_id, 'Seylon PD Tea 500gm', 'ABU-SPT5-942', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 192.35, 199, 230, 104, 0),
    ('prod-1784527335125', v_owner_id, 'Seylon Gold Tea 500gm', 'ABU-SGT5-894', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 201.2, 208, 240, 85, 0),
    ('prod-1784527511122', v_owner_id, 'Seylon BOP Tea 500gm', 'ABU-SBT5-301', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 192.35, 199, 235, 46, 0),
    ('prod-1784527643549', v_owner_id, 'Seylon Bag In Bag', 'ABU-SBIB-805', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 57.7, 60, 75, 44, 0),
    ('prod-1784527759308', v_owner_id, 'Seylon Saver Pack', 'ABU-SSP-775', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 535.94, 560, 600, 4, 0),
    ('prod-1784527856144', v_owner_id, 'Seylon Pyramid Gold', 'ABU-SPG-362', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 68.6, 71, 90, 53, 0),
    ('prod-1784527988159', v_owner_id, 'Seylon Green Tea', 'ABU-SGT-375', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 82.15, 85, 120, 146, 0),
    ('prod-1784528269919', v_owner_id, 'Ama UHT Milk 1000ml', 'ABU-AUM1-577', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 103.4, 110, 130, 145, 0),
    ('prod-1784635440602', v_owner_id, 'Seylon Milk Tea 15gm', 'ABU-SMT1-243', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 7.52, 7.75, 10, 1056, 0),
    ('prod-1784635627096', v_owner_id, 'Seylon Milk Tea 1000gm', 'ABU-SMT1-207', 'Abul Khair Milk Products LTD Sky Group', 'uom-1784297380091', 387.4, 400, 470, 39, 0),
    ('prod-1784901919211', v_owner_id, 'Super Milk 5gm New', 'PRA-SM5-216', 'Pran Dairy Milkman Group', 'uom-1784297469418', 3.85, 4.04, 5, 0, 0)
  ON CONFLICT (id) DO UPDATE SET
    name          = EXCLUDED.name,
    sku           = EXCLUDED.sku,
    company       = EXCLUDED.company,
    uom_id        = EXCLUDED.uom_id,
    default_pp    = EXCLUDED.default_pp,
    default_wsp   = EXCLUDED.default_wsp,
    default_mrp   = EXCLUDED.default_mrp,
    current_stock = EXCLUDED.current_stock,
    damaged_stock = EXCLUDED.damaged_stock;

  RAISE NOTICE 'SUCCESS: Complete database setup completed for admin % without sales report / challans.', v_owner_id;
END $$;
