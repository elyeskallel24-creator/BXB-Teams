-- service_catalog: RLS policy "Only admins manage services" already restricts
-- INSERT/UPDATE/DELETE to admins, but the table-level GRANT was never issued
-- for this table (it was created after the bulk 20231106000013_fix_grants run).
GRANT INSERT, UPDATE, DELETE ON public.service_catalog TO authenticated;
