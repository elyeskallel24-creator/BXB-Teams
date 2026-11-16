import { useState, useEffect } from 'react';
import { localToday } from '../lib/date';
import { LEAD_STAGES, QUALIFIED_STAGES, INACTIVE_STAGES, stageBadgeClass } from '../lib/stages';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { FileText, Loader2, Plus, Search, Building2, Target, ChevronRight, Clock, Phone, Mail, Globe, MapPin, Calendar, CheckSquare, Wrench, Briefcase } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { Modal } from '../components/Modal';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { LeadQualification } from '../components/LeadQualification';
import { LeadAssignment } from '../components/LeadAssignment';
import { SkeletonList, SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useLocation, useNavigate } from 'react-router-dom';

type Lead = {
  id: string;
  business_id: string;
  team_id: string;
  stage: string;
  priority: string;
  next_follow_up: string | null;
  assigned_to: string | null;
  businesses: {
    name: string;
    industry: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
  } | null;
};

type HistoryItem = {
  id: string;
  old_stage: string;
  new_stage: string;
  created_at: string;
  profiles: { username: string } | null;
};

type Tab = 'overview' | 'activity' | 'qualification' | 'history';
type Filter = 'all' | 'mine' | 'overdue' | 'qualified' | 'unassigned';

export default function Leads() {
  const { profile } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [bizName, setBizName] = useState('');
  const [bizIndustry, setBizIndustry] = useState('');
  const [bizCity, setBizCity] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>(() => {
    if (typeof window === 'undefined') return 'all';
    const v = localStorage.getItem('bxb-leads-filter');
    if (v === 'mine' || v === 'overdue' || v === 'qualified' || v === 'unassigned') return v;
    return 'all';
  });

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    const st = (location.state as any) || {};
    if (typeof st.search === 'string') setSearchQuery(st.search);
    if (st.openCreate) setShowSheet(true);
  }, [location.state]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bxb-leads-filter', filter);
    }
  }, [filter]);

  async function fetchLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('id, business_id, team_id, stage, priority, next_follow_up, assigned_to, businesses(name, industry, city, country, phone, email, website)')
      .order('created_at', { ascending: false });

    if (!error && data) setLeads(data as any);
    setLoading(false);
  }

  async function fetchHistory(leadId: string) {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('lead_stage_history')
      .select('id, old_stage, new_stage, created_at, profiles(username)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    if (data) setHistory(data as any);
    setLoadingHistory(false);
  }

  async function handleUpdateStage(newStage: string) {
    if (!selectedLead) return;
    setIsUpdatingStage(true);
    const { error } = await supabase
      .from('leads')
      .update({ stage: newStage })
      .eq('id', selectedLead.id);

    if (!error) {
      toast.success('Stage updated');
      setSelectedLead({ ...selectedLead, stage: newStage });
      fetchHistory(selectedLead.id);
      fetchLeads();
    }
    setIsUpdatingStage(false);
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!bizName) return;
    setIsCreating(true);

    const { data: bizData, error: bizError } = await supabase.from('businesses').insert({
      name: bizName,
      industry: bizIndustry,
      city: bizCity,
      team_id: profile?.team_id,
      created_by: profile?.id
    }).select().single();

    if (!bizError && bizData) {
      const { error: leadError } = await supabase.from('leads').insert({
        team_id: profile?.team_id,
        business_id: bizData.id,
        assigned_to: profile?.id,
        created_by: profile?.id,
        stage: 'New Lead'
      });

      if (!leadError) {
        toast.success('Lead created');
        setBizName(''); setBizIndustry(''); setBizCity('');
        setShowSheet(false);
        fetchLeads();
      }
    }
    setIsCreating(false);
  }

  function openLead(lead: Lead) {
    setActiveTab('overview');
    setSelectedLead(lead);
    fetchHistory(lead.id);
  }

  const today = localToday();

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      !searchQuery ||
      l.businesses?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.businesses?.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.businesses?.city?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case 'mine':
        return l.assigned_to === profile?.id;
      case 'overdue':
        return !!l.next_follow_up && l.next_follow_up < today && !INACTIVE_STAGES.includes(l.stage);
      case 'qualified':
        return QUALIFIED_STAGES.includes(l.stage);
      case 'unassigned':
        return !l.assigned_to;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-28 rounded-xl" />
        </div>
        <SkeletonBox className="h-11 w-full rounded-xl mb-5" />
        <SkeletonList rows={5} />
      </div>
    );
  }

  const phone = selectedLead?.businesses?.phone?.trim();
  const email = selectedLead?.businesses?.email?.trim();
  const website = selectedLead?.businesses?.website?.trim();
  const websiteHref = website
    ? (website.startsWith('http') ? website : 'https://' + website)
    : '';

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Leads</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {leads.length} total · {leads.filter(l => !INACTIVE_STAGES.includes(l.stage)).length} active
          </p>
        </div>
        <button onClick={() => setShowSheet(true)} className="btn-primary shrink-0">
          <Plus size={18} strokeWidth={2.5} /> New Lead
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input
          type="text"
          placeholder="Search by name, industry or city..."
          className="input-field !pl-11"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        {([
          { key: 'all', label: 'All' },
          { key: 'mine', label: 'Mine' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'qualified', label: 'Qualified' },
          { key: 'unassigned', label: 'Unassigned' },
        ] as { key: Filter; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'chip-active' : 'chip'}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 text-brand-primary">
              <Target size={28} />
            </div>
            <h3 className="text-[16px] font-bold mb-1">
              {searchQuery || filter !== 'all' ? 'No matching leads' : 'No leads yet'}
            </h3>
            <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px]">
              {searchQuery || filter !== 'all' ? 'Try a different search or filter.' : 'Create your first lead to start tracking prospects.'}
            </p>
          </div>
        ) : (
          filteredLeads.map(lead => (
            <button
              key={lead.id}
              onClick={() => openLead(lead)}
              className="card p-3.5 md:p-4 hover:border-brand-primary/30 transition-colors cursor-pointer w-full text-left active:scale-[0.995]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                  <Building2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[15px] font-semibold tracking-tight truncate">
                      {lead.businesses?.name || 'Unnamed business'}
                    </h3>
                  </div>
                  <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark truncate">
                    {[lead.businesses?.industry, lead.businesses?.city, lead.businesses?.country].filter(Boolean).join(' · ') || 'No location details'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={stageBadgeClass(lead.stage)}>{lead.stage}</span>
                  <ChevronRight size={16} className="text-text-mutedLight dark:text-text-mutedDark" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <BottomSheet isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title={selectedLead?.businesses?.name || 'Lead Details'}>
        {selectedLead && (
          <div>
            <div className="sticky -top-4 z-10 bg-surface-elevatedLight dark:bg-surface-elevatedDark flex flex-wrap gap-1.5 -mx-5 px-5 pt-4 pb-3 mb-4 border-b border-surface-borderLight dark:border-surface-borderDark">
              {([
                { key: 'overview', label: 'Overview' },
                { key: 'activity', label: 'Activity' },
                { key: 'qualification', label: 'Qualification' },
                { key: 'history', label: 'History' },
              ] as { key: Tab; label: string }[]).map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} className={activeTab === t.key ? 'chip-active' : 'chip'}>
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <span className={stageBadgeClass(selectedLead.stage)}>{selectedLead.stage}</span>
                  {selectedLead.priority && selectedLead.priority !== 'Medium' && (
                    <span className="badge-neutral">{selectedLead.priority} priority</span>
                  )}
                  {selectedLead.next_follow_up && (
                    <span className="badge-neutral">Follow-up {new Date(selectedLead.next_follow_up).toLocaleDateString()}</span>
                  )}
                </div>

                {(phone || email || website) && (
                  <div>
                    <p className="eyebrow mb-2">Contact</p>
                    <div className="grid grid-cols-3 gap-2">
                      {phone && (
                        <a href={'tel:' + phone} className="btn-secondary !h-[48px] flex-col !gap-1 text-[11px] !font-semibold">
                          <Phone size={16} />Call
                        </a>
                      )}
                      {email && (
                        <a href={'mailto:' + email} className="btn-secondary !h-[48px] flex-col !gap-1 text-[11px] !font-semibold">
                          <Mail size={16} />Email
                        </a>
                      )}
                      {website && (
                        <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="btn-secondary !h-[48px] flex-col !gap-1 text-[11px] !font-semibold">
                          <Globe size={16} />Website
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {(selectedLead.businesses?.city || selectedLead.businesses?.country || selectedLead.businesses?.industry) && (
                  <div>
                    <p className="eyebrow mb-2">Business</p>
                    <div className="card !p-3 space-y-1.5 text-[13px]">
                      {selectedLead.businesses?.industry && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondaryLight dark:text-text-secondaryDark">Industry</span>
                          <span className="font-medium truncate ml-2">{selectedLead.businesses?.industry}</span>
                        </div>
                      )}
                      {(selectedLead.businesses?.city || selectedLead.businesses?.country) && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondaryLight dark:text-text-secondaryDark flex items-center gap-1">
                            <MapPin size={12} /> Location
                          </span>
                          <span className="font-medium truncate ml-2">
                            {[selectedLead.businesses?.city, selectedLead.businesses?.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="eyebrow mb-2">Current stage</p>
                  <select value={selectedLead.stage} onChange={e => handleUpdateStage(e.target.value)} disabled={isUpdatingStage} className="input-field w-full">
                    {LEAD_STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="eyebrow mb-2">Quick actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => navigate('/meetings', { state: { openCreate: true, leadId: selectedLead.id } })} className="btn-secondary !h-[44px] !text-[12px] !font-semibold flex items-center justify-center gap-2">
                      <Calendar size={14} className="text-brand-primary" /> Schedule
                    </button>
                    <button onClick={() => navigate('/tasks', { state: { openCreate: true, leadId: selectedLead.id } })} className="btn-secondary !h-[44px] !text-[12px] !font-semibold flex items-center justify-center gap-2">
                      <CheckSquare size={14} className="text-brand-primary" /> Follow-up
                    </button>
                    <button onClick={() => navigate('/technical-handovers', { state: { openCreate: true, leadId: selectedLead.id } })} className="btn-secondary !h-[44px] !text-[12px] !font-semibold flex items-center justify-center gap-2">
                      <Wrench size={14} className="text-brand-primary" /> Tech Request
                    </button>
                    <button onClick={() => setActiveTab('activity')} className="btn-secondary !h-[44px] !text-[12px] !font-semibold flex items-center justify-center gap-2">
                      <FileText size={14} className="text-brand-primary" /> Log Call
                    </button>
                  </div>
                </div>

                <LeadAssignment leadId={selectedLead.id} currentAssignee={selectedLead.assigned_to} teamId={selectedLead.team_id} onChanged={fetchLeads} />
              </div>
            )}

            {activeTab === 'activity' && (
              <ActivityTimeline leadId={selectedLead.id} businessId={selectedLead.business_id} />
            )}

            {activeTab === 'qualification' && (
              <LeadQualification leadId={selectedLead.id} />
            )}

            {activeTab === 'history' && (
              <div>
                {loadingHistory ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-black/10 dark:bg-white/10 mt-2" />
                        <div className="flex-1 space-y-1.5">
                          <SkeletonBox className="h-3 w-1/3" />
                          <SkeletonBox className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <Clock size={22} className="text-text-mutedLight dark:text-text-mutedDark" />
                    </div>
                    <p className="text-[14px] font-semibold mb-1">No stage changes yet</p>
                    <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">Updates to this lead's stage will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3 relative border-l border-surface-borderLight dark:border-surface-borderDark ml-2 pl-4">
                    {history.map(h => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-[22px] top-1.5 w-2.5 h-2.5 bg-brand-primary rounded-full ring-2 ring-surface-cardLight dark:ring-surface-elevatedDark" />
                        <p className="text-[13px] font-semibold tracking-tight">{h.new_stage}</p>
                        <p className="text-[11px] text-text-secondaryLight dark:text-text-secondaryDark">
                          from {h.old_stage || '\u2014'} {'\u00B7'} {new Date(h.created_at).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark">by {h.profiles?.username || 'System'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <Modal
        isOpen={showSheet}
        onClose={() => { setShowSheet(false); setNameError(false); }}
        title="New Lead"
        subtitle="Add a new prospect to your pipeline."
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => { setShowSheet(false); setNameError(false); }} className="btn-secondary !h-[44px] px-4">
              Cancel
            </button>
            <button type="submit" form="new-lead-form" disabled={isCreating} className="btn-primary !h-[44px] px-6">
              {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'Save Lead'}
            </button>
          </div>
        }
      >
        <form
          id="new-lead-form"
          onSubmit={(e) => {
            if (!bizName.trim()) {
              e.preventDefault();
              setNameError(true);
              return;
            }
            handleCreateLead(e);
          }}
          className="space-y-5"
        >
          <div>
            <label className="eyebrow block mb-1.5">Business name <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={bizName}
                onChange={e => { setBizName(e.target.value); if (nameError) setNameError(false); }}
                className={['input-field peer !pl-10', nameError ? '!border-red-500' : ''].join(' ')}
              />
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark peer-focus:text-brand-primary transition-colors pointer-events-none" />
            </div>
            {nameError && <p className="text-[12px] text-red-500 mt-1.5">Business name is required.</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="eyebrow block mb-1.5">Industry</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Tech, Healthcare, Sports, Agency"
                  value={bizIndustry}
                  onChange={e => setBizIndustry(e.target.value)}
                  className="input-field peer !pl-10"
                />
                <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark peer-focus:text-brand-primary transition-colors pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">City</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Tunis"
                  value={bizCity}
                  onChange={e => setBizCity(e.target.value)}
                  className="input-field peer !pl-10"
                />
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark peer-focus:text-brand-primary transition-colors pointer-events-none" />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}






