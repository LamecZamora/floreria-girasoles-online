
-- Lectura pública (bucket privado pero objetos legibles)
CREATE POLICY "Public can read review images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'review-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own review images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'review-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
