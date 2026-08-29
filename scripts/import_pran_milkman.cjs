const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rcxkszqimhxzcbiehbvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeGtzenFpbWh4emNiaWVoYnZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQzMDM1NywiZXhwIjoyMTAyMDA2MzU3fQ.9dNVjSHtdIrf_tLl2XOpH4wbAAjhro-vopGyCwDWRBQ'
);

const TARGET_DATE = '2026-05-31T00:00:00.000Z';
const COMPANY_NAME = 'Pran Dairy Ltd Milkman Group';

const rawProducts = [
  { sl: 1, name: 'Milkman UHT 200ml', unit: 'PCS', dp: 24.25, tp: 25.67, stock: 30 },
  { sl: 2, name: 'Milkman UHT 500ml', unit: 'PCS', dp: 48.19, tp: 51.25, stock: 62 },
  { sl: 3, name: 'Pran FCMP 10gm', unit: 'Hanger', dp: 85.72, tp: 90.0, stock: 270 },
  { sl: 4, name: 'Pran Milk Powder 50gm Chain', unit: 'PCS', dp: 39.18, tp: 41.14, stock: 30 },
  { sl: 5, name: 'Pran Milk Powder 200gm', unit: 'PCS', dp: 176.2, tp: 185.0, stock: 0 },
  { sl: 6, name: 'Pran Milk Powder 400gm', unit: 'PCS', dp: 334.5, tp: 351.3, stock: 0 },
  { sl: 7, name: 'Pran Milk Powder 500gm', unit: 'PCS', dp: 407.0, tp: 428.0, stock: 0 },
  { sl: 8, name: 'Pran Milk Powder 1000gm', unit: 'PCS', dp: 828.5, tp: 870.0, stock: 0 },
  { sl: 9, name: 'Pran Full Cream Milk Powder 200gm', unit: 'PCS', dp: 170.52, tp: 180.0, stock: 57 },
  { sl: 10, name: 'Pran Full Cream Milk Powder 400gm', unit: 'PCS', dp: 308.77, tp: 324.21, stock: 38 },
  { sl: 11, name: 'Pran Full Cream Milk Powder 500gm', unit: 'PCS', dp: 385.58, tp: 405.0, stock: 1 },
  { sl: 12, name: 'Pran Full Cream Milk Powder 1000gm', unit: 'PCS', dp: 828.5, tp: 870.0, stock: 0 },
  { sl: 13, name: 'Super Milk 200gm', unit: 'PCS', dp: 132.0, tp: 140.0, stock: 17 },
  { sl: 14, name: 'Super Milk 500gm', unit: 'PCS', dp: 304.62, tp: 320.0, stock: 122 },
  { sl: 15, name: 'Super Milk 1000gm', unit: 'PCS', dp: 585.12, tp: 615.0, stock: 83 },
  { sl: 16, name: 'Super Milk 5gm', unit: 'Hanger', dp: 48.0, tp: 48.5, stock: 0 },
  { sl: 17, name: 'Pran Premium Ghee 100gm', unit: 'PCS', dp: 149.84, tp: 160.0, stock: 731 },
  { sl: 18, name: 'Pran Premium Ghee 200gm', unit: 'PCS', dp: 284.88, tp: 300.0, stock: 398 },
  { sl: 19, name: 'Pran Premium Ghee 450gm', unit: 'PCS', dp: 641.0, tp: 680.0, stock: 142 },
  { sl: 20, name: 'Pran Premium Ghee 1000gm', unit: 'PCS', dp: 1318.0, tp: 1420.0, stock: 39 },
  { sl: 21, name: 'Pran Premium Ghee 1000gm(Without C)', unit: 'PCS', dp: 1315.0, tp: 1410.0, stock: 0 },
  { sl: 22, name: 'Active+ Orange (DP: 125.6)', unit: 'Box', dp: 125.6, tp: 132.0, stock: 0 },
  { sl: 23, name: 'Active+ Lemon (DP: 125.6)', unit: 'Box', dp: 125.6, tp: 132.0, stock: 0 },
  { sl: 24, name: 'Mango Fruit Drink 150ml', unit: 'Box', dp: 90.35, tp: 96.0, stock: 0 },
  { sl: 25, name: 'Mango Fruit Drink 200ml', unit: 'Box', dp: 110.34, tp: 116.67, stock: 374 },
  { sl: 26, name: 'Pran Lacchi 200ml TBA', unit: 'PCS', dp: 12.0, tp: 12.5, stock: 0 },
  { sl: 27, name: 'Orange Fruit Drink 200ml', unit: 'Box', dp: 114.29, tp: 120.0, stock: 8 },
  { sl: 28, name: 'Pran Premium Ghee 400gm', unit: 'PCS', dp: 590.0, tp: 590.0, stock: 0 },
  { sl: 29, name: 'Pran FCMP 10gm new', unit: 'Hanger', dp: 87.27, tp: 92.0, stock: 550 },
  { sl: 30, name: 'Active+ Orange (DP: 102.46)', unit: 'Box', dp: 102.46, tp: 132.0, stock: 0 },
  { sl: 31, name: 'Active+ Lemon (DP: 100.53)', unit: 'Box', dp: 100.53, tp: 132.0, stock: 0 },
  { sl: 32, name: 'Active+ Orange (DP: 107 / TP: 132)', unit: 'Box', dp: 107.0, tp: 132.0, stock: 0 },
  { sl: 33, name: 'Active+ Lemon (DP: 107 / TP: 114)', unit: 'Box', dp: 107.0, tp: 114.0, stock: 268 },
  { sl: 34, name: 'Active+ Orange (DP: 107 / TP: 114)', unit: 'Box', dp: 107.0, tp: 114.0, stock: 165 },
  { sl: 35, name: 'Pran Matha 200ml', unit: 'Case', dp: 548.352, tp: 580.0, stock: 34 },
  { sl: 36, name: 'Super Milk 5gm New', unit: 'Hanger', dp: 46.16, tp: 48.5, stock: 793 },
  { sl: 37, name: 'Maccho Chocolate Drink 150ml', unit: 'Box', dp: 158.0, tp: 168.0, stock: 41 },
];

function generateSku(name, sl) {
  const clean = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  return `PRAN-${clean}-${sl}`;
}

async function runImport() {
  console.log('🚀 Starting import for Pran Milkman Group (Date: 31/05/2026)...');

  const { data: usersData, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr || !usersData?.users?.length) {
    console.error('Error fetching users:', userErr);
    return;
  }

  const ownerIds = usersData.users.map(u => u.id);
  console.log(`Found ${ownerIds.length} system users:`, usersData.users.map(u => u.email));

  for (const ownerId of ownerIds) {
    console.log(`\nProcessing for owner: ${ownerId}...`);

    // Ensure company exists for this owner
    const compId = `comp-pran-milkman-${ownerId.slice(0, 8)}`;
    const { error: compErr } = await supabase.from('companies').upsert({
      id: compId,
      owner_id: ownerId,
      name: COMPANY_NAME,
      contact_person: 'Md Shaown',
      phone: '01704141903',
      address: 'Joydevpur, Gazipur',
      created_at: TARGET_DATE,
    });
    if (compErr) console.error('Company upsert error:', compErr);

    // Also ensure alias 'Pran Milkman Group' company name works
    const { error: compErr2 } = await supabase.from('companies').upsert({
      id: `comp-pran-group-${ownerId.slice(0, 8)}`,
      owner_id: ownerId,
      name: 'Pran Milkman Group',
      contact_person: 'Md Shaown',
      phone: '01704141903',
      address: 'Joydevpur, Gazipur',
      created_at: TARGET_DATE,
    });
    if (compErr2) console.error('Company alias upsert error:', compErr2);

    // Format products
    const productRows = rawProducts.map((p, idx) => {
      const prodId = `prod-pran-milk-${ownerId.slice(0, 4)}-${p.sl}`;
      return {
        id: prodId,
        owner_id: ownerId,
        name: p.name,
        sku: generateSku(p.name, p.sl),
        company: COMPANY_NAME,
        default_pp: Number(p.dp.toFixed(3)),
        default_wsp: Number(p.tp.toFixed(3)),
        default_mrp: Number(p.tp.toFixed(3)),
        current_stock: p.stock,
        damaged_stock: 0,
        carton_size: p.unit === 'Case' ? 24 : p.unit === 'Box' ? 12 : 24,
        price_per_piece: p.tp,
        price_per_carton: p.unit === 'Case' ? p.tp : (p.unit === 'Box' ? p.tp * 12 : p.tp * 24),
        primary_unit: p.unit === 'Case' || p.unit === 'Box' ? 'Piece' : 'Piece',
        stock_alert_threshold: 10,
        created_at: TARGET_DATE,
      };
    });

    const { data: inserted, error: prodErr } = await supabase.from('products').upsert(productRows);
    if (prodErr) {
      console.error(`Error inserting products for ${ownerId}:`, prodErr);
    } else {
      console.log(`✅ Successfully added/updated ${productRows.length} products for user ${ownerId}`);
    }
  }

  console.log('\n🎉 ALL 37 PRODUCTS FROM 31/05/2026 LIVE UPDATED SUCCESSFULLY!');
}

runImport();
