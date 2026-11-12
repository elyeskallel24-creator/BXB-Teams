-- 1. Create Businesses
CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES public.teams(id) NOT NULL,
    name text NOT NULL,
    industry text,
    country text,
    city text,
    website text,
    phone text,
    email text,
    description text,
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Create Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    full_name text NOT NULL,
    position text,
    email text,
    phone text,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 3. Create Leads
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES public.teams(id) NOT NULL,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    assigned_to uuid REFERENCES public.profiles(id),
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    stage text NOT NULL DEFAULT 'New Lead',
    priority text DEFAULT 'Medium',
    estimated_value numeric,
    next_follow_up date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Create Lead Stage History
CREATE TABLE IF NOT EXISTS public.lead_stage_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    changed_by uuid REFERENCES public.profiles(id) NOT NULL,
    old_stage text,
    new_stage text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;

-- Table Grants
GRANT SELECT, INSERT, UPDATE ON public.businesses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated;
GRANT SELECT, INSERT ON public.lead_stage_history TO authenticated;

-- Policies for Businesses
CREATE POLICY "Team read businesses" ON public.businesses FOR SELECT TO authenticated USING (team_id = public.get_my_team_id() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Team insert businesses" ON public.businesses FOR INSERT TO authenticated WITH CHECK (team_id = public.get_my_team_id());
CREATE POLICY "Team update businesses" ON public.businesses FOR UPDATE TO authenticated USING (team_id = public.get_my_team_id());

-- Policies for Contacts
CREATE POLICY "Team read contacts" ON public.contacts FOR SELECT TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE team_id = public.get_my_team_id()));
CREATE POLICY "Team insert contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE team_id = public.get_my_team_id()));
CREATE POLICY "Team update contacts" ON public.contacts FOR UPDATE TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE team_id = public.get_my_team_id()));

-- Policies for Leads
CREATE POLICY "Team read leads" ON public.leads FOR SELECT TO authenticated USING (team_id = public.get_my_team_id() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Team insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (team_id = public.get_my_team_id());
CREATE POLICY "Team update leads" ON public.leads FOR UPDATE TO authenticated USING (team_id = public.get_my_team_id());

-- Policies for Lead History
CREATE POLICY "Team read lead history" ON public.lead_stage_history FOR SELECT TO authenticated USING (lead_id IN (SELECT id FROM public.leads WHERE team_id = public.get_my_team_id()));
CREATE POLICY "Team insert lead history" ON public.lead_stage_history FOR INSERT TO authenticated WITH CHECK (lead_id IN (SELECT id FROM public.leads WHERE team_id = public.get_my_team_id()));

-- Trigger to log stage changes automatically
CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.lead_stage_history (lead_id, changed_by, old_stage, new_stage)
    VALUES (NEW.id, auth.uid(), OLD.stage, NEW.stage);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_lead_stage ON public.leads;
CREATE TRIGGER trg_log_lead_stage
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_stage_change();
