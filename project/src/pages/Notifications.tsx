import { useEffect, useState } from 'react';
import { Bell, Check, Package, Calendar, CreditCard, Info, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Notification } from '../lib/supabase';
import { Card, Button, Spinner, EmptyState, formatDateTime } from '../components/ui';

const typeIcons: Record<string, React.ReactNode> = {
  order: <Package className="h-4 w-4" />,
  booking: <Calendar className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  system: <Info className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  order: 'bg-blue-50 text-blue-600',
  booking: 'bg-emerald-50 text-emerald-600',
  payment: 'bg-purple-50 text-purple-600',
  info: 'bg-slate-100 text-slate-600',
  system: 'bg-amber-50 text-amber-600',
};

export default function Notifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setNotifications(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile]);

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    load();
  };

  const markRead = async (n: Notification) => {
    if (n.is_read) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
  };

  const deleteNotif = async (n: Notification) => {
    await supabase.from('notifications').delete().eq('id', n.id);
    setNotifications(notifications.filter((x) => x.id !== n.id));
  };

  if (loading) return <Spinner />;

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <Check className="h-4 w-4 mr-1.5" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <EmptyState title="No notifications" message="You'll be notified about your orders and bookings here" icon={<Bell className="h-10 w-10" />} />
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${!n.is_read ? 'ring-1 ring-slate-200' : ''}`}
            >
              <div className="flex items-start gap-3" onClick={() => markRead(n)}>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${typeColors[n.type] ?? typeColors.info}`}>
                  {typeIcons[n.type] ?? <Info className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{n.title}</span>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotif(n); }}
                  className="text-slate-300 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
