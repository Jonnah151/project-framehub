import { useEffect, useState, useCallback } from 'react';
import { Package, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Order, OrderStatus } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, Select, statusColors, formatCurrency, formatDate } from '../components/ui';

const statusOptions: OrderStatus[] = ['pending', 'processing', 'completed', 'delivered', 'cancelled'];

export default function StaffOrders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('assigned_designer', profile.id)
      .order('created_at', { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const filtered = orders.filter((o) =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assigned Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Design orders assigned to you</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders…"
          className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState title="No orders assigned" message="Orders assigned to you will appear here" icon={<Package className="h-10 w-10" />} /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{o.title}</div>
                    <div className="text-xs text-slate-400">{formatDate(o.created_at)} · {formatCurrency(Number(o.total_amount))}</div>
                    {o.description && <p className="mt-1 text-xs text-slate-500 line-clamp-1">{o.description}</p>}
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
