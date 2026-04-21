-- Remove the broad SELECT policy that allows listing all files in product-images.
-- The bucket remains public for direct file access via CDN URLs, but enumeration
-- (listing) is no longer allowed for anonymous/authenticated clients.
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- Clean up duplicate admin policies (older ones with spaces in name)
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;