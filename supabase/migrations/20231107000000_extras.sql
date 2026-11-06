CREATE TABLE IF NOT EXISTS public.saved_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, resource_id)
);
ALTER TABLE public.saved_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own saved resources" ON public.saved_resources;
CREATE POLICY "Users can view own saved resources" ON public.saved_resources FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own saved resources" ON public.saved_resources;
CREATE POLICY "Users can insert own saved resources" ON public.saved_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own saved resources" ON public.saved_resources;
CREATE POLICY "Users can delete own saved resources" ON public.saved_resources FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.update_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid REFERENCES public.updates(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(update_id, user_id)
);
ALTER TABLE public.update_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all views" ON public.update_views;
CREATE POLICY "Admins can view all views" ON public.update_views FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
DROP POLICY IF EXISTS "Users can insert views" ON public.update_views;
CREATE POLICY "Users can insert views" ON public.update_views FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.log_views(p_update_ids uuid[])
RETURNS void AS $$
BEGIN
  INSERT INTO public.update_views (update_id, user_id)
  SELECT unnest(p_update_ids), auth.uid()
  ON CONFLICT (update_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
