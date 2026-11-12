CREATE TABLE IF NOT EXISTS public.meetings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    assigned_to uuid REFERENCES public.profiles(id) NOT NULL,
    title text NOT NULL,
    meeting_type text,
    meeting_date date NOT NULL,
    start_time time NOT NULL,
    end_time time,
    timezone text DEFAULT 'UTC',
    meeting_link text,
    location text,
    status text NOT NULL DEFAULT 'Proposed',
    notes text,
    outcome text,
    next_action text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.meetings TO authenticated;

CREATE POLICY "Own read meetings" ON public.meetings
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Own insert meetings" ON public.meetings
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Own update meetings" ON public.meetings
  FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
