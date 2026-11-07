import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, UserCheck, Shield, Plus } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

type AllowedId = { id: string; user_id_code: string; role: string; is_used: boolean; created_at: string; };
type IdType = 'SALES' | 'DEV';
type RoleType = 'member' | 'admin';

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

export default function Admin() {
  const { profile } = useAuth();
  const [allowedIds, setAllowedIds] = useState<AllowedId[]>([]);
  const [loading, setLoading] = useState(true);
  const [idType, setIdType] = useState<IdType>('SALES');
  const [role, setRole] = useState<RoleType>('member');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (profile?.role === 'admin') fetchAllowedIds();
  }, [profile]);

  async function fetchAllowedIds() {
    const { data } = await supabase.from('allowed_user_ids').select('*').order('created_at', { ascending: false });
    if (data) setAllowedIds(data);
    setLoading(false);
  }

  async function generateId(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    const sameTypeIds = allowedIds.filter((a) => a.user_id_code.startsWith(idType + '-'));
    const nextNumber =
      sameTypeIds.length > 0
        ? Math.max(...sameTypeIds.map((id) => parseInt(id.user_id_code.split('-')[1]) || 0)) + 1
        : 1;
    const newCode = idType + '-' + nextNumber.toString().padStart(4, '0');
    const { error } = await supabase
      .from('allowed_user_ids')
      .insert({ team_id: profile?.team_id, user_id_code: newCode, role });
    if (!error) fetchAllowedIds();
    setIsGenerating(false);
  }

  if (loading || profile?.role !== 'admin')
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );

  return (
    <div className="animate-enter space-y-5">
      <div>
        <h1 className="page-title">Admin</h1>
        <p className="text-[14px] text-text-secondaryLight dark:text-text-secondaryDark ml-1 mb-2">
          Manage team access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card md:col-span-2 space-y-3">
          <h3 className="text-[16px] font-bold flex items-center gap-2">
            <Shield size={18} className="text-brand-primary" /> Generate New ID
          </h3>
          <form onSubmit={generateId} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold mb-1.5 ml-1 text-text-secondaryLight dark:text-text-secondaryDark">
                  ID Type
                </label>
                <SegmentedControl<IdType>
                  group="idType"
                  value={idType}
                  onChange={setIdType}
                  options={[
                    { label: 'Sales', value: 'SALES' },
                    { label: 'Development', value: 'DEV' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5 ml-1 text-text-secondaryLight dark:text-text-secondaryDark">
                  Role
                </label>
                <SegmentedControl<RoleType>
                  group="role"
                  value={role}
                  onChange={setRole}
                  options={[
                    { label: 'Member', value: 'member' },
                    { label: 'Admin', value: 'admin' },
                  ]}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full h-[44px] bg-brand-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:pointer-events-none"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={2.5} />}
              Generate {idType}-XXXX
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
            <div
              key={id.id}
              className="flex justify-between items-center p-3 rounded-xl bg-surface-light dark:bg-surface-dark border border-surface-borderLight dark:border-surface-borderDark"
            >
              <div>
                <p className="font-mono font-bold text-[15px]">{id.user_id_code}</p>
                <p className="text-[11px] text-text-secondaryLight dark:text-text-secondaryDark uppercase tracking-wider font-semibold mt-0.5">
                  {id.role}
                </p>
              </div>
              <div
                className={`flex items-center gap-1.5 text-[13px] font-semibold ${
                  id.is_used ? 'text-green-500' : 'text-text-secondaryLight dark:text-text-secondaryDark'
                }`}
              >
                <UserCheck size={16} /> {id.is_used ? 'Claimed' : 'Ready'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
