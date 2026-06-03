
-- 1. FIX CRÍTICO: restaurar EXECUTE de has_role para anon y authenticated.
-- La función es SECURITY DEFINER y solo lee user_roles, es seguro exponerla.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

-- 2. Agregar fecha de entrega a orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_date date;

-- 3. Recrear create_order para aceptar y validar delivery_date (mínimo +10 días)
CREATE OR REPLACE FUNCTION public.create_order(
  _items jsonb,
  _delivery_address text,
  _delivery_date date,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _item jsonb;
  _product_id text;
  _quantity int;
  _price numeric;
  _name text;
  _available_stock int;
  _is_active boolean;
  _total numeric := 0;
  _enriched_items jsonb := '[]'::jsonb;
  _order_id uuid;
  _min_date date := (current_date + INTERVAL '10 days')::date;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Cart is empty'; END IF;
  IF jsonb_array_length(_items) > 50 THEN RAISE EXCEPTION 'Too many items in cart'; END IF;
  IF _delivery_address IS NULL OR length(trim(_delivery_address)) < 8 THEN RAISE EXCEPTION 'Invalid delivery address'; END IF;
  IF length(_delivery_address) > 500 THEN RAISE EXCEPTION 'Delivery address too long'; END IF;
  IF _notes IS NOT NULL AND length(_notes) > 1000 THEN RAISE EXCEPTION 'Notes too long'; END IF;
  IF _delivery_date IS NULL THEN RAISE EXCEPTION 'Delivery date required'; END IF;
  IF _delivery_date < _min_date THEN
    RAISE EXCEPTION 'Delivery date must be at least 10 days from today (minimum: %)', _min_date;
  END IF;
  IF _delivery_date > (current_date + INTERVAL '1 year')::date THEN
    RAISE EXCEPTION 'Delivery date too far in the future';
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _product_id := _item->>'id';
    _quantity := (_item->>'quantity')::int;
    IF _product_id IS NULL OR _quantity IS NULL OR _quantity < 1 OR _quantity > 100 THEN
      RAISE EXCEPTION 'Invalid item entry';
    END IF;
    SELECT price, name, stock, active INTO _price, _name, _available_stock, _is_active
      FROM public.products WHERE id = _product_id FOR UPDATE;
    IF _price IS NULL THEN RAISE EXCEPTION 'Unknown product: %', _product_id; END IF;
    IF NOT _is_active THEN RAISE EXCEPTION 'Product not available: %', _name; END IF;
    IF _available_stock < _quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %: only % available', _name, _available_stock;
    END IF;
    UPDATE public.products SET stock = stock - _quantity WHERE id = _product_id;
    _total := _total + (_price * _quantity);
    _enriched_items := _enriched_items || jsonb_build_object(
      'id', _product_id, 'name', _name, 'price', _price, 'quantity', _quantity
    );
  END LOOP;

  INSERT INTO public.orders (user_id, items, total, status, delivery_address, delivery_date, notes)
  VALUES (_user_id, _enriched_items, _total, 'pendiente', trim(_delivery_address), _delivery_date,
          NULLIF(trim(coalesce(_notes,'')), ''))
  RETURNING id INTO _order_id;
  RETURN _order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order(jsonb, text, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(jsonb, text, date, text) TO authenticated;
-- Eliminar variante antigua sin fecha
DROP FUNCTION IF EXISTS public.create_order(jsonb, text, text);

-- 4. Tabla de reseñas (comentarios + foto + estrellas)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (length(comment) BETWEEN 5 AND 1000),
  image_url text,
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Lectura pública solo aprobadas
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  USING (approved = true OR has_role(auth.uid(), 'admin'));

-- Solo usuarios con un pedido ENTREGADO pueden insertar
CREATE POLICY "Customers with delivered orders can insert review"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.user_id = auth.uid() AND o.status = 'entregado'
    )
  );

-- El usuario puede editar/borrar su propia reseña
CREATE POLICY "Users can update their own review"
  ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review"
  ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins gestionan todo
CREATE POLICY "Admins manage all reviews"
  ON public.reviews FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
