import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Trophy } from 'lucide-react';

type LeaderboardEntry = {
  id: string;
  username: string;
  avatar_url: string;
  points: number;
  team_type: string | null;
  country_name: string | null;
  country_code: string | null;
};

function getFlag(code: string | null): string {
  if (!code || code.length !== 2) return '🌍';
  const codePoints = code.toUpperCase().split('').map(char => 0x1F1E6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    const { data, error } = await supabase.from('global_leaderboard').select('*').limit(50);
    if (!error && data) setEntries(data as any);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-4">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-8" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="card flex items-center gap-4 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-enter">
      <div className="mb-8">
        <h1 className="page-title mb-1 flex items-center gap-3">
          <Trophy className="text-brand-primary" size={32} /> Leaderboard
        </h1>
        <p className="text-[14px] text-text-secondaryLight dark:text-text-secondaryDark ml-1">
          Top performing team members worldwide.
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {top3.map((entry, index) => {
          const colors = [
            'bg-gradient-to-b from-yellow-500/20 to-surface-cardLight dark:to-surface-cardDark border-yellow-500/50',
            'bg-gradient-to-b from-gray-300/20 to-surface-cardLight dark:to-surface-cardDark border-gray-400/50',
            'bg-gradient-to-b from-amber-600/20 to-surface-cardLight dark:to-surface-cardDark border-amber-600/50',
          ];
          return (
            <div key={entry.id} className={`card flex flex-col items-center text-center p-6 relative border-2 ${colors[index]}`}>
              <div className="absolute -top-4 bg-surface-cardLight dark:bg-surface-cardDark px-3 py-1 rounded-full text-[12px] font-bold text-text-secondaryLight dark:text-text-secondaryDark border border-surface-borderLight dark:border-surface-borderDark shadow-sm">
                Rank #{index + 1}
              </div>
              <div className="relative mb-3">
                <img src={entry.avatar_url} alt={entry.username} className="w-16 h-16 rounded-full object-cover shadow-md" />
                <div className="absolute -bottom-2 -right-2 text-[20px] bg-surface-cardLight dark:bg-surface-cardDark rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
                  {getFlag(entry.country_code)}
                </div>
              </div>
              <h3 className="font-bold text-[15px] truncate w-full">{entry.username}</h3>
              <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark capitalize mb-2">{entry.team_type || 'Team'}</p>
              <p className="text-[24px] font-black text-brand-primary">{entry.points} <span className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark font-semibold uppercase">pts</span></p>
            </div>
          );
        })}
      </div>

      {/* Rest of the list */}
      <div className="space-y-2">
        {rest.length === 0 && entries.length <= 3 && (
          <p className="text-center text-text-secondaryLight dark:text-text-secondaryDark py-4 text-[14px]">More members will appear here as they earn points.</p>
        )}
        {rest.map((entry, index) => (
          <div key={entry.id} className="card flex items-center gap-3 py-3 px-4 hover:border-brand-primary/30 transition">
            <span className="font-bold text-[14px] text-text-secondaryLight dark:text-text-secondaryDark w-6 text-center">{index + 4}</span>
            <img src={entry.avatar_url} alt={entry.username} className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[14px] truncate">{entry.username}</h4>
              <div className="flex items-center gap-2 text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">
                <span>{getFlag(entry.country_code)} {entry.country_name || 'Global'}</span>
                <span>•</span>
                <span className="capitalize">{entry.team_type || 'Team'}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-brand-primary text-[15px]">{entry.points}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

