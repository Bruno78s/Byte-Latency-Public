                            -- Fix license_keys table structure
-- This migration ensures the table has the correct columns

-- Recreate the license_keys table with the correct structure
DROP TABLE IF EXISTS public.license_keys CASCADE;

CREATE TABLE public.license_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  is_used boolean DEFAULT false,
  used_by uuid REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  activated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can check license validity"
  ON public.license_keys
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert licenses"
  ON public.license_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can update licenses"
  ON public.license_keys
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete licenses"
  ON public.license_keys
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Recreate the function
CREATE OR REPLACE FUNCTION public.redeem_license_key(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_license record;
  v_user_id uuid;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Usuário não autenticado');
  END IF;

  -- Look up the license (case insensitive and trimmed)
  SELECT * INTO v_license
  FROM public.license_keys
  WHERE UPPER(TRIM(key)) = UPPER(TRIM(p_key))
  FOR UPDATE;

  -- Check if key exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Key inválida');
  END IF;

  -- Check if already used
  IF v_license.is_used = true THEN
    RETURN jsonb_build_object('success', false, 'message', 'Key já utilizada');
  END IF;

  -- Check if expired
  IF v_license.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Key expirada');
  END IF;

  -- Mark as used
  UPDATE public.license_keys
  SET 
    is_used = true,
    used_by = v_user_id,
    activated_at = NOW()
  WHERE id = v_license.id;

  -- Create subscription for user
  INSERT INTO public.subscriptions (user_id, expires_at)
  VALUES (v_user_id, v_license.expires_at)
  ON CONFLICT (user_id) DO UPDATE
  SET expires_at = v_license.expires_at;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Licença ativada com sucesso!',
    'expires_at', v_license.expires_at
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.redeem_license_key(text) TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS license_keys_used_by_idx ON public.license_keys(used_by);
CREATE INDEX IF NOT EXISTS license_keys_key_idx ON public.license_keys(key);
