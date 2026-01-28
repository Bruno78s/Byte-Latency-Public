-- Criar tabela profiles se não existir e adicionar campos faltantes
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text,
  email text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Adicionar bio se a coluna não existir (para bancos existentes)
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'bio'
  ) then
    alter table public.profiles add column bio text;
  end if;
end $$;

-- Adicionar updated_at se não existir
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'updated_at'
  ) then
    alter table public.profiles add column updated_at timestamptz default now();
  end if;
end $$;

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Políticas RLS para profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Criar trigger para auto-criar profile quando usuário se registra
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

-- Remover trigger antigo se existir
drop trigger if exists on_auth_user_created on auth.users;

-- Criar trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
