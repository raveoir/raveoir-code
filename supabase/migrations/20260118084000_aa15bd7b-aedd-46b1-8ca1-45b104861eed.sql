-- Allow users to delete their own emails (sent or received)
CREATE POLICY "Users can delete their own emails"
ON public.emails
FOR DELETE
USING (
  (from_user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
  OR
  (to_user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
);