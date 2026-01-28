-- Ensure license_keys table has expected columns and admin RLS permissions

-- Add missing columns if the table existed before 0003 migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'license_keys' AND column_name = 'used_by'
  ) THEN
    ALTER TABLE public.license_keys ADD COLUMN used_by uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'license_keys' AND column_name = 'usage_start_time'
  ) THEN
    ALTER TABLE public.license_keys ADD COLUMN usage_start_time timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'license_keys' AND column_name = 'total_usage_seconds'
  ) THEN
    ALTER TABLE public.license_keys ADD COLUMN total_usage_seconds integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'license_keys' AND column_name = 'last_activity'
  ) THEN
    ALTER TABLE public.license_keys ADD COLUMN last_activity timestamptz;
  END IF;
END $$;

-- Helpful index for lookup by user
CREATE INDEX IF NOT EXISTS license_keys_used_by_idx ON public.license_keys(used_by);

-- RLS: allow admins to manage licenses while keeping read open to authenticated users
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- Select policy remains open to authenticated users
DROP POLICY IF EXISTS "Anyone can check license validity" ON public.license_keys;
CREATE POLICY "Anyone can check license validity" ON public.license_keys
  FOR SELECT
  TO authenticated
  USING (true);

-- Helper expression for admin check
DROP POLICY IF EXISTS "Admins can insert licenses" ON public.license_keys;
CREATE POLICY "Admins can insert licenses" ON public.license_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update licenses" ON public.license_keys;
CREATE POLICY "Admins can update licenses" ON public.license_keys
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

DROP POLICY IF EXISTS "Admins can delete licenses" ON public.license_keys;
CREATE POLICY "Admins can delete licenses" ON public.license_keys
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
