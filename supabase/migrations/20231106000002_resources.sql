CREATE POLICY "Admins can insert updates" ON public.updates FOR INSERT WITH CHECK (team_id = public.get_my_team_id() AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Admins can insert resources" ON public.resources FOR INSERT WITH CHECK (team_id = public.get_my_team_id() AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Admins can update resources" ON public.resources FOR UPDATE USING (team_id = public.get_my_team_id() AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Admins can delete resources" ON public.resources FOR DELETE USING (team_id = public.get_my_team_id() AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', false) ON CONFLICT DO NOTHING;
CREATE POLICY "Members can view resources files" ON storage.objects FOR SELECT USING (bucket_id = 'resources' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can upload resources files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
