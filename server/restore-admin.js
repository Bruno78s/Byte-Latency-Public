import { createClient } from '@supabase/supabase-js';

try { await import('dotenv/config'); } catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function restoreAdmin() {
  try {
    const email = 'brunoquirin3@gmail.com';
    
    console.log(`Restoring admin for: ${email}`);

    // Get user by email
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    if (getUserError) throw getUserError;

    const user = users.find(u => u.email === email);
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.id}`);

    // Primeiro deletar quaisquer roles existentes para este usuário
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Inserir role de admin
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'admin' });

    if (insertError) throw insertError;

    console.log(`✓ Admin role restored for ${email}`);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

restoreAdmin();
