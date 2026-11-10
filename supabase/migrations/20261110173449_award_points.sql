CREATE OR REPLACE FUNCTION public.award_points(target_user_id uuid, amount integer)
RETURNS void AS $$
BEGIN
  IF auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') THEN
    UPDATE public.profiles SET points = points + amount WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
