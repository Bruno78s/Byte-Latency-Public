import { createClient } from '@supabase/supabase-js';

try { await import('dotenv/config'); } catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAdmin() {
  const email = 'brunoquirin3@gmail.com';
  
  console.log('=== CHECKING ADMIN STATUS ===\n');
  
  // 1. Get user ID
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log(`✓ User ID: ${user.id}\n`);
  
  // 2. Check with SERVICE ROLE (bypasses RLS)
  console.log('--- SERVICE ROLE CHECK (bypasses RLS) ---');
  const { data: serviceRoles, error: serviceError } = await adminClient
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id);
  
  console.log('Service Role Result:', serviceRoles);
  console.log('Service Role Error:', serviceError);
  
  // 3. Check RLS policies
  console.log('\n--- RLS POLICIES ---');
  const { data: policies } = await adminClient
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'user_roles');
  
  console.log('Policies on user_roles:');
  policies?.forEach(p => {
    console.log(`  - ${p.policyname} (${p.cmd})`);
  });
  
  // 4. Simulate what the app would do (with anon key + auth)
  console.log('\n--- SIMULATING APP AUTH ---');
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: email,
    password: 'test123' // You'll need to know the password or this will fail
  });
  
  if (signInError) {
    console.log('Cannot test auth query (need password):', signInError.message);
    console.log('\nTRY THIS MANUALLY IN YOUR APP CONSOLE:');
    console.log(`
const { data, error } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', '${user.id}')
  .eq('role', 'admin')
  .maybeSingle();

console.log('Admin query result:', data, error);
    `);
  } else {
    const { data: authRoles, error: authError } = await anonClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    console.log('Auth Query Result:', authRoles);
    console.log('Auth Query Error:', authError);
  }
}

checkAdmin();
