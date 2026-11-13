ALTER TABLE public.audit_logs ALTER COLUMN table_name DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN record_id DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN actor_id DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN entity_type DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN entity_id DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN action DROP NOT NULL;
