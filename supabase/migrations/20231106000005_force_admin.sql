DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, team_id, user_id_code, username, role, avatar_url)
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'SALES-0001',
      'Admin',
      'admin',
      'https://api.dicebear.com/7.x/bottts/svg?seed=Admin'
    ) ON CONFLICT (id) DO UPDATE SET role = 'admin', username = 'Admin', avatar_url = 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin';
  END IF;
END $$;
