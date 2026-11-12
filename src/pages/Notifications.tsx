import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle2, Info, AlertTriangle, XCircle, CheckCheck, Loader2 } from 'lucide-react';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
};

const ICONS: Record<string, any> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const TONE: Record<string, string> = {
  info: 'text-state-info bg-state-infoSoft',
  success: 'text-state-success bg-state-successSoft',
  warning: 'text-state-warning bg-state-warningSoft',
  error: 'text-state-danger bg-state-dangerSoft',
};

type Tab = 'all' | 'unread';

export default function Notifications() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, link, type, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setNotifications(data as any);
    setLoading(false);
  }


  async function markAllRead() {
    if (!profile || markingAll) return;
    setMarkingAll(true);
    const previous = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    if (error) {
      setNotifications(previous);
      toast.error('Failed to mark all as read');
    } else {
      toast.success('All notifications marked as read');
    }
    setMarkingAll(false);
  }

  function openNotification(n: Notification) {
    if (!n.is_read) {
      // Optimistic flip + silent fire-and-forget — we are navigating away,
      // so a failure toast here would just confuse the destination page.
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    }
    if (n.link) navigate(n.link);
  }

  const filtered = tab === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.length - unreadCount;

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <SkeletonBox className="h-8 w-32 mb-2" />
        <SkeletonBox className="h-3 w-40 mb-5" />
        <div className="flex gap-1.5 mb-5">
          <SkeletonBox className="h-9 w-20 rounded-xl" />
          <SkeletonBox className="h-9 w-24 rounded-xl" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="card p-3 flex items-start gap-3">
              <SkeletonBox className="w-9 h-9 rounded-xl shrink-0" />
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
          <h1 className="page-title">Notifications</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {unreadCount} unread · {readCount} read
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="btn-secondary shrink-0 !h-[38px] !text-[12px]"
          >
            {markingAll ? <Loader2 className="animate-spin" size={14} /> : <><CheckCheck size={14} /> Mark all read</>}
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        <button onClick={() => setTab('all')} className={tab === 'all' ? 'chip-active' : 'chip'}>
          All
          {notifications.length > 0 && (
            <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{notifications.length}</span>
          )}
        </button>
        <button onClick={() => setTab('unread')} className={tab === 'unread' ? 'chip-active' : 'chip'}>
          Unread
          {unreadCount > 0 && (
            <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{unreadCount}</span>
          )}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <Bell size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">
            {tab === 'unread' ? 'Nothing unread' : 'No notifications yet'}
          </h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {tab === 'unread'
              ? 'You are all caught up.'
              : 'Alerts about leads, meetings and approvals will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const Icon = ICONS[n.type] || Info;
            const tone = TONE[n.type] || TONE.info;
            return (
              <button
                key={n.id}
                onClick={() => openNotification(n)}
                className="card p-3 w-full text-left flex items-start gap-3 hover:border-brand-primary/30 transition-colors active:scale-[0.995]"
              >
                <div className={'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ' + tone}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-0.5">
                    <p className={'text-[13px] leading-snug flex-1 min-w-0 ' + (n.is_read ? 'font-medium' : 'font-semibold')}>
                      {n.title}
                    </p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0 mt-1.5" />}
                  </div>
                  {n.body && (
                    <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark line-clamp-2 mb-1">
                      {n.body}
                    </p>
                  )}
                  <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark">
                    {new Date(n.created_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </button>
            );
          })}
          {notifications.length >= 100 && (
            <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark text-center pt-2">
              Showing 100 most recent notifications
            </p>
          )}
        </div>
      )}
    </div>
  );
}

