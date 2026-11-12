CREATE TABLE IF NOT EXISTS public.sales_playbooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    country text,
    language text DEFAULT 'English',
    target_industries text,
    prospecting_strategies text,
    communication_guidance text,
    calling_scripts text,
    email_templates text,
    messaging_templates text,
    discovery_questions text,
    common_objections text,
    market_examples text,
    compliance_guidance text,
    is_universal boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sales_playbooks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.sales_playbooks TO authenticated;

CREATE POLICY "Anyone reads active playbooks" ON public.sales_playbooks
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins manage playbooks" ON public.sales_playbooks
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
