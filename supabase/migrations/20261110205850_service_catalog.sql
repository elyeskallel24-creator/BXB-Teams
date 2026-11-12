CREATE TABLE IF NOT EXISTS public.service_catalog (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text NOT NULL,
    short_description text,
    detailed_explanation text,
    problems_solved text,
    typical_clients text,
    example_use_cases text,
    required_info text,
    common_questions text,
    technical_limitations text,
    marketing_description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.service_catalog TO authenticated;

CREATE POLICY "Anyone reads services" ON public.service_catalog
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Only admins manage services" ON public.service_catalog
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
