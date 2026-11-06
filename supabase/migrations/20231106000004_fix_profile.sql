DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'sales-0001@bxb-team.com';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, team_id, user_id_code, username, role)
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'SALES-0001',
      'K8',
      'admin'
    ) ON CONFLICT (id) DO NOTHING;
    
    UPDATE public.allowed_user_ids SET is_used = true WHERE user_id_code = 'SALES-0001';
  END IF;
END $$;
