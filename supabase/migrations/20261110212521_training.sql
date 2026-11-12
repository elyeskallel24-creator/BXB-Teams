CREATE TABLE IF NOT EXISTS public.training_modules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category text NOT NULL DEFAULT 'General',
    content text,
    video_url text,
    pdf_url text,
    estimated_minutes integer DEFAULT 15,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    module_id uuid REFERENCES public.training_modules(id) ON DELETE CASCADE NOT NULL,
    status text NOT NULL DEFAULT 'Not Started',
    score integer,
    completed_at timestamptz,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, module_id)
);

ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.training_modules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.training_progress TO authenticated;

CREATE POLICY "Anyone reads active training" ON public.training_modules
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage training" ON public.training_modules
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Own read progress" ON public.training_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Own upsert progress" ON public.training_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Own update progress" ON public.training_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
