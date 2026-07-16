import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, Calendar, DollarSign, ArrowRight, Clock, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { supabase, type Order, type Booking, type Profile, type BusinessPlan } from '../lib/supabase';
import { Badge, Card, Spinner, statusColors, formatCurrency, formatDate } from '../components/ui';
import { MotionCard } from '../components/PremiumMotion';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, orders: 0, bookings: 0, revenue: 0, pendingOrders: 0, pendingBookings: 0, plans: 0, approvedPlans: 0, rejectedPlans: 0 });
  const [recentOrders, setRecentOrders] = useState<(Order & { customer?: string })[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentPlans, setRecentPlans] = useState<(BusinessPlan & { customer?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: orders }, { count: bookings }, { data: payments },
       { data: pendingO }, { data: pendingB }, { data: recentO }, { data: recentB }, { data: plans }, { data: recentPlansData }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount, status'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed']),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('business_plans').select('*', { count: 'exact', head: true }),
        supabase.from('business_plans').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const revenue = (payments ?? []).filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
      const approvedPlans = (plans ?? []).filter((p: BusinessPlan) => p.status === 'approved').length;
      const rejectedPlans = (plans ?? []).filter((p: BusinessPlan) => p.status === 'rejected').length;
      setStats({
        users: users ?? 0,
        orders: orders ?? 0,
        bookings: bookings ?? 0,
        revenue,
        pendingOrders: pendingO?.length ?? 0,
        pendingBookings: pendingB?.length ?? 0,
        plans: plans?.length ?? 0,
        approvedPlans,
        rejectedPlans,
      });

      // Fetch customer names for recent orders
      const orderRows = recentO ?? [];
      const userIds = [...new Set(orderRows.map((o) => o.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      const profileMap: Record<string, string> = {};
      (profiles as Profile[] | null)?.forEach((p) => { profileMap[p.id] = p.full_name; });
      setRecentOrders(orderRows.map((o) => ({ ...o, customer: profileMap[o.user_id] ?? 'Unknown' })));
      setRecentBookings(recentB ?? []);

      const planUserIds = [...new Set((recentPlansData ?? []).map((p) => p.user_id))];
      const { data: planProfiles } = await supabase.from('profiles').select('id, full_name').in('id', planUserIds);
      const planProfileMap: Record<string, string> = {};
      (planProfiles as Profile[] | null)?.forEach((p) => { planProfileMap[p.id] = p.full_name; });
      setRecentPlans((recentPlansData ?? []).map((p) => ({ ...p, customer: planProfileMap[p.user_id] ?? 'Unknown' })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const statCards = [
    { label: 'Total users', value: stats.users, icon: <Users className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Business plans', value: stats.plans, icon: <Package className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Approved / Rejected', value: `${stats.approvedPlans}/${stats.rejectedPlans}`, icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
    { label: 'Revenue', value: formatCurrency(stats.revenue), icon: <DollarSign className="h-5 w-5" />, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <MotionCard key={s.label} className="p-5 border-slate-800 bg-slate-900/90">
            <div className="flex items-center justify-between gap-4">
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${s.color}`}>
                {s.icon}
              </div>
              <div className="text-right">
                <span className="text-2xl font-semibold text-white">{s.value}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">{s.label}</p>
          </MotionCard>
        ))}
      </div>

      {/* Action items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MotionCard className="p-5 flex items-center justify-between border-slate-800 bg-slate-900/85">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{stats.pendingOrders} pending orders</div>
              <div className="text-xs text-slate-400">Need assignment or processing</div>
            </div>
          </div>
          <Link to="/app/admin/assign" className="text-sm text-cyan-300 hover:text-white flex items-center gap-1">
            Review <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </MotionCard>
        <MotionCard className="p-5 flex items-center justify-between border-slate-800 bg-slate-900/85">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{stats.pendingBookings} pending bookings</div>
              <div className="text-xs text-slate-400">Awaiting photographer assignment</div>
            </div>
          </div>
          <Link to="/app/admin/bookings" className="text-sm text-cyan-300 hover:text-white flex items-center gap-1">
            Review <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </MotionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-700" />
              <h2 className="font-semibold text-slate-900">Overview summary</h2>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Pending orders</span>
                <span className="font-semibold text-slate-900">{stats.pendingOrders}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: `${Math.min(100, stats.pendingOrders * 10)}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Pending bookings</span>
                <span className="font-semibold text-slate-900">{stats.pendingBookings}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(100, stats.pendingBookings * 10)}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent orders</h2>
            <Link to="/app/admin/orders" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No orders yet</p>
            ) : (
              recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{o.title}</div>
                    <div className="text-xs text-slate-400">{o.customer} · {formatDate(o.created_at)}</div>
                  </div>
                  <Badge color={statusColors[o.status]}>{o.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent plans</h2>
            <Link to="/app/admin/reports" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              View reports <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPlans.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No plans yet</p>
            ) : (
              recentPlans.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{p.title}</div>
                    <div className="text-xs text-slate-400">{p.customer} · {formatDate(p.created_at)}</div>
                  </div>
                  <Badge color={p.status === 'approved' ? 'green' : p.status === 'rejected' ? 'red' : 'amber'}>{p.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
