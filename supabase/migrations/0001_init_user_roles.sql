-- ByteLatency initial schema: user_roles table and RLS policies

-- Criar tabela user_roles
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','user','pro')),
  created_at timestamptz default now(),
  unique(user_id)
);

create index if not exists user_roles_user_id_idx on public.user_roles(user_id);

alter table public.user_roles enable row level security;

-- Allow authenticated users to read their own role
drop policy if exists "select own role" on public.user_roles;
create policy "select own role" on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- By design, inserts/updates are performed by service role which bypasses RLS.
-- If you want to allow self-upgrade to 'pro' via verified payment, add explicit policies.
