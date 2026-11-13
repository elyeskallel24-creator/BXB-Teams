const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'LeadAssignment.tsx');

const content = `import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, UserCheck, RefreshCw } from 'lucide-react';

type Member = { id: string; username: string; role: string };

export function LeadAssignment({
  leadId,
  currentAssignee,
  teamId,
  onChanged
}: {
  leadId: string;
  currentAssignee: string | null;
  teamId: string;
  onChanged?: () => void;
}) {
  const { profile } = useAuth();
  const canManage = profile?.role === 'admin' || profile?.role === 'team_leader';
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string>(currentAssignee || '');
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchMembers(); }, [teamId]);
  useEffect(() => { setSelected(currentAssignee || ''); }, [currentAssignee]);

  async function fetchMembers() {
    // Guard: Do not query if teamId is missing, null, or invalid
    if (!teamId || teamId === 'undefined' || teamId === 'null' || teamId.trim() === '') {
      setLoading(false);
      setMembers([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role')
      .eq('team_id', teamId)
      .in('role', ['member', 'sales_rep', 'team_leader', 'admin']);
      
    if (error) {
      console.error("Error fetching team members:", error.message);
    }
    
    if (data) setMembers(data as any);
    setLoading(false);
  }

  async function handleReassign() {
    if (!profile || !selected) return;
    setSaving(true);
    setMsg('');
    const previous = currentAssignee;
    const { error: updateErr } = await supabase
      .from('leads')
      .update({ assigned_to: selected })
      .eq('id', leadId);
    if (updateErr) { setMsg(updateErr.message); setSaving(false); return; }
    const { error: assignErr } = await supabase.from('lead_assignments').insert({
      lead_id: leadId,
      from_user: previous || null,
      to_user: selected,
      changed_by: profile.id
    });
    if (assignErr) console.error('Failed to log assignment history:', assignErr);
    const { error: auditErr } = await supabase.from('audit_logs').insert({
      actor_id: profile.id,
      action: 'Lead reassigned',
      entity_type: 'lead',
      entity_id: leadId,
      old_value: { assigned_to: previous },
      new_value: { assigned_to: selected }
    });
    if (auditErr) console.error('Failed to log audit trail:', auditErr);
    setMsg('Reassigned successfully.');
    if (onChanged) onChanged();
    setSaving(false);
  }

  if (!canManage) return null;

  if (loading) return <div className="py-2 flex justify-center"><Loader2 className="animate-spin text-brand-primary" size={16} /></div>;

  // If no team is assigned to the lead, or no members found
  if (members.length === 0) return (
    <div className="space-y-2">
      <h4 className="text-[14px] font-bold flex items-center gap-2"><UserCheck size={16} /> Assignment</h4>
      <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">
        {!teamId ? "This lead is not assigned to a team yet." : "No other team members available to assign."}
      </p>
    </div>
  );

  return (
    <div className="space-y-2">
      <h4 className="text-[14px] font-bold flex items-center gap-2"><UserCheck size={16} /> Assignment</h4>
      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="input-field flex-1"
        >
          <option value="">Unassigned</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.username} ({m.role})</option>
          ))}
        </select>
        <button
          onClick={handleReassign}
          disabled={saving || !selected || selected === currentAssignee}
          className="h-[40px] px-3 bg-brand-primary text-black font-bold rounded-xl flex items-center gap-1 text-[13px] disabled:opacity-40"
        >
          {saving ? <Loader2 className="animate-spin" size={14} /> : <><RefreshCw size={13} /> Reassign</>}
        </button>
      </div>
      {msg && <p className="text-[12px] text-brand-primary">{msg}</p>}
    </div>
  );
}
`;

fs.writeFileSync(filePath, content);
console.log('Successfully fixed LeadAssignment.tsx. Restart your dev server.');