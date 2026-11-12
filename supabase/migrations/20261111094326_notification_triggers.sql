-- Notification triggers: event-driven alerts for leads, tasks, meetings, proposals

-- ============================================================
-- Helper: insert notification bypassing RLS (SECURITY DEFINER).
-- Not callable by regular users — triggers call it internally.
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_link text,
  p_type text DEFAULT 'info'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  -- Don't notify the actor about their own action.
  IF p_user_id = auth.uid() THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, title, body, link, type)
  VALUES (p_user_id, p_title, p_body, p_link, p_type);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- Lead assigned / reassigned
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_lead_assigned_fn() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor text;
BEGIN
  IF NEW.assigned_to IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to THEN RETURN NEW; END IF;
  SELECT username INTO v_actor FROM public.profiles WHERE id = auth.uid();
  PERFORM public.notify_user(
    NEW.assigned_to,
    'New lead assigned',
    coalesce(v_actor, 'A teammate') || ' assigned you a lead.',
    '/leads',
    'info'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_assigned ON public.leads;
CREATE TRIGGER trg_lead_assigned
  AFTER INSERT OR UPDATE OF assigned_to ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_lead_assigned_fn();

-- ============================================================
-- Task assigned
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_task_assigned_fn() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.assigned_to IS NULL OR NEW.assigned_to = NEW.created_by THEN RETURN NEW; END IF;
  PERFORM public.notify_user(
    NEW.assigned_to,
    'New task assigned',
    NEW.title,
    '/tasks',
    'info'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_assigned ON public.tasks;
CREATE TRIGGER trg_task_assigned
  AFTER INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_task_assigned_fn();

-- ============================================================
-- Meeting scheduled
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_meeting_scheduled_fn() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.assigned_to IS NULL OR NEW.assigned_to = NEW.created_by THEN RETURN NEW; END IF;
  PERFORM public.notify_user(
    NEW.assigned_to,
    'New meeting scheduled',
    NEW.title || ' on ' || to_char(NEW.meeting_date, 'Mon DD'),
    '/meetings',
    'info'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_meeting_scheduled ON public.meetings;
CREATE TRIGGER trg_meeting_scheduled
  AFTER INSERT ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.trg_meeting_scheduled_fn();

-- ============================================================
-- Proposal awaiting approval → notify all admins
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_proposal_pending_fn() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin record;
BEGIN
  IF NEW.approval_status <> 'Pending Approval' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.approval_status = 'Pending Approval' THEN RETURN NEW; END IF;
  FOR v_admin IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
    PERFORM public.notify_user(v_admin.id, 'Proposal awaiting approval', NEW.title, '/proposals', 'warning');
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proposal_pending ON public.proposals;
CREATE TRIGGER trg_proposal_pending
  AFTER INSERT OR UPDATE OF approval_status ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.trg_proposal_pending_fn();

-- ============================================================
-- Proposal decided → notify creator
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_proposal_decided_fn() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN RETURN NEW; END IF;
  IF OLD.approval_status = NEW.approval_status THEN RETURN NEW; END IF;
  IF NEW.approval_status NOT IN ('Approved', 'Rejected') THEN RETURN NEW; END IF;
  PERFORM public.notify_user(
    NEW.created_by,
    'Proposal ' || lower(NEW.approval_status),
    NEW.title,
    '/proposals',
    CASE WHEN NEW.approval_status = 'Approved' THEN 'success' ELSE 'error' END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proposal_decided ON public.proposals;
CREATE TRIGGER trg_proposal_decided
  AFTER UPDATE OF approval_status ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.trg_proposal_decided_fn();
