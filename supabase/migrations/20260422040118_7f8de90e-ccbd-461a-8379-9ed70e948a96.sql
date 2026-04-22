CREATE OR REPLACE FUNCTION public.create_order(_items jsonb, _delivery_address text, _notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    -- Lock the product row to prevent concurrent overselling.
    SELECT price, name, stock, active
      INTO _price, _name, _available_stock, _is_active
    FROM public.products
    WHERE id = _product_id
    FOR UPDATE;

    IF _price IS NULL THEN
      RAISE EXCEPTION 'Unknown product: %', _product_id;
    END IF;

    IF NOT _is_active THEN
      RAISE EXCEPTION 'Product not available: %', _name;
    END IF;

    IF _available_stock < _quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %: only % available', _name, _available_stock;
    END IF;

    -- Decrement stock atomically within the locked row.
    UPDATE public.products
    SET stock = stock - _quantity
    WHERE id = _product_id;

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
$function$;