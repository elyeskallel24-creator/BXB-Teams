import { useState, useEffect } from 'react';
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

const STAGES = [
  'New Lead', 'Researching', 'Ready to Contact', 'Contact Attempted',
  'Contacted', 'Response Received', 'Qualified', 'Meeting Proposed',
  'Meeting Scheduled', 'Discovery Completed', 'Technical Review',
  'Proposal Preparation', 'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'Nurture', 'Disqualified', 'Duplicate'
];

const QUALIFIED_STAGES = ['Qualified', 'Meeting Proposed', 'Meeting Scheduled', 'Discovery Completed', 'Technical Review', 'Proposal Preparation', 'Proposal Sent', 'Negotiation', 'Won'];
const INACTIVE_STAGES = ['Won', 'Lost', 'Disqualified', 'Duplicate', 'Nurture'];

function stageBadgeClass(stage: string) {
  if (stage === 'Won') return 'badge-success';
  if (stage === 'Lost' || stage === 'Disqualified' || stage === 'Duplicate') return 'badge-danger';
  if (stage === 'Nurture') return 'badge-neutral';
  if (QUALIFIED_STAGES.includes(stage)) return 'badge-brand';
  return 'badge-info';
}

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

  const today = new Date().toISOString().split('T')[0];

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
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input
          type="text"
          placeholder="Search by name, industry or city..."
          className="input-field pl-10"
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

    <Modal
      isOpen={showNewLead}
      onClose={() => { setShowNewLead(false); setNameError(false); }}
      title="New Lead"
      subtitle="Add a new prospect to your pipeline."
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => { setShowNewLead(false); setNameError(false); }}
            className="px-4 h-[44px] rounded-[10px] text-[14px] font-medium text-gray-300 hover:bg-white/5 border border-transparent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-lead-form"
            disabled={saving}
            className="px-6 h-[44px] rounded-[10px] bg-[#FF6B2C] hover:bg-[#ff7b42] text-white text-[14px] font-semibold transition-all hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : "Save Lead"}
          </button>
        </div>
      }
    >
      <form
        id="new-lead-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!bizName.trim()) {
            setNameError(true);
            return;
          }
          handleCreateLead();
        }}
        className="space-y-5"
      >
        <div>
          <label className="block text-[12px] uppercase tracking-wider text-gray-400 mb-2 font-medium">
            Business Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-[#FF6B2C] transition-colors" size={16} />
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={bizName}
              onChange={e => { setBizName(e.target.value); setNameError(false); }}
              className={['input-field !pl-10 peer', nameError ? '!border-state-danger ring-[3px] ring-state-danger/20' : ''].join(' ')}
            />
          </div>
          {nameError && <p className="text-[12px] text-red-500 mt-1">Business name is required.</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[12px] uppercase tracking-wider text-gray-400 mb-2 font-medium">
              Industry
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-[#FF6B2C] transition-colors" size={16} />
              <input
                type="text"
                placeholder="e.g. Restaurant, Retail"
                value={bizIndustry}
                onChange={e => setBizIndustry(e.target.value)}
                className="peer w-full h-[44px] bg-[#1d1d22] border border-white/10 rounded-[10px] pl-10 pr-3 text-white placeholder-gray-500 text-[14px] focus:outline-none focus:border-[#FF6B2C] focus:ring-[3px] focus:ring-[#FF6B2C]/20 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] uppercase tracking-wider text-gray-400 mb-2 font-medium">
              City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-[#FF6B2C] transition-colors" size={16} />
              <input
                type="text"
                placeholder="e.g. Tunis"
                value={bizCity}
                onChange={e => setBizCity(e.target.value)}
                className="peer w-full h-[44px] bg-[#1d1d22] border border-white/10 rounded-[10px] pl-10 pr-3 text-white placeholder-gray-500 text-[14px] focus:outline-none focus:border-[#FF6B2C] focus:ring-[3px] focus:ring-[#FF6B2C]/20 transition-all"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>

      <BottomSheet isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title={selectedLead?.businesses?.name || 'Lead Details'}>
        {selectedLead && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <button onClick={() => setShowLogActivity(true)} className="btn-secondary flex-1 !h-10"><FileText size={14} className="text-brand-primary" /> Log Call</button>
            </div>
            <ActivityTimeline leadId={selectedLead.id} />
            <LeadQualification lead={selectedLead} />
            <LeadAssignment lead={selectedLead} />
          </div>
        )}
      </BottomSheet>
    </div>
  );
}






