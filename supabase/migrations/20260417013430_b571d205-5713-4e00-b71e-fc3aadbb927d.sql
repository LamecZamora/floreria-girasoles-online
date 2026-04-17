
-- 1. Lock down user_roles: only admins can INSERT/UPDATE/DELETE
-- (Trigger handle_new_user runs as SECURITY DEFINER and bypasses RLS, so signup still works)

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all roles (in addition to users viewing their own)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Realtime authorization: restrict channel subscriptions
-- Enable RLS on realtime.messages and only allow authenticated users
-- to subscribe to topics that match their user_id, OR admins to any topic.

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Users can only subscribe to channels named with their own user_id (e.g. "orders:<uuid>")
-- Admins can subscribe to any channel (to receive new order notifications)
CREATE POLICY "Users subscribe to own channels, admins to all"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR realtime.topic() = 'orders:' || auth.uid()::text
);
