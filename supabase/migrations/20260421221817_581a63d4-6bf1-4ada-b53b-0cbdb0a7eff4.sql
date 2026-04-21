-- Restrict listing of product-images bucket to admins only.
-- Anyone can still READ individual files via public URLs (bucket remains public),
-- but they cannot enumerate the contents.
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public can list product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read product-images" ON storage.objects;

-- Allow only admins to LIST/SELECT bucket contents
CREATE POLICY "Admins can list product-images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

-- Restrict writes to admins
DROP POLICY IF EXISTS "Admins can upload product-images" ON storage.objects;
CREATE POLICY "Admins can upload product-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can update product-images" ON storage.objects;
CREATE POLICY "Admins can update product-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can delete product-images" ON storage.objects;
CREATE POLICY "Admins can delete product-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);