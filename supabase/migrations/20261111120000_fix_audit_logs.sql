ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id uuid;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_value jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_value jsonb;
