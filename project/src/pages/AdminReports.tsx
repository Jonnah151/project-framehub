import { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Package, Calendar, Users, TrendingUp, Download } from 'lucide-react';
import { supabase, Payment, Profile } from '../lib/supabase';
import { Card, Spinner, Badge, statusColors, formatCurrency, Button } from '../components/ui';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(0);
  const [orderStatusCounts, setOrderStatusCounts] = useState<Record<string, number>>({});
  const [bookingStatusCounts, setBookingStatusCounts] = useState<Record<string, number>>({});
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [topServices, setTopServices] = useState<{ name: string; count: number }[]>([]);
  const [recentPayments, setRecentPayments] = useState<(Payment & { customer?: string })[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: payments }, { data: orders }, { data: bookings }, { data: profiles }] = await Promise.all([
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('status'),
        supabase.from('bookings').select('status, service_name'),
        supabase.from('profiles').select('role'),
      ]);

      const paid = (payments as Payment[] | null)?.filter((p) => p.status === 'paid') ?? [];
      setRevenue(paid.reduce((s, p) => s + Number(p.amount), 0));

      const osc: Record<string, number> = {};
      (orders ?? []).forEach((o) => { osc[o.status] = (osc[o.status] ?? 0) + 1; });
      setOrderStatusCounts(osc);

      const bsc: Record<string, number> = {};
      (bookings ?? []).forEach((b) => { bsc[b.status] = (bsc[b.status] ?? 0) + 1; });
      setBookingStatusCounts(bsc);

      const rc: Record<string, number> = {};
      (profiles ?? []).forEach((p) => { rc[p.role] = (rc[p.role] ?? 0) + 1; });
      setRoleCounts(rc);

      // Top services from bookings
      const svcCount: Record<string, number> = {};
      (bookings ?? []).forEach((b) => { svcCount[b.service_name] = (svcCount[b.service_name] ?? 0) + 1; });
      setTopServices(Object.entries(svcCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })));

      // Recent payments with customer names
      const payUserIds = [...new Set(paid.map((p) => p.user_id))];
      const { data: payProfiles } = await supabase.from('profiles').select('id, full_name').in('id', payUserIds);
      const map: Record<string, string> = {};
      (payProfiles as Profile[] | null)?.forEach((p) => { map[p.id] = p.full_name; });
      setRecentPayments(paid.slice(0, 10).map((p) => ({ ...p, customer: map[p.user_id] ?? 'Unknown' })));

      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Platform analytics and insights</p>
        </div>
        <Button onClick={() => {
          const rows = [
            ['metric', 'value'],
            ['total_revenue', revenue],
            ['users', Object.values(roleCounts).reduce((a, b) => a + b, 0)],
            ['orders', Object.values(orderStatusCounts).reduce((a, b) => a + b, 0)],
            ['bookings', Object.values(bookingStatusCounts).reduce((a, b) => a + b, 0)],
          ];
          const csv = rows.map((row) => row.join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'admin-report.csv';
          link.click();
          URL.revokeObjectURL(url);
        }}><Download className="h-4 w-4 mr-1.5" /> Export CSV</Button>
      </div>

      {/* Revenue highlight */}
      <Card className="p-6 bg-slate-900 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Total Revenue</div>
            <div className="text-4xl font-bold mt-1">{formatCurrency(revenue)}</div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <DollarSign className="h-7 w-7" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order status breakdown */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-slate-700" />
            <h2 className="font-semibold text-slate-900">Orders by status</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(orderStatusCounts).length === 0 ? (
              <p className="text-sm text-slate-400">No orders yet</p>
            ) : (
              Object.entries(orderStatusCounts).map(([status, count]) => {
                const total = Object.values(orderStatusCounts).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge color={statusColors[status]}>{status}</Badge>
                      <span className="text-sm font-medium text-slate-700">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Booking status breakdown */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-slate-700" />
            <h2 className="font-semibold text-slate-900">Bookings by status</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(bookingStatusCounts).length === 0 ? (
              <p className="text-sm text-slate-400">No bookings yet</p>
            ) : (
              Object.entries(bookingStatusCounts).map(([status, count]) => {
                const total = Object.values(bookingStatusCounts).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge color={statusColors[status]}>{status}</Badge>
                      <span className="text-sm font-medium text-slate-700">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* User role distribution */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-slate-700" />
            <h2 className="font-semibold text-slate-900">Users by role</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['customer', 'admin', 'designer', 'photographer', 'delivery'].map((r) => (
              <div key={r} className="rounded-xl border border-slate-100 p-3">
                <div className="text-2xl font-bold text-slate-900">{roleCounts[r] ?? 0}</div>
                <div className="text-xs text-slate-500 capitalize">{r}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top services */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-slate-700" />
            <h2 className="font-semibold text-slate-900">Top booked services</h2>
          </div>
          {topServices.length === 0 ? (
            <p className="text-sm text-slate-400">No bookings yet</p>
          ) : (
            <div className="space-y-2">
              {topServices.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-900">{s.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{s.count} bookings</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent payments */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-slate-700" />
          <h2 className="font-semibold text-slate-900">Recent payments</h2>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-slate-400">No payments yet</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">{p.customer}</div>
                  <div className="text-xs text-slate-400 capitalize">{p.reference_type} · {p.transaction_id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(Number(p.amount))}</span>
                  <Badge color={statusColors[p.status]}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
