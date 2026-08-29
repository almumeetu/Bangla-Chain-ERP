const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rcxkszqimhxzcbiehbvx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeGtzenFpbWh4emNiaWVoYnZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQzMDM1NywiZXhwIjoyMTAyMDA2MzU3fQ.9dNVjSHtdIrf_tLl2XOpH4wbAAjhro-vopGyCwDWRBQ'
);

async function check() {
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  console.log('Users:', users?.users?.map(u => ({ id: u.id, email: u.email })));
  const { data: settings } = await supabase.from('settings').select('*');
  console.log('Settings:', settings);
  const { data: companies } = await supabase.from('companies').select('*');
  console.log('Companies:', companies);
}

check();
