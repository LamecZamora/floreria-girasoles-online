
DROP POLICY IF EXISTS "Users subscribe to own channels, admins to all" ON realtime.messages;

CREATE POLICY "Users subscribe to own channels, admins to admin channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin') AND realtime.topic() = 'orders:admin')
  OR realtime.topic() = 'orders:' || auth.uid()::text
);
