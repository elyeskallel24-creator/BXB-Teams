CREATE TABLE IF NOT EXISTS public.commercial_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
    representative_id uuid REFERENCES public.profiles(id),
    team_id uuid REFERENCES public.teams(id),
    compensation_basis text,
    calculation text,
    approval_status text NOT NULL DEFAULT 'Not Reviewed',
    agreement_reference text,
    relevant_date date,
    review_notes text,
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.commercial_records ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.commercial_records TO authenticated;

CREATE POLICY "Admins read commercial records" ON public.commercial_records
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins insert commercial records" ON public.commercial_records
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins update commercial records" ON public.commercial_records
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
