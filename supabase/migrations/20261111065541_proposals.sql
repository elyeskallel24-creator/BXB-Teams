CREATE TABLE IF NOT EXISTS public.proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
    business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    assigned_to uuid REFERENCES public.profiles(id),
    title text NOT NULL,
    client_details text,
    service_description text,
    proposed_solution text,
    scope_of_work text,
    deliverables text,
    exclusions text,
    estimated_timeline text,
    pricing numeric,
    currency text DEFAULT 'USD',
    payment_milestones text,
    maintenance_arrangements text,
    version integer NOT NULL DEFAULT 1,
    approval_status text NOT NULL DEFAULT 'Draft',
    expiration_date date,
    approved_by uuid REFERENCES public.profiles(id),
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proposal_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
    version integer NOT NULL,
    snapshot jsonb NOT NULL,
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proposal_approvals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
    requested_by uuid REFERENCES public.profiles(id) NOT NULL,
    reviewed_by uuid REFERENCES public.profiles(id),
    decision text NOT NULL DEFAULT 'Pending',
    comments text,
    created_at timestamptz DEFAULT now(),
    reviewed_at timestamptz
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_approvals ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.proposals TO authenticated;
GRANT SELECT, INSERT ON public.proposal_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.proposal_approvals TO authenticated;

CREATE POLICY "Own read proposals" ON public.proposals
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR deal_id IN (SELECT id FROM public.deals WHERE created_by = auth.uid() OR assigned_to = auth.uid())
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Own insert proposals" ON public.proposals
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Own update proposals" ON public.proposals
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Read versions" ON public.proposal_versions
  FOR SELECT TO authenticated
  USING (
    proposal_id IN (SELECT id FROM public.proposals WHERE created_by = auth.uid() OR assigned_to = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  );

CREATE POLICY "Insert versions" ON public.proposal_versions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Read approvals" ON public.proposal_approvals
  FOR SELECT TO authenticated
  USING (
    proposal_id IN (SELECT id FROM public.proposals WHERE created_by = auth.uid() OR assigned_to = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  );

CREATE POLICY "Insert approvals" ON public.proposal_approvals
  FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admin update approvals" ON public.proposal_approvals
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
