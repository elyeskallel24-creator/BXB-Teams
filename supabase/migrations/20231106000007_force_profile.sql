DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'sales-0001@bxb-team.com' LIMIT 1;
  
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
    
    UPDATE public.allowed_user_ids SET is_used = true WHERE user_id_code = 'SALES-0001';
  END IF;
END $$;
