import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, CreditCard, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Order, Booking, Payment } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, statusColors, formatCurrency, formatDate } from '../components/ui';

export default function CustomerDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [{ data: o }, { data: b }, { data: p }] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('bookings').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('payments').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setOrders(o ?? []);
      setBookings(b ?? []);
      setPayments(p ?? []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner />;

  const totalSpent = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const activeOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.full_name.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500 mt-1">Here's what's happening with your account</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{orders.length}</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">Total orders</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{activeOrders}</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">Active orders</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{upcomingBookings}</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">Upcoming bookings</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent)}</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">Total spent</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent orders</h2>
            <Link to="/app/orders" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {orders.length === 0 ? (
            <EmptyState title="No orders yet" message="Place your first order to see it here" icon={<Package className="h-10 w-10" />} />
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Link key={o.id} to={`/app/orders/${o.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:border-slate-200 hover:bg-slate-50 transition-all">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{o.title}</div>
                    <div className="text-xs text-slate-400">{formatDate(o.created_at)}</div>
                  </div>
                  <Badge color={statusColors[o.status]}>{o.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent bookings */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent bookings</h2>
            <Link to="/app/book" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              Book more <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {bookings.length === 0 ? (
            <EmptyState title="No bookings yet" message="Book a photography or videography service" icon={<Calendar className="h-10 w-10" />} />
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
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
      </div>

      {/* Recent payments */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Recent payments</h2>
          <Link to="/app/payments" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {payments.length === 0 ? (
          <EmptyState title="No payments yet" message="Your payment history will appear here" icon={<CreditCard className="h-10 w-10" />} />
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 capitalize">{p.reference_type} payment</div>
                    <div className="text-xs text-slate-400">{formatDate(p.created_at)}</div>
                  </div>
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
