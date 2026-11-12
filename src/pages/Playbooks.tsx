import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, BookOpen, Search, ChevronRight, Pencil } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Playbook = {
  id: string;
  name: string;
  country: string | null;
  language: string | null;
  target_industries: string | null;
  prospecting_strategies: string | null;
  communication_guidance: string | null;
  calling_scripts: string | null;
  email_templates: string | null;
  messaging_templates: string | null;
  discovery_questions: string | null;
  common_objections: string | null;
  market_examples: string | null;
  compliance_guidance: string | null;
  is_universal: boolean;
  is_active: boolean;
  created_at: string;
};

const EMPTY_FORM = {
  name: '',
  country: '',
  language: 'English',
  target_industries: '',
  prospecting_strategies: '',
  communication_guidance: '',
  calling_scripts: '',
  email_templates: '',
  messaging_templates: '',
  discovery_questions: '',
  common_objections: '',
  market_examples: '',
  compliance_guidance: '',
  is_universal: false,
  is_active: true,
};
type FormState = typeof EMPTY_FORM;

export default function Playbooks() {
  const { profile } = useAuth();
  const toast = useToast();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Playbook | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Playbook | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { fetchPlaybooks(); }, []);

  async function fetchPlaybooks() {
    setLoading(true);
    const { data } = await supabase
      .from('sales_playbooks')
      .select('*')
      .order('is_universal', { ascending: false })
      .order('name', { ascending: true });
    if (data) setPlaybooks(data as any);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(p: Playbook) {
    setEditing(p);
    setForm({
      name: p.name,
      country: p.country || '',
      language: p.language || 'English',
      target_industries: p.target_industries || '',
      prospecting_strategies: p.prospecting_strategies || '',
      communication_guidance: p.communication_guidance || '',
      calling_scripts: p.calling_scripts || '',
      email_templates: p.email_templates || '',
      messaging_templates: p.messaging_templates || '',
      discovery_questions: p.discovery_questions || '',
      common_objections: p.common_objections || '',
      market_examples: p.market_examples || '',
      compliance_guidance: p.compliance_guidance || '',
      is_universal: p.is_universal,
      is_active: p.is_active,
    });
    setShowForm(true);
    setSelected(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      country: form.country.trim() || null,
      language: form.language.trim() || 'English',
      target_industries: form.target_industries.trim() || null,
      prospecting_strategies: form.prospecting_strategies.trim() || null,
      communication_guidance: form.communication_guidance.trim() || null,
      calling_scripts: form.calling_scripts.trim() || null,
      email_templates: form.email_templates.trim() || null,
      messaging_templates: form.messaging_templates.trim() || null,
      discovery_questions: form.discovery_questions.trim() || null,
      common_objections: form.common_objections.trim() || null,
      market_examples: form.market_examples.trim() || null,
      compliance_guidance: form.compliance_guidance.trim() || null,
      is_universal: form.is_universal,
      is_active: form.is_active,
      created_by: profile.id,
    };
    const { error } = editing
      ? await supabase.from('sales_playbooks').update(payload).eq('id', editing.id)
      : await supabase.from('sales_playbooks').insert(payload);
    if (!error) {
      toast.success(editing ? 'Playbook updated' : 'Playbook created');
      setShowForm(false); setEditing(null);
      fetchPlaybooks();
    } else {
      toast.error(editing ? 'Could not update playbook' : 'Could not create playbook');
    }
    setSaving(false);
  }

  const filtered = playbooks.filter(p => {
    if (!isAdmin && !p.is_active) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.country || '').toLowerCase().includes(q) && !(p.target_industries || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-24 rounded-xl" />
        </div>
        <SkeletonBox className="h-11 w-full rounded-xl mb-5" />
        <div className="space-y-2">
          {[0,1,2].map(i => <SkeletonBox key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Playbooks</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {playbooks.length} total
          </p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary shrink-0">
            <Plus size={18} strokeWidth={2.5} /> New
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input type="text" placeholder="Search by name, country, industry..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <BookOpen size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">{search ? 'No matching playbooks' : 'No playbooks yet'}</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {search ? 'Try a different search.' : isAdmin ? 'Create your first playbook.' : 'Ask your admin for access to playbooks.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <button key={p.id} onClick={() => setSelected(p)} className="card p-3 w-full text-left hover:border-brand-primary/30 active:scale-[0.995] transition-all">
              <div className="flex items-start gap-2 mb-1">
                <h3 className="text-[14px] font-semibold tracking-tight leading-snug flex-1 min-w-0 truncate">{p.name}</h3>
                {p.is_universal && <span className="badge-brand shrink-0">Universal</span>}
                {!p.is_active && isAdmin && <span className="badge-neutral shrink-0">Inactive</span>}
                <ChevronRight size={16} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {p.country && <span className="badge-neutral">{p.country}</span>}
                {p.language && <span className="badge-neutral">{p.language}</span>}
              </div>
              {p.target_industries && (
                <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark line-clamp-2">{p.target_industries}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name || 'Playbook'}>
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-1.5">
              {selected.is_universal && <span className="badge-brand">Universal</span>}
              {selected.country && <span className="badge-neutral">{selected.country}</span>}
              {selected.language && <span className="badge-neutral">{selected.language}</span>}
            </div>

            {selected.target_industries && (
              <div>
                <p className="eyebrow mb-1.5">Target industries</p>
                <div className="card !p-3 text-[13px] leading-relaxed whitespace-pre-wrap">{selected.target_industries}</div>
              </div>
            )}

            {(selected.prospecting_strategies || selected.communication_guidance) && (
              <div>
                <p className="eyebrow mb-2">Approach</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.prospecting_strategies && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Prospecting</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.prospecting_strategies}</p>
                    </div>
                  )}
                  {selected.communication_guidance && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Communication</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.communication_guidance}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selected.calling_scripts || selected.email_templates || selected.messaging_templates) && (
              <div>
                <p className="eyebrow mb-2">Templates</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.calling_scripts && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Calling scripts</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.calling_scripts}</p>
                    </div>
                  )}
                  {selected.email_templates && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Email templates</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.email_templates}</p>
                    </div>
                  )}
                  {selected.messaging_templates && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Messaging</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.messaging_templates}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selected.discovery_questions || selected.common_objections) && (
              <div>
                <p className="eyebrow mb-2">During the call</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.discovery_questions && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Discovery questions</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.discovery_questions}</p>
                    </div>
                  )}
                  {selected.common_objections && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Common objections</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.common_objections}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selected.market_examples || selected.compliance_guidance) && (
              <div>
                <p className="eyebrow mb-2">Context</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.market_examples && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Market examples</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.market_examples}</p>
                    </div>
                  )}
                  {selected.compliance_guidance && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Compliance</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.compliance_guidance}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="pt-2 border-t border-surface-borderLight dark:border-surface-borderDark">
                <button onClick={() => openEdit(selected)} className="w-full h-[40px] rounded-lg bg-brand-primary/10 text-brand-primary text-[12px] font-semibold flex items-center justify-center gap-1 active:scale-[0.97] transition-transform">
                  <Pencil size={14} /> Edit playbook
                </button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? 'Edit Playbook' : 'New Playbook'}
        footer={
          <button type="submit" form="playbook-form" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : editing ? 'Save Changes' : 'Create Playbook'}
          </button>
        }
      >
        <form id="playbook-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <p className="eyebrow">Basics</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Tunisia — Retail & F&B" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium mb-1.5">Country</label>
                <input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input-field" placeholder="Tunisia" />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5">Language</label>
                <input type="text" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="input-field" placeholder="French" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Target industries</label>
              <textarea value={form.target_industries} onChange={e => setForm({ ...form, target_industries: e.target.value })} className="input-field" rows={2} />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">Approach</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Prospecting strategies</label>
              <textarea value={form.prospecting_strategies} onChange={e => setForm({ ...form, prospecting_strategies: e.target.value })} className="input-field" rows={2} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Communication guidance</label>
              <textarea value={form.communication_guidance} onChange={e => setForm({ ...form, communication_guidance: e.target.value })} className="input-field" rows={2} />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">Templates</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Calling scripts</label>
              <textarea value={form.calling_scripts} onChange={e => setForm({ ...form, calling_scripts: e.target.value })} className="input-field" rows={3} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Email templates</label>
              <textarea value={form.email_templates} onChange={e => setForm({ ...form, email_templates: e.target.value })} className="input-field" rows={3} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Messaging templates</label>
              <textarea value={form.messaging_templates} onChange={e => setForm({ ...form, messaging_templates: e.target.value })} className="input-field" rows={2} />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">During the call</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Discovery questions</label>
              <textarea value={form.discovery_questions} onChange={e => setForm({ ...form, discovery_questions: e.target.value })} className="input-field" rows={3} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Common objections</label>
              <textarea value={form.common_objections} onChange={e => setForm({ ...form, common_objections: e.target.value })} className="input-field" rows={3} />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">Context</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Market examples</label>
              <textarea value={form.market_examples} onChange={e => setForm({ ...form, market_examples: e.target.value })} className="input-field" rows={2} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Compliance guidance</label>
              <textarea value={form.compliance_guidance} onChange={e => setForm({ ...form, compliance_guidance: e.target.value })} className="input-field" rows={2} />
            </div>
          </div>

          <div className="pt-4 border-t border-surface-borderLight dark:border-surface-borderDark space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-[13px] font-semibold">Universal</p>
                <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark">Apply to every rep</p>
              </div>
              <button type="button" onClick={() => setForm({ ...form, is_universal: !form.is_universal })} className={'relative w-11 h-6 rounded-full transition-colors ' + (form.is_universal ? 'bg-brand-primary' : 'bg-black/20 dark:bg-white/20')}>
                <span className={'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ' + (form.is_universal ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-[13px] font-semibold">Active</p>
                <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark">Visible to reps</p>
              </div>
              <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })} className={'relative w-11 h-6 rounded-full transition-colors ' + (form.is_active ? 'bg-brand-primary' : 'bg-black/20 dark:bg-white/20')}>
                <span className={'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ' + (form.is_active ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </label>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
