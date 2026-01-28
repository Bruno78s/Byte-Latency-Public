-- Criar tabela license_keys se não existir
create table if not exists public.license_keys (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  is_used boolean default false,
  used_by uuid,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  activated_at timestamptz
);

-- Habilitar RLS
alter table public.license_keys enable row level security;

-- Políticas RLS
drop policy if exists "Anyone can check license validity" on public.license_keys;
create policy "Anyone can check license validity" on public.license_keys
  for select
  to authenticated
  using (true);

-- Função para resgatar license key
create or replace function public.redeem_license_key(p_key text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_license record;
  v_user_id uuid;
begin
  -- Pegar ID do usuário autenticado
  v_user_id := auth.uid();
  
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Usuário não autenticado');
  end if;

  -- Buscar a licença (case insensitive e trim)
  select * into v_license
  from public.license_keys
  where upper(trim(key)) = upper(trim(p_key))
  for update;

  -- Verificar se a key existe
  if not found then
    return jsonb_build_object('success', false, 'message', 'Key inválida');
  end if;

  -- Verificar se já foi usada
  if v_license.is_used = true then
    return jsonb_build_object('success', false, 'message', 'Key já utilizada');
  end if;

  -- Verificar se expirou
  if v_license.expires_at < now() then
    return jsonb_build_object('success', false, 'message', 'Key expirada');
  end if;

  -- Marcar como usada
  update public.license_keys
  set 
    is_used = true,
    used_by = v_user_id,
    activated_at = now()
  where id = v_license.id;

  return jsonb_build_object(
    'success', true, 
    'message', 'Licença ativada com sucesso!',
    'expires_at', v_license.expires_at
  );
end;
$$;

-- Grant execute para authenticated users
grant execute on function public.redeem_license_key(text) to authenticated;
