const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rcxkszqimhxzcbiehbvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeGtzenFpbWh4emNiaWVoYnZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQzMDM1NywiZXhwIjoyMTAyMDA2MzU3fQ.9dNVjSHtdIrf_tLl2XOpH4wbAAjhro-vopGyCwDWRBQ'
);

const backupPayload = require('./backup_data.json');

async function importFullBackup() {
  console.log('🚀 Starting Full Backup Import into Live Supabase Database...');

  const { data: usersData, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr || !usersData?.users?.length) {
    console.error('Error fetching users:', userErr);
    return;
  }

  const ownerIds = usersData.users.map(u => u.id);
  console.log(`Found ${ownerIds.length} system users:`, usersData.users.map(u => u.email));

  const rawData = backupPayload.data;

  for (const ownerId of ownerIds) {
    console.log(`\n======================================================`);
    console.log(`Processing complete import for owner: ${ownerId}`);
    console.log(`======================================================`);

    // 1. Settings
    if (rawData.settings) {
      console.log('Updating Shop Settings...');
      const { error: setErr } = await supabase
        .from('settings')
        .upsert({
          owner_id: ownerId,
          shop_name: rawData.settings.shopName || 'Samir Enterprise',
          shop_subbrand: rawData.settings.shopSubBrand || 'Dhaka & Chittagong Regional Hub',
          shop_logo: rawData.settings.shopLogo || '',
          language: rawData.settings.language || 'bn',
        }, { onConflict: 'owner_id' });
      if (setErr) console.error('Settings Error:', setErr);
      else console.log('✅ Settings saved.');
    }

    // 2. Companies
    if (rawData.companies && rawData.companies.length > 0) {
      console.log(`Importing ${rawData.companies.length} Companies...`);
      const companies = rawData.companies.map(c => ({
        id: c.id,
        owner_id: ownerId,
        name: c.name,
        contact_person: c.contactPerson || '',
        phone: c.phone || '',
        address: c.address || 'Gazipur, Bangladesh',
      }));
      const { error: compErr } = await supabase.from('companies').upsert(companies);
      if (compErr) console.error('Companies Error:', compErr);
      else console.log(`✅ ${companies.length} Companies upserted.`);
    }

    // 3. Units
    if (rawData.units && rawData.units.length > 0) {
      console.log(`Importing ${rawData.units.length} Units...`);
      const units = rawData.units.map(u => ({
        id: u.id,
        owner_id: ownerId,
        name: u.name,
        symbol: u.symbol || 'PCS',
        multiplier: Number(u.multiplier || 1),
      }));
      const { error: unitErr } = await supabase.from('units').upsert(units);
      if (unitErr) console.error('Units Error:', unitErr);
      else console.log(`✅ ${units.length} Units upserted.`);
    }

    // 4. Delivery Men
    if (rawData.deliveryMen && rawData.deliveryMen.length > 0) {
      console.log(`Importing ${rawData.deliveryMen.length} Delivery Men...`);
      const dms = rawData.deliveryMen.map(d => ({
        id: d.id,
        owner_id: ownerId,
        name: d.name.trim(),
        vehicle: d.vehicle || '',
        phone: d.phone || d.vehicle || '',
        assigned_company_ids: d.assignedCompanyIds || [],
      }));
      const { error: dmErr } = await supabase.from('delivery_men').upsert(dms);
      if (dmErr) console.error('Delivery Men Error:', dmErr);
      else console.log(`✅ ${dms.length} Delivery Men upserted.`);
    }

    // 5. SRs (Sales Representatives)
    if (rawData.srs && rawData.srs.length > 0) {
      console.log(`Importing ${rawData.srs.length} SRs...`);
      const srs = rawData.srs.map(s => ({
        id: s.id,
        owner_id: ownerId,
        name: s.name.trim(),
        phone: s.phone || '',
        commission_rate: Number(s.commissionRate || 0),
        assigned_company_ids: s.assignedCompanyIds || [],
        login_username: s.loginUsername || null,
        login_password: s.loginPassword || null,
        is_active: true,
      }));
      const { error: srErr } = await supabase.from('srs').upsert(srs);
      if (srErr) console.error('SRs Error:', srErr);
      else console.log(`✅ ${srs.length} SRs upserted.`);
    }

    // 6. Routes
    if (rawData.routes && rawData.routes.length > 0) {
      console.log(`Importing ${rawData.routes.length} Routes...`);
      const routes = rawData.routes.map(r => ({
        id: r.id,
        owner_id: ownerId,
        name: r.name,
        area: r.area || 'Tongi',
        territory: r.territory || 'Gazipur',
        assigned_sr_id: r.assignedSRId || null,
        assigned_delivery_man_id: r.assignedDeliveryManId || null,
      }));
      const { error: routeErr } = await supabase.from('routes').upsert(routes);
      if (routeErr) console.error('Routes Error:', routeErr);
      else console.log(`✅ ${routes.length} Routes upserted.`);
    }
  }

  console.log('\n🎉 ALL SRs, DELIVERY MEN, COMPANIES, ROUTES, UNITS & SETTINGS FULLY IMPORTED TO DATABASE!');
}

importFullBackup();
