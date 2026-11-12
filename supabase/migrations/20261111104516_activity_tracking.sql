-- ============================================================
-- ACTIVITY TRACKING: audit logs, proposal versioning, follow-ups
-- ============================================================

-- ============================================================
-- 1. Audit log triggers
-- Every critical change writes to audit_logs for the Audit page
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_audit_lead_stage() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (auth.uid(), 'lead_stage_changed', 'lead', NEW.id,
            jsonb_build_object('stage', OLD.stage),
            jsonb_build_object('stage', NEW.stage));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.trg_audit_lead_stage() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_audit_lead_stage ON public.leads;
CREATE TRIGGER trg_audit_lead_stage
  AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_lead_stage();

CREATE OR REPLACE FUNCTION public.trg_audit_lead_reassign() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (auth.uid(), 'lead_reassigned', 'lead', NEW.id,
            jsonb_build_object('assigned_to', OLD.assigned_to),
            jsonb_build_object('assigned_to', NEW.assigned_to));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.trg_audit_lead_reassign() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_audit_lead_reassign ON public.leads;
CREATE TRIGGER trg_audit_lead_reassign
  AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_lead_reassign();

CREATE OR REPLACE FUNCTION public.trg_audit_deal_stage() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (auth.uid(), 'deal_stage_changed', 'deal', NEW.id,
            jsonb_build_object('stage', OLD.stage),
            jsonb_build_object('stage', NEW.stage));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.trg_audit_deal_stage() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_audit_deal_stage ON public.deals;
CREATE TRIGGER trg_audit_deal_stage
  AFTER UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_deal_stage();

CREATE OR REPLACE FUNCTION public.trg_audit_proposal_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (auth.uid(),
            'proposal_' || lower(replace(NEW.approval_status, ' ', '_')),
            'proposal', NEW.id,
            jsonb_build_object('approval_status', OLD.approval_status),
            jsonb_build_object('approval_status', NEW.approval_status));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.trg_audit_proposal_status() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_audit_proposal_status ON public.proposals;
CREATE TRIGGER trg_audit_proposal_status
  AFTER UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_proposal_status();

CREATE OR REPLACE FUNCTION public.trg_audit_commercial_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (auth.uid(),
            'commercial_record_' || lower(replace(NEW.approval_status, ' ', '_')),
            'commercial_record', NEW.id,
            jsonb_build_object('approval_status', OLD.approval_status),
            jsonb_build_object('approval_status', NEW.approval_status));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.trg_audit_commercial_status() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_audit_commercial_status ON public.commercial_records;
CREATE TRIGGER trg_audit_commercial_status
  AFTER UPDATE ON public.commercial_records
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_commercial_status();

-- ============================================================
-- 2. Proposal version snapshots
-- On content change: save old row as snapshot, bump version
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_proposal_version_snapshot() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.title IS DISTINCT FROM OLD.title
      OR NEW.client_details IS DISTINCT FROM OLD.client_details
      OR NEW.service_description IS DISTINCT FROM OLD.service_description
      OR NEW.proposed_solution IS DISTINCT FROM OLD.proposed_solution
      OR NEW.scope_of_work IS DISTINCT FROM OLD.scope_of_work
      OR NEW.deliverables IS DISTINCT FROM OLD.deliverables
      OR NEW.exclusions IS DISTINCT FROM OLD.exclusions
      OR NEW.estimated_timeline IS DISTINCT FROM OLD.estimated_timeline
      OR NEW.pricing IS DISTINCT FROM OLD.pricing
      OR NEW.currency IS DISTINCT FROM OLD.currency
      OR NEW.payment_milestones IS DISTINCT FROM OLD.payment_milestones
      OR NEW.maintenance_arrangements IS DISTINCT FROM OLD.maintenance_arrangements
      OR NEW.expiration_date IS DISTINCT FROM OLD.expiration_date)
     AND NEW.approval_status = OLD.approval_status
  THEN
    INSERT INTO public.proposal_versions (proposal_id, version, snapshot, created_by)
    VALUES (OLD.id, OLD.version, to_jsonb(OLD), COALESCE(auth.uid(), OLD.created_by));
    NEW.version := OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.trg_proposal_version_snapshot() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_proposal_version_snapshot ON public.proposals;
CREATE TRIGGER trg_proposal_version_snapshot
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.trg_proposal_version_snapshot();

-- ============================================================
-- 3. Follow-up notifications
-- When next_follow_up is set to a future date within 7 days,
-- notify the assignee
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_followup_scheduled() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.next_follow_up IS DISTINCT FROM OLD.next_follow_up
     AND NEW.next_follow_up IS NOT NULL
     AND NEW.next_follow_up >= CURRENT_DATE
     AND NEW.next_follow_up <= CURRENT_DATE + INTERVAL '7 days'
     AND NEW.assigned_to IS NOT NULL
     AND (auth.uid() IS NULL OR NEW.assigned_to <> auth.uid())
  THEN
    PERFORM public.notify_user(
      NEW.assigned_to,
      'Follow-up scheduled',
      'Reminder set for ' || to_char(NEW.next_follow_up, 'Mon DD'),
      '/leads',
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.trg_followup_scheduled() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_followup_scheduled ON public.leads;
CREATE TRIGGER trg_followup_scheduled
  AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_followup_scheduled();
