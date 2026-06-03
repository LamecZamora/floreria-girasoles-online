DROP POLICY IF EXISTS "Anyone can subscribe to products channel" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can subscribe to reviews channel" ON realtime.messages;

CREATE POLICY "Anyone can subscribe to products channel"
ON realtime.messages
FOR SELECT
TO anon, authenticated
USING (realtime.topic() IN ('products', 'products-changes'));

CREATE POLICY "Authenticated users can subscribe to reviews channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (realtime.topic() IN ('reviews', 'reviews-changes'));