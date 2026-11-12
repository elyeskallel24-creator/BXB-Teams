import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Briefcase, Search, Pencil, Archive, ChevronRight, Sparkles } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Service = {
  id: string;
  name: string;
  category: string;
  short_description: string | null;
  detailed_explanation: string | null;
  problems_solved: string | null;
  typical_clients: string | null;
  example_use_cases: string | null;
  required_info: string | null;
  common_questions: string | null;
  technical_limitations: string | null;
  marketing_description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const PRESET_CATEGORIES = [
  'AI Solutions', 'Business Automation', 'API Integrations', 'Custom Software',
  'Websites', 'Web Applications', 'UI/UX Design', 'Dashboards',
  'Business Management Systems', 'Digital Transformation', 'E-Marketing and Digital Services',
];

const EMPTY_FORM = {
  name: '',
  category: 'Websites',
  short_description: '',
  detailed_explanation: '',
  problems_solved: '',
  typical_clients: '',
  example_use_cases: '',
  required_info: '',
  common_questions: '',
  technical_limitations: '',
  marketing_description: '',
  is_active: true,
};

type FormState = typeof EMPTY_FORM;

export default function ServiceCatalogue() {
  const { profile } = useAuth();
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [selected, setSelected] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { fetchServices(); }, []);

  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_catalog')
      .select('*')
      .order('is_active', { ascending: false })
      .order('name', { ascending: true });
    if (error) toast.error('Could not load services');
    if (data) setServices(data as any);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      name: s.name,
      category: s.category,
      short_description: s.short_description || '',
      detailed_explanation: s.detailed_explanation || '',
      problems_solved: s.problems_solved || '',
      typical_clients: s.typical_clients || '',
      example_use_cases: s.example_use_cases || '',
      required_info: s.required_info || '',
      common_questions: s.common_questions || '',
      technical_limitations: s.technical_limitations || '',
      marketing_description: s.marketing_description || '',
      is_active: s.is_active,
    });
    setShowForm(true);
    setSelected(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      short_description: form.short_description.trim() || null,
      detailed_explanation: form.detailed_explanation.trim() || null,
      problems_solved: form.problems_solved.trim() || null,
      typical_clients: form.typical_clients.trim() || null,
      example_use_cases: form.example_use_cases.trim() || null,
      required_info: form.required_info.trim() || null,
      common_questions: form.common_questions.trim() || null,
      technical_limitations: form.technical_limitations.trim() || null,
      marketing_description: form.marketing_description.trim() || null,
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from('service_catalog').update(payload).eq('id', editing.id)
      : await supabase.from('service_catalog').insert(payload);
    if (!error) {
      toast.success(editing ? 'Service updated' : 'Service created');
      setShowForm(false);
      setEditing(null);
      fetchServices();
    } else {
      toast.error(editing ? 'Could not update service' : 'Could not create service');
    }
    setSaving(false);
  }

  async function handleArchive(s: Service) {
    if (!confirm('Archive "' + s.name + '"? It will be hidden from the catalogue.')) return;
    setArchiving(true);
    const { error } = await supabase.from('service_catalog').update({ is_active: false }).eq('id', s.id);
    if (!error) {
      toast.success('Service archived');
      setSelected(null);
      fetchServices();
    } else {
      toast.error('Could not archive service');
    }
    setArchiving(false);
  }

  const categories = Array.from(new Set(services.map(s => s.category))).sort();
  const activeCount = services.filter(s => s.is_active).length;

  const filtered = services.filter(s => {
    if (category !== 'All' && s.category !== category) return false;
    if (!isAdmin && !s.is_active) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.name.toLowerCase().includes(q) &&
        !(s.short_description || '').toLowerCase().includes(q) &&
        !(s.category || '').toLowerCase().includes(q) &&
        !(s.marketing_description || '').toLowerCase().includes(q)
      ) return false;
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
        <SkeletonBox className="h-11 w-full rounded-xl mb-3" />
        <div className="flex gap-1.5 mb-5">
          {[0,1,2,3].map(i => <SkeletonBox key={i} className="h-9 w-24 rounded-xl" />)}
        </div>
        <div className="space-y-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="card p-3 flex items-start gap-3">
              <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBox className="h-4 w-2/3" />
                <SkeletonBox className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Services</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {activeCount} active · {services.length} total
          </p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary shrink-0">
            <Plus size={18} strokeWidth={2.5} /> Add Service
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input
          type="text"
          placeholder="Search services..."
          className="input-field pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        <button
          onClick={() => setCategory('All')}
          className={category === 'All' ? 'chip-active' : 'chip'}
        >
          All
          <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{services.length}</span>
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={category === c ? 'chip-active' : 'chip'}
          >
            {c}
            <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">
              {services.filter(s => s.category === c).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <Briefcase size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">
            {search ? 'No matching services' : category !== 'All' ? 'No services in this category' : 'No services yet'}
          </h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[280px] mx-auto">
            {search
              ? 'Try a different search term.'
              : category !== 'All'
                ? 'Switch to All to see every service.'
                : isAdmin
                  ? 'Add your first service from the button above.'
                  : 'Your admin has not added services yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={'card p-3 w-full text-left flex items-start gap-3 active:scale-[0.995] transition-all ' + (!s.is_active ? 'opacity-60' : 'hover:border-brand-primary/30')}
            >
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                <Briefcase size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="text-[14px] font-semibold tracking-tight leading-snug flex-1 min-w-0 truncate">{s.name}</h3>
                  <ChevronRight size={16} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
                </div>
                {s.short_description && (
                  <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark line-clamp-2 mb-1.5">
                    {s.short_description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="badge-neutral">{s.category}</span>
                  {s.is_active ? (
                    <span className="badge-success">Active</span>
                  ) : (
                    <span className="badge-neutral">Inactive</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Service'}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="badge-neutral">{selected.category}</span>
              {selected.is_active ? (
                <span className="badge-success">Active</span>
              ) : (
                <span className="badge-neutral">Inactive</span>
              )}
            </div>

            {selected.marketing_description && (
              <div>
                <p className="eyebrow mb-1.5">Marketing description</p>
                <div className="card !p-3 border-brand-primary/30">
                  <div className="flex items-start gap-2">
                    <Sparkles size={14} className="text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-[13px] leading-relaxed">{selected.marketing_description}</p>
                  </div>
                </div>
              </div>
            )}

            {selected.short_description && (
              <div>
                <p className="eyebrow mb-1.5">Overview</p>
                <div className="card !p-3 text-[13px] leading-relaxed">{selected.short_description}</div>
              </div>
            )}

            {(selected.problems_solved || selected.typical_clients || selected.example_use_cases) && (
              <div>
                <p className="eyebrow mb-2">Selling points</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.problems_solved && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Problems solved</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.problems_solved}</p>
                    </div>
                  )}
                  {selected.typical_clients && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Typical clients</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.typical_clients}</p>
                    </div>
                  )}
                  {selected.example_use_cases && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Example use cases</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.example_use_cases}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selected.required_info || selected.common_questions) && (
              <div>
                <p className="eyebrow mb-2">Discovery</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.required_info && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Info to ask</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.required_info}</p>
                    </div>
                  )}
                  {selected.common_questions && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Common questions</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.common_questions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selected.technical_limitations || selected.detailed_explanation) && (
              <div>
                <p className="eyebrow mb-2">Technical</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.technical_limitations && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Do not promise</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.technical_limitations}</p>
                    </div>
                  )}
                  {selected.detailed_explanation && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">How we deliver it</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selected.detailed_explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="flex gap-2 pt-2 border-t border-surface-borderLight dark:border-surface-borderDark">
                <button
                  onClick={() => openEdit(selected)}
                  className="flex-1 h-[40px] rounded-lg bg-brand-primary/10 text-brand-primary text-[12px] font-semibold flex items-center justify-center gap-1 active:scale-[0.97] transition-transform"
                >
                  <Pencil size={14} /> Edit
                </button>
                {selected.is_active && (
                  <button
                    onClick={() => handleArchive(selected)}
                    disabled={archiving}
                    className="flex-1 h-[40px] rounded-lg bg-state-dangerSoft text-state-danger text-[12px] font-semibold flex items-center justify-center gap-1 active:scale-[0.97] transition-transform disabled:opacity-50"
                  >
                    {archiving ? <Loader2 className="animate-spin" size={14} /> : <><Archive size={14} /> Archive</>}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? 'Edit Service' : 'New Service'}
        footer={
          <button type="submit" form="service-form" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : editing ? 'Save Changes' : 'Create Service'}
          </button>
        }
      >
        <form id="service-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <p className="eyebrow">Basics</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Service name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Restaurant POS Automation"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Category *</label>
              <input
                type="text"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="input-field"
                list="service-categories"
                required
              />
              <datalist id="service-categories">
                {PRESET_CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Short description</label>
              <textarea
                value={form.short_description}
                onChange={e => setForm({ ...form, short_description: e.target.value })}
                className="input-field"
                placeholder="One line for the list card"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Marketing description</label>
              <textarea
                value={form.marketing_description}
                onChange={e => setForm({ ...form, marketing_description: e.target.value })}
                className="input-field"
                placeholder="Approved sales copy"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">Sales enablement</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Problems solved</label>
              <textarea
                value={form.problems_solved}
                onChange={e => setForm({ ...form, problems_solved: e.target.value })}
                className="input-field"
                placeholder="What pain points does this address?"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Typical clients</label>
              <textarea
                value={form.typical_clients}
                onChange={e => setForm({ ...form, typical_clients: e.target.value })}
                className="input-field"
                placeholder="Who needs this? Industry, size…"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Example use cases</label>
              <textarea
                value={form.example_use_cases}
                onChange={e => setForm({ ...form, example_use_cases: e.target.value })}
                className="input-field"
                placeholder="Concrete stories"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Info to ask the prospect</label>
              <textarea
                value={form.required_info}
                onChange={e => setForm({ ...form, required_info: e.target.value })}
                className="input-field"
                placeholder="Required info before technical review"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Common questions</label>
              <textarea
                value={form.common_questions}
                onChange={e => setForm({ ...form, common_questions: e.target.value })}
                className="input-field"
                placeholder="Objections and FAQs"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">Technical</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Do not promise without review</label>
              <textarea
                value={form.technical_limitations}
                onChange={e => setForm({ ...form, technical_limitations: e.target.value })}
                className="input-field"
                placeholder="Guardrails for reps"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">How we deliver it</label>
              <textarea
                value={form.detailed_explanation}
                onChange={e => setForm({ ...form, detailed_explanation: e.target.value })}
                className="input-field"
                placeholder="Delivery process overview"
                rows={3}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-[13px] font-semibold">Active</p>
                <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark">Visible to reps in the catalogue</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={'relative w-11 h-6 rounded-full transition-colors ' + (form.is_active ? 'bg-brand-primary' : 'bg-black/20 dark:bg-white/20')}
              >
                <span className={'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ' + (form.is_active ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </label>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
