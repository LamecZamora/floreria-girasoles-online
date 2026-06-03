-- 1) UPDATE policy for review-images bucket (scoped to owning user folder)
CREATE POLICY "Users can update their own review images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'review-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'review-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2) Realtime channel policies for products and reviews
-- products: public catalog — anyone (anon + authenticated) may subscribe
CREATE POLICY "Anyone can subscribe to products channel"
ON realtime.messages
FOR SELECT
TO anon, authenticated
USING (realtime.topic() = 'products');

-- reviews: only authenticated users may subscribe (RLS still filters payload to approved rows)
CREATE POLICY "Authenticated users can subscribe to reviews channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (realtime.topic() = 'reviews');