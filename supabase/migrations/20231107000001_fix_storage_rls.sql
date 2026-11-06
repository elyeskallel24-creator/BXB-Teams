DROP POLICY IF EXISTS "Admins can upload resources files" ON storage.objects;
DROP POLICY IF EXISTS "Members can view resources files" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

CREATE POLICY "Authenticated users can view resources" ON storage.objects FOR SELECT USING (bucket_id = 'resources' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can upload resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);
