-- 1) Allow anonymous + authenticated SELECT on product-images bucket objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read for product-images'
  ) THEN
    CREATE POLICY "Public read for product-images"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- 2) Restrict realtime broadcasts on the profiles channel topic to the owning user.
-- Topic convention: 'profiles:<user_id>'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
      AND policyname = 'Users can subscribe to their own profile topic'
  ) THEN
    CREATE POLICY "Users can subscribe to their own profile topic"
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (
        (realtime.topic() LIKE 'profiles:%')
        AND (split_part(realtime.topic(), ':', 2) = auth.uid()::text)
      );
  END IF;
END $$;