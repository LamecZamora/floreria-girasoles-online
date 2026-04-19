DO $$
DECLARE
  _admin_id uuid;
  _existing_target_id uuid;
  _new_email text := 'cemallamec0204@gmail.com';
  -- bcrypt hash for password 'Gr!s0l$2026_Adm!n' (cost 10)
  _new_password text := 'Gr!s0l$2026_Adm!n';
BEGIN
  -- Find an existing admin user
  SELECT ur.user_id INTO _admin_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at ASC
  LIMIT 1;

  -- Check if target email already exists
  SELECT id INTO _existing_target_id
  FROM auth.users
  WHERE lower(email) = lower(_new_email)
  LIMIT 1;

  IF _existing_target_id IS NOT NULL THEN
    -- Target email already exists: just update password, confirm email and ensure admin role
    UPDATE auth.users
    SET 
      encrypted_password = crypt(_new_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = _existing_target_id;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (_existing_target_id, 'admin')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Updated existing user % as admin', _existing_target_id;

  ELSIF _admin_id IS NOT NULL THEN
    -- Update the existing admin's email + password
    UPDATE auth.users
    SET 
      email = _new_email,
      encrypted_password = crypt(_new_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = _admin_id;

    -- Also update identities table if email provider exists
    UPDATE auth.identities
    SET 
      identity_data = jsonb_set(identity_data, '{email}', to_jsonb(_new_email)),
      email = _new_email,
      updated_at = now()
    WHERE user_id = _admin_id AND provider = 'email';

    RAISE NOTICE 'Updated admin % to email %', _admin_id, _new_email;
  ELSE
    RAISE NOTICE 'No admin user found to update';
  END IF;
END $$;