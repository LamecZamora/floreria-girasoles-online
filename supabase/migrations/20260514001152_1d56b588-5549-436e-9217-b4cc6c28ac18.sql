-- Eliminar políticas duplicadas en el bucket product-images
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;