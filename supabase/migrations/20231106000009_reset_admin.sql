DELETE FROM public.profiles;
INSERT INTO public.profiles (id, team_id, user_id_code, username, role, avatar_url)
SELECT id, '00000000-0000-0000-0000-000000000000', 'SALES-0001', 'Admin', 'admin', 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin'
FROM auth.users WHERE email = 'sales-0001@bxb-team.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', username = 'Admin', user_id_code = 'SALES-0001', avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin';
