import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
import { SkeletonBox } from '../components/Skeleton';

type Row = {
  id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  team_type: string | null;
  country_name: string | null;
  country_code: string | null;
};

export default function Leaderboard() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const { data } = await supabase
      .from('global_leaderboard')
      .select('*')
      .order('points', { ascending: false })
      .limit(100);
    if (data) setRows(data as any);
    setLoading(false);
  }

  const myRank = rows.findIndex(r => r.id === profile?.id);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <SkeletonBox className="h-8 w-40 mb-2" />
        <SkeletonBox className="h-4 w-48 mb-5" />
        <SkeletonBox className="h-56 rounded-2xl mb-5" />
        <div className="space-y-2">
          {[0,1,2,3,4].map(i => <SkeletonBox key={i} className="h-14 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="mb-5 md:mb-6">
        <h1 className="page-title">Leaderboard</h1>
        <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
          {rows.length} reps ranked by performance points
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <Trophy size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">No rankings yet</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            Points awarded by your admin will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="card !p-4 mb-5">
              <p className="eyebrow mb-3 flex items-center gap-1.5">
                <Flame size={12} className="text-brand-primary" /> Top performers
              </p>
              <div className="grid grid-cols-3 gap-2 items-end">
                {[top3[1], top3[0], top3[2]].map((r, idx) => {
                  if (!r) return <div key={idx} />;
                  const realRank = top3.indexOf(r);
                  const isFirst = realRank === 0;
                  const heights = isFirst ? 'h-24' : 'h-20';
                  const Icon = realRank === 0 ? Trophy : realRank === 1 ? Medal : Award;
                  return (
                    <div key={r.id} className="flex flex-col items-center">
                      <div className={'rounded-full ring-2 shrink-0 mb-1.5 ' + (isFirst ? 'ring-brand-primary' : 'ring-black/10 dark:ring-white/10')}>
                        <img
                          src={r.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + r.username}
                          alt=""
                          className={'rounded-full bg-black/5 dark:bg-white/5 ' + (isFirst ? 'w-14 h-14' : 'w-11 h-11')}
                        />
                      </div>
                      <p className="text-[12px] font-semibold truncate w-full text-center">{r.username}</p>
                      <p className="text-[10px] text-text-mutedLight dark:text-text-mutedDark font-mono tabular-nums">{r.points} pts</p>
                      <div className={'w-full rounded-t-lg mt-2 flex items-center justify-center ' + heights + ' ' + (isFirst ? 'bg-brand-primary text-black' : 'bg-black/5 dark:bg-white/5')}>
                        <Icon size={isFirst ? 20 : 16} className={isFirst ? 'text-black' : 'text-text-mutedLight dark:text-text-mutedDark'} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {myRank >= 0 && (
            <div className="card !p-3 mb-5 border-brand-primary/30">
              <div className="flex items-center gap-3">
                <span className="w-8 text-center font-mono tabular-nums text-[15px] font-bold text-brand-primary shrink-0">#{myRank + 1}</span>
                <img
                  src={profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + (profile?.username || '')}
                  alt=""
                  className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate">You · {profile?.username}</p>
                  <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark font-mono tabular-nums">{rows[myRank].points} points</p>
                </div>
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div>
              <p className="eyebrow mb-2 px-1">Ranks 4–{rows.length}</p>
              <div className="space-y-1.5">
                {rest.map((r, idx) => {
                  const rank = idx + 4;
                  const isMe = r.id === profile?.id;
                  return (
                    <div key={r.id} className={'card !p-2.5 flex items-center gap-3 ' + (isMe ? 'border-brand-primary/30' : '')}>
                      <span className="w-8 text-center font-mono tabular-nums text-[13px] font-bold text-text-mutedLight dark:text-text-mutedDark shrink-0">#{rank}</span>
                      <img
                        src={r.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + r.username}
                        alt=""
                        className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{r.username}{isMe && ' · You'}</p>
                        <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark truncate">
                          {[r.country_name, r.team_type].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <span className="text-[13px] font-mono tabular-nums font-bold text-brand-primary shrink-0">{r.points}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
