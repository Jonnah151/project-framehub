import { useEffect, useState, useCallback } from 'react';
import { Package, Calendar, User } from 'lucide-react';
import { supabase, Order, Booking, Profile } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, Select, statusColors, formatDate } from '../components/ui';

export default function AdminAssign() {
  const [orders, setOrders] = useState<(Order & { customer?: string })[]>([]);
  const [bookings, setBookings] = useState<(Booking & { customer?: string })[]>([]);
  const [designers, setDesigners] = useState<Profile[]>([]);
  const [deliveryStaff, setDeliveryStaff] = useState<Profile[]>([]);
  const [photographers, setPhotographers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: o }, { data: b }, { data: d }, { data: dl }, { data: ph }] = await Promise.all([
      supabase.from('orders').select('*').in('status', ['pending', 'processing']).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').in('status', ['pending', 'confirmed']).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'designer'),
      supabase.from('profiles').select('*').eq('role', 'delivery'),
      supabase.from('profiles').select('*').eq('role', 'photographer'),
    ]);

    const orderIds = [...new Set((o ?? []).map((x) => x.user_id))];
    const bookingIds = [...new Set((b ?? []).map((x) => x.user_id))];
    const allIds = [...new Set([...orderIds, ...bookingIds])];
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', allIds);
    const map: Record<string, string> = {};
    (profiles as Profile[] | null)?.forEach((p) => { map[p.id] = p.full_name; });

    setOrders((o ?? []).map((x) => ({ ...x, customer: map[x.user_id] ?? 'Unknown' })));
    setBookings((b ?? []).map((x) => ({ ...x, customer: map[x.user_id] ?? 'Unknown' })));
    setDesigners(d as Profile[] ?? []);
    setDeliveryStaff(dl as Profile[] ?? []);
    setPhotographers(ph as Profile[] ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignOrder = async (id: string, field: 'assigned_designer' | 'assigned_delivery', value: string) => {
    await supabase.from('orders').update({ [field]: value || null }).eq('id', id);
    load();
  };

  const assignBooking = async (id: string, value: string) => {
    const update: Record<string, unknown> = { assigned_photographer: value || null };
    if (value) update.status = 'confirmed';
    await supabase.from('bookings').update(update).eq('id', id);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
        <p className="text-sm text-slate-500 mt-1">Assign staff to pending orders and bookings</p>
      </div>

      {/* Orders needing assignment */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-slate-700" />
          <h2 className="font-semibold text-slate-900">Orders ({orders.length})</h2>
        </div>
        {orders.length === 0 ? (
          <EmptyState title="No orders need assignment" message="All orders are assigned" />
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{o.title}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <User className="h-3 w-3" />{o.customer} · {formatDate(o.created_at)}
                    </div>
                  </div>
                  <Badge color={statusColors[o.status]}>{o.status}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Designer"
                    value={o.assigned_designer ?? ''}
                    onChange={(v) => assignOrder(o.id, 'assigned_designer', v)}
                    placeholder="Unassigned"
                    options={designers.map((d) => ({ value: d.id, label: d.full_name }))}
                  />
                  <Select
                    label="Delivery"
                    value={o.assigned_delivery ?? ''}
                    onChange={(v) => assignOrder(o.id, 'assigned_delivery', v)}
                    placeholder="Unassigned"
                    options={deliveryStaff.map((d) => ({ value: d.id, label: d.full_name }))}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bookings needing assignment */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-slate-700" />
          <h2 className="font-semibold text-slate-900">Bookings ({bookings.length})</h2>
        </div>
        {bookings.length === 0 ? (
          <EmptyState title="No bookings need assignment" message="All bookings are assigned" />
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{b.service_name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <User className="h-3 w-3" />{b.customer} · {formatDate(b.booking_date)} · {b.location}
                    </div>
                  </div>
                  <Badge color={statusColors[b.status]}>{b.status}</Badge>
                </div>
                <Select
                  label="Photographer"
                  value={b.assigned_photographer ?? ''}
                  onChange={(v) => assignBooking(b.id, v)}
                  placeholder="Unassigned"
                  options={photographers.map((p) => ({ value: p.id, label: p.full_name }))}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
