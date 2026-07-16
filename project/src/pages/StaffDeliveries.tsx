import { useEffect, useState, useCallback } from 'react';
import { Truck, Search, Package, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Order, OrderStatus, Profile } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, Select, statusColors, formatCurrency, formatDate } from '../components/ui';

const statusOptions: OrderStatus[] = ['pending', 'processing', 'completed', 'delivered', 'cancelled'];

export default function StaffDeliveries() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<(Order & { customer?: string; customer_phone?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('assigned_delivery', profile.id)
      .order('created_at', { ascending: false });
    const userIds = [...new Set((data ?? []).map((o) => o.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone').in('id', userIds);
    const map: Record<string, Profile> = {};
    (profiles as Profile[] | null)?.forEach((p) => { map[p.id] = p; });
    setOrders((data ?? []).map((o) => ({
      ...o,
      customer: map[o.user_id]?.full_name ?? 'Unknown',
      customer_phone: map[o.user_id]?.phone ?? '',
    })));
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const filtered = orders.filter((o) =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || (o.customer ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Deliveries</h1>
        <p className="text-sm text-slate-500 mt-1">Orders assigned to you for delivery</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order or customer…"
          className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState title="No deliveries assigned" message="Orders assigned for delivery will appear here" icon={<Truck className="h-10 w-10" />} /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{o.title}</div>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3">
                      <span>{o.customer}</span>
                      <span>{formatDate(o.created_at)}</span>
                      <span>{formatCurrency(Number(o.total_amount))}</span>
                    </div>
                    {o.customer_phone && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />{o.customer_phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={statusColors[o.status]}>{o.status}</Badge>
                  <Select
                    value={o.status}
                    onChange={(v) => updateStatus(o.id, v as OrderStatus)}
                    options={statusOptions.map((s) => ({ value: s, label: s }))}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
