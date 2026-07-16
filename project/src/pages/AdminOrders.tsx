import { useEffect, useState, useCallback } from 'react';
import { Package, Search, User } from 'lucide-react';
import { supabase, Order, Profile, OrderStatus } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, Button, Select, statusColors, formatCurrency, formatDateTime } from '../components/ui';

const statusSteps: OrderStatus[] = ['pending', 'processing', 'completed', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<(Order & { customer?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const userIds = [...new Set((ordersData ?? []).map((o) => o.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
    const map: Record<string, string> = {};
    (profiles as Profile[] | null)?.forEach((p) => { map[p.id] = p.full_name; });
    setOrders((ordersData ?? []).map((o) => ({ ...o, customer: map[o.user_id] ?? 'Unknown' })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.title.toLowerCase().includes(q) || (o.customer ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Manage and track all customer orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders or customers…"
            className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-none"
        >
          <option value="all">All statuses</option>
          {statusSteps.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState title="No orders found" message="No orders match your filters" icon={<Package className="h-10 w-10" />} /></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{o.title}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <User className="h-3 w-3" />{o.customer} · {formatDateTime(o.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 hidden sm:block">{formatCurrency(Number(o.total_amount))}</span>
                  <Badge color={statusColors[o.status]}>{o.status}</Badge>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedId(selectedId === o.id ? null : o.id)}>
                    Manage
                  </Button>
                </div>
              </div>
              {selectedId === o.id && <OrderManagePanel order={o} onUpdated={load} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderManagePanel({ order, onUpdated }: { order: Order & { customer?: string }; onUpdated: () => void }) {
  const [designers, setDesigners] = useState<Profile[]>([]);
  const [deliveryStaff, setDeliveryStaff] = useState<Profile[]>([]);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [designer, setDesigner] = useState(order.assigned_designer ?? '');
  const [delivery, setDelivery] = useState(order.assigned_delivery ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: d }, { data: dl }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'designer'),
        supabase.from('profiles').select('*').eq('role', 'delivery'),
      ]);
      setDesigners(d as Profile[] ?? []);
      setDeliveryStaff(dl as Profile[] ?? []);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('orders').update({
      status,
      assigned_designer: designer || null,
      assigned_delivery: delivery || null,
    }).eq('id', order.id);
    setSaving(false);
    onUpdated();
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select label="Status" value={status} onChange={(v) => setStatus(v as OrderStatus)}
          options={statusSteps.map((s) => ({ value: s, label: s }))} />
        <Select label="Designer" value={designer} onChange={setDesigner} placeholder="Unassigned"
          options={designers.map((d) => ({ value: d.id, label: d.full_name }))} />
        <Select label="Delivery" value={delivery} onChange={setDelivery} placeholder="Unassigned"
          options={deliveryStaff.map((d) => ({ value: d.id, label: d.full_name }))} />
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </div>
  );
}
