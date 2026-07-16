import { useEffect, useState } from 'react';
import { Package, Calendar, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, Order, Booking } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, statusColors, formatCurrency, formatDate } from '../components/ui';

export default function StaffDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      if (profile.role === 'designer' || profile.role === 'delivery') {
        let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (profile.role === 'designer') q = q.eq('assigned_designer', profile.id);
        if (profile.role === 'delivery') q = q.eq('assigned_delivery', profile.id);
        const { data } = await q;
        setOrders(data ?? []);
      }
      if (profile.role === 'photographer') {
        const { data } = await supabase
          .from('bookings')
          .select('*')
          .eq('assigned_photographer', profile.id)
          .order('created_at', { ascending: false });
        setBookings(data ?? []);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner />;

  const activeOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing');
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'delivered');
  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'in_progress');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile?.full_name.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500 mt-1">Your assigned work at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {profile?.role !== 'photographer' && (
          <>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{activeOrders.length}</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">Active orders</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{completedOrders.length}</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">Completed</p>
            </Card>
          </>
        )}
        {profile?.role === 'photographer' && (
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{upcomingBookings.length}</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">Upcoming bookings</p>
          </Card>
        )}
      </div>

      {profile?.role !== 'photographer' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Your orders</h2>
            <Link to={profile?.role === 'designer' ? '/app/staff/orders' : '/app/staff/deliveries'} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {orders.length === 0 ? (
            <EmptyState title="No orders assigned" message="Orders assigned to you will appear here" icon={<Package className="h-10 w-10" />} />
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{o.title}</div>
                    <div className="text-xs text-slate-400">{formatDate(o.created_at)} · {formatCurrency(Number(o.total_amount))}</div>
                  </div>
                  <Badge color={statusColors[o.status]}>{o.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {profile?.role === 'photographer' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Your bookings</h2>
            <Link to="/app/staff/bookings" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {bookings.length === 0 ? (
            <EmptyState title="No bookings assigned" message="Bookings assigned to you will appear here" icon={<Calendar className="h-10 w-10" />} />
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{b.service_name}</div>
                    <div className="text-xs text-slate-400">{formatDate(b.booking_date)} · {b.location}</div>
                  </div>
                  <Badge color={statusColors[b.status]}>{b.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
