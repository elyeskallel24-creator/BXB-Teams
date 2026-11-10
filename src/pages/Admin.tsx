import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, UserCheck, Shield, Plus, Users, ChevronDown, Check, Globe, Trophy } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from '../components/BottomSheet';

type AllowedId = { id: string; user_id_code: string; role: string; is_used: boolean; created_at: string; };
type Member = { id: string; username: string; points: number; avatar_url: string; };
type IdType = 'SALES' | 'DEV';
type RoleType = 'member' | 'admin';
type TeamType = 'sales' | 'dev' | 'mixed';
type Country = { id: string; name: string; code: string; flag?: string | null; };
type Team = { id: string; name: string; team_type: string; countries: { name: string } | null; };

function SegmentedControl<T extends string>({
  group,
  value,
  onChange,
  options,
}: {
  group: string;
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="relative flex bg-black/5 dark:bg-white/5 rounded-xl p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`relative flex-1 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors z-10 ${
            value === opt.value ? 'text-black' : 'text-text-secondaryLight dark:text-text-secondaryDark hover:text-text-primaryLight dark:hover:text-text-primaryDark'
          }`}
        >
          {value === opt.value && (
            <motion.div
              layoutId={`segment-${group}`}
              className="absolute inset-0 bg-brand-primary rounded-lg -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function CountrySelect({
  countries,
  value,
  onChange,
}: {
  countries: Country[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = countries.find((c) => c.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[44px] px-3 bg-transparent border border-surface-borderLight dark:border-surface-borderDark rounded-xl flex items-center justify-between text-[15px] text-text-primaryLight dark:text-text-primaryDark hover:border-brand-primary/50 transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <span className="text-[18px]">{selected.flag || '🌍'}</span>
              <span>{selected.name}</span>
              <span className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">({selected.code})</span>
            </>
          ) : (
            <span className="text-text-secondaryLight dark:text-text-secondaryDark">Select a country</span>
          )}
        </span>
        <ChevronDown size={18} className={`shrink-0 text-text-secondaryLight dark:text-text-secondaryDark transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-surface-cardLight dark:bg-surface-cardDark border border-surface-borderLight dark:border-surface-borderDark rounded-xl shadow-float z-50 max-h-64 overflow-y-auto"
          >
            {countries.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
                No countries yet. Add one first.
              </div>
            ) : (
              countries.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[14px] transition-colors ${
                    c.id === value
                      ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-primaryLight dark:text-text-primaryDark'
                  }`}
                >
                  <span className="text-[18px]">{c.flag || '🌍'}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark font-mono">{c.code}</span>
                  {c.id === value && <Check size={16} className="text-brand-primary shrink-0" />}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Admin() {
  const { profile } = useAuth();
  const [allowedIds, setAllowedIds] = useState<AllowedId[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [idType, setIdType] = useState<IdType>('SALES');
  const [role, setRole] = useState<RoleType>('member');
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedMember, setSelectedMember] = useState('');
  const [pointsToAdd, setPointsToAdd] = useState<number | ''>('');
  const [isAwarding, setIsAwarding] = useState(false);

  const [teamName, setTeamName] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [teamType, setTeamType] = useState<TeamType>('sales');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('');
  const [isAddingCountry, setIsAddingCountry] = useState(false);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAllowedIds();
      fetchMembers();
      fetchCountries();
      fetchTeams();
    }
  }, [profile]);

  async function fetchAllowedIds() {
    const { data } = await supabase.from('allowed_user_ids').select('*').order('created_at', { ascending: false });
    if (data) setAllowedIds(data);
    setLoading(false);
  }

  async function fetchMembers() {
    const { data } = await supabase.from('profiles').select('id, username, points, avatar_url').eq('role', 'member').order('username');
    if (data) setMembers(data);
  }

  async function fetchCountries() {
    const { data } = await supabase.from('countries').select('*').order('name');
    if (data) setCountries(data);
  }

  async function fetchTeams() {
    const { data } = await supabase.from('teams').select('*, countries(name)').order('name');
    if (data) setTeams(data);
  }

  async function generateId(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    const sameTypeIds = allowedIds.filter((a) => a.user_id_code.startsWith(idType + '-'));
    const nextNumber = sameTypeIds.length > 0 ? Math.max(...sameTypeIds.map((id) => parseInt(id.user_id_code.split('-')[1]) || 0)) + 1 : 1;
    const newCode = idType + '-' + nextNumber.toString().padStart(4, '0');
    const { error } = await supabase.from('allowed_user_ids').insert({ team_id: profile?.team_id, user_id_code: newCode, role });
    if (!error) fetchAllowedIds();
    setIsGenerating(false);
  }

  async function handleAwardPoints(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember || !pointsToAdd) return;
    setIsAwarding(true);
    const { error } = await supabase.rpc('award_points', { target_user_id: selectedMember, amount: pointsToAdd });
    if (!error) {
      setSelectedMember('');
      setPointsToAdd('');
      fetchMembers();
      alert('Points awarded successfully!');
    } else {
      alert(error.message);
    }
    setIsAwarding(false);
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName || !selectedCountryId) return;
    setIsCreatingTeam(true);
    const { error } = await supabase.from('teams').insert({ name: teamName, country_id: selectedCountryId, team_type: teamType });
    if (!error) {
      setTeamName('');
      setSelectedCountryId('');
      fetchTeams();
    } else {
      alert(error.message);
    }
    setIsCreatingTeam(false);
  }

  async function handleAddCountry(e: React.FormEvent) {
    e.preventDefault();
    if (!newCountryName || !newCountryCode) return;
    setIsAddingCountry(true);
    const code = newCountryCode.trim().toUpperCase();
    const codePoints = code.split('').map(char => 0x1F1E6 + char.charCodeAt(0) - 65);
    const flag = code.length === 2 ? String.fromCodePoint(...codePoints) : '🌍';
    const { error } = await supabase.from('countries').insert({ name: newCountryName.trim(), code: code, flag: flag });
    if (!error) {
      setNewCountryName('');
      setNewCountryCode('');
      setShowCountrySheet(false);
      fetchCountries();
    } else {
      alert(error.message);
    }
    setIsAddingCountry(false);
  }

  if (loading || profile?.role !== 'admin') return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;

  return (
    <div className="animate-enter space-y-5">
      <div>
        <h1 className="page-title">Admin</h1>
        <p className="text-[14px] text-text-secondaryLight dark:text-text-secondaryDark ml-1 mb-2">Manage team access.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Award Points */}
        <div className="card md:col-span-2 space-y-3">
          <h3 className="text-[16px] font-bold flex items-center gap-2">
            <Trophy size={18} className="text-brand-primary" /> Award Points
          </h3>
          <form onSubmit={handleAwardPoints} className="flex flex-col sm:flex-row gap-2">
            <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="input-field flex-1" required>
              <option value="">Select a member...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.username} ({m.points} pts)</option>)}
            </select>
            <input type="number" placeholder="Points (e.g. 50)" value={pointsToAdd} onChange={e => setPointsToAdd(Number(e.target.value))} className="input-field w-full sm:w-32" required />
            <button type="submit" disabled={isAwarding} className="h-[44px] px-4 bg-brand-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 shrink-0">
              {isAwarding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={2.5} />} Add
            </button>
          </form>
        </div>

        <div className="card md:col-span-2 space-y-3">
          <h3 className="text-[16px] font-bold flex items-center gap-2">
            <Shield size={18} className="text-brand-primary" /> Generate New ID
          </h3>
          <form onSubmit={generateId} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold mb-1.5 ml-1 text-text-secondaryLight dark:text-text-secondaryDark">ID Type</label>
                <SegmentedControl<IdType> group="idType" value={idType} onChange={setIdType} options={[{ label: 'Sales', value: 'SALES' }, { label: 'Development', value: 'DEV' }]} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5 ml-1 text-text-secondaryLight dark:text-text-secondaryDark">Role</label>
                <SegmentedControl<RoleType> group="role" value={role} onChange={setRole} options={[{ label: 'Member', value: 'member' }, { label: 'Admin', value: 'admin' }]} />
              </div>
            </div>
            <button type="submit" disabled={isGenerating} className="w-full h-[44px] bg-brand-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:pointer-events-none">
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={2.5} />} Generate {idType}-XXXX
            </button>
          </form>
        </div>

        <div className="card bg-brand-primary/5 border-brand-primary/20">
          <h3 className="text-[12px] font-semibold text-brand-primary mb-1">Total IDs</h3>
          <p className="text-3xl font-bold">{allowedIds.length}</p>
        </div>
        <div className="card bg-green-500/5 border-green-500/20">
          <h3 className="text-[12px] font-semibold text-green-500 mb-1">Claimed</h3>
          <p className="text-3xl font-bold">{allowedIds.filter((id) => id.is_used).length}</p>
        </div>

        <div className="card md:col-span-2 space-y-2">
          <h3 className="text-[16px] font-bold mb-2">Team Access</h3>
          {allowedIds.map((id) => (
            <div key={id.id} className="flex justify-between items-center p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-surface-borderLight dark:border-surface-borderDark">
              <div>
                <p className="font-mono font-bold text-[15px]">{id.user_id_code}</p>
                <p className="text-[11px] text-text-secondaryLight dark:text-text-secondaryDark uppercase tracking-wider font-semibold mt-0.5">{id.role}</p>
              </div>
              <div className={`flex items-center gap-1.5 text-[13px] font-semibold ${id.is_used ? 'text-green-500' : 'text-text-secondaryLight dark:text-text-secondaryDark'}`}>
                <UserCheck size={16} /> {id.is_used ? 'Claimed' : 'Ready'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-3 mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[16px] font-bold flex items-center gap-2">
            <Users size={18} className="text-brand-primary" /> Manage Teams
          </h3>
          <button type="button" onClick={() => setShowCountrySheet(true)} className="h-9 px-3 bg-brand-primary/10 text-brand-primary rounded-lg text-[12px] font-bold flex items-center gap-1.5 active:scale-95 transition-transform shrink-0">
            <Globe size={14} strokeWidth={2.5} /> Add Country
          </button>
        </div>

        <form onSubmit={handleCreateTeam} className="space-y-3">
          <input type="text" placeholder="Team Name" value={teamName} onChange={e => setTeamName(e.target.value)} className="input-field" required />
          <CountrySelect countries={countries} value={selectedCountryId} onChange={setSelectedCountryId} />
          <div>
            <label className="block text-[12px] font-semibold mb-1.5 ml-1 text-text-secondaryLight dark:text-text-secondaryDark">Team Type</label>
            <SegmentedControl<TeamType> group="teamType" value={teamType} onChange={setTeamType} options={[{label: 'Sales', value: 'sales'}, {label: 'Dev', value: 'dev'}, {label: 'Mixed', value: 'mixed'}]} />
          </div>
          <button type="submit" disabled={isCreatingTeam} className="w-full h-[44px] bg-brand-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:pointer-events-none">
            {isCreatingTeam ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={2.5} />} Create Team
          </button>
        </form>
        <div className="space-y-2 mt-4">
          {teams.length === 0 && <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark text-center py-2">No teams yet.</p>}
          {teams.map(t => (
            <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-surface-borderLight dark:border-surface-borderDark">
              <div>
                <p className="font-semibold text-[14px]">{t.name}</p>
                <p className="text-[11px] text-text-secondaryLight dark:text-text-secondaryDark">{t.countries?.name || 'No country'}</p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">{t.team_type}</span>
            </div>
          ))}
        </div>
      </div>

      <BottomSheet isOpen={showCountrySheet} onClose={() => setShowCountrySheet(false)} title="Add Country">
        <form onSubmit={handleAddCountry} className="space-y-4">
          <input type="text" placeholder="Country Name" value={newCountryName} onChange={e => setNewCountryName(e.target.value)} className="input-field" required />
          <input type="text" placeholder="Country Code (e.g. US)" value={newCountryCode} onChange={e => setNewCountryCode(e.target.value)} className="input-field" maxLength={3} required />
          <button type="submit" disabled={isAddingCountry} className="w-full h-[44px] bg-brand-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:pointer-events-none">
            {isAddingCountry ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={2.5} />} Save Country
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
