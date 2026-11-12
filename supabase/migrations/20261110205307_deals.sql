CREATE TABLE IF NOT EXISTS public.deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    handover_id uuid REFERENCES public.technical_handovers(id) ON DELETE SET NULL,
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    assigned_to uuid REFERENCES public.profiles(id) NOT NULL,
    team_id uuid REFERENCES public.teams(id),
    title text NOT NULL,
    service_description text,
    estimated_value numeric,
    currency text DEFAULT 'USD',
    expected_close_date date,
    stage text NOT NULL DEFAULT 'Opportunity Created',
    notes text,
    final_outcome text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.deals TO authenticated;

CREATE POLICY "Own read deals" ON public.deals
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Own insert deals" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Own update deals" ON public.deals
  FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
