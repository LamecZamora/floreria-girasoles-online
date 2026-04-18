
-- ============================================================
-- 1. PROFILES: Restrict SELECT to owner + admin
-- ============================================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. Remove hardcoded admin email from handle_new_user trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- All new users get the 'user' role. Admin role is granted out-of-band.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;

-- ============================================================
-- 3. Server-side product price catalog (anti price-tampering)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_prices (
  product_id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

-- Anyone (even anonymous) can read the catalog (it's public product info)
CREATE POLICY "Anyone can view product prices"
ON public.product_prices
FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can modify the catalog
CREATE POLICY "Only admins can insert product prices"
ON public.product_prices
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update product prices"
ON public.product_prices
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete product prices"
ON public.product_prices
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. create_order RPC: server-authoritative total
--    Clients send only product_id + quantity. Server looks up
--    prices, computes total, and inserts the order.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_order(
  _items jsonb,
  _delivery_address text,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _item jsonb;
  _product_id text;
  _quantity int;
  _price numeric;
  _name text;
  _total numeric := 0;
  _enriched_items jsonb := '[]'::jsonb;
  _order_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  IF jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Too many items in cart';
  END IF;

  IF _delivery_address IS NULL OR length(trim(_delivery_address)) < 8 THEN
    RAISE EXCEPTION 'Invalid delivery address';
  END IF;

  IF length(_delivery_address) > 500 THEN
    RAISE EXCEPTION 'Delivery address too long';
  END IF;

  IF _notes IS NOT NULL AND length(_notes) > 1000 THEN
    RAISE EXCEPTION 'Notes too long';
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _product_id := _item->>'id';
    _quantity := (_item->>'quantity')::int;

    IF _product_id IS NULL OR _quantity IS NULL OR _quantity < 1 OR _quantity > 100 THEN
      RAISE EXCEPTION 'Invalid item entry';
    END IF;

    SELECT price, name INTO _price, _name
    FROM public.product_prices
    WHERE product_id = _product_id;

    IF _price IS NULL THEN
      RAISE EXCEPTION 'Unknown product: %', _product_id;
    END IF;

    _total := _total + (_price * _quantity);
    _enriched_items := _enriched_items || jsonb_build_object(
      'id', _product_id,
      'name', _name,
      'price', _price,
      'quantity', _quantity
    );
  END LOOP;

  INSERT INTO public.orders (user_id, items, total, status, delivery_address, notes)
  VALUES (_user_id, _enriched_items, _total, 'pendiente', trim(_delivery_address), NULLIF(trim(coalesce(_notes,'')), ''))
  RETURNING id INTO _order_id;

  RETURN _order_id;
END;
$$;

-- Block direct client INSERTs into orders. Only the SECURITY DEFINER
-- function (which runs with elevated rights) can create orders.
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
