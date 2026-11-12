CREATE TABLE IF NOT EXISTS public.sales_targets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    target_type text NOT NULL,
    scope text NOT NULL DEFAULT 'individual',
    scope_id uuid,
    target_value integer NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.sales_targets TO authenticated;

CREATE POLICY "Read own or global targets" ON public.sales_targets
  FOR SELECT TO authenticated
  USING (
    scope = 'global'
    OR scope_id = auth.uid()
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Only admins create targets" ON public.sales_targets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Only admins update targets" ON public.sales_targets
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
