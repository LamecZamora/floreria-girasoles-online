
-- Allow users to subscribe to their own orders list channel; admins can subscribe to any.
CREATE POLICY "Users subscribe to own orders list, admins to any"
ON realtime.messages FOR SELECT TO authenticated
USING (
  (realtime.topic() LIKE 'orders:list:%' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR split_part(realtime.topic(), ':', 3) = auth.uid()::text
  ))
);

-- Allow admins to subscribe to the admin dashboard channel.
CREATE POLICY "Admins subscribe to admin dashboard channel"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() = 'admin:dashboard' AND has_role(auth.uid(), 'admin'::app_role)
);
