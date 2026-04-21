-- See /tmp/migration.sql; pasted inline below
-- ============================================================
-- FASE 1: Productos en BD + Storage + Segundo admin
-- ============================================================

-- 1) Tabla products
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image text NOT NULL,
  category text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
CREATE POLICY "Only admins can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can update products" ON public.products;
CREATE POLICY "Only admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;
CREATE POLICY "Only admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Sincronizar product_prices con products (usado por create_order)
CREATE OR REPLACE FUNCTION public.sync_product_prices()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.product_prices WHERE product_id = OLD.id;
    RETURN OLD;
  ELSE
    INSERT INTO public.product_prices (product_id, name, price)
    VALUES (NEW.id, NEW.name, NEW.price)
    ON CONFLICT (product_id) DO UPDATE SET
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      updated_at = now();
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS sync_product_prices_trigger ON public.products;
CREATE TRIGGER sync_product_prices_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_prices();

-- 3) Storage bucket para imágenes nuevas de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- 4) Crear segundo admin floreriagirasoles1524@gmail.com
DO $$
DECLARE
  _new_admin_id uuid;
  _email text := 'floreriagirasoles1524@gmail.com';
  _password text := 'Gr!s0l$2026_Adm!n';
BEGIN
  SELECT id INTO _new_admin_id FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;

  IF _new_admin_id IS NULL THEN
    _new_admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      aud, role, created_at, updated_at
    ) VALUES (
      _new_admin_id,
      '00000000-0000-0000-0000-000000000000',
      _email,
      crypt(_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers',ARRAY['email']),
      jsonb_build_object('full_name','Administrador Florería'),
      'authenticated','authenticated', now(), now()
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
    VALUES (
      gen_random_uuid(), _new_admin_id,
      jsonb_build_object('sub', _new_admin_id::text, 'email', _email, 'email_verified', true),
      'email', _new_admin_id::text, now(), now(), now()
    );

    INSERT INTO public.profiles (user_id, full_name) VALUES (_new_admin_id, 'Administrador Florería')
      ON CONFLICT DO NOTHING;
  ELSE
    UPDATE auth.users SET
      encrypted_password = crypt(_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = _new_admin_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_new_admin_id, 'admin')
    ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Admin % ready (id %)', _email, _new_admin_id;
END $$;