import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Order, OrderStatus } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, Button, statusColors, formatCurrency, formatDate } from '../components/ui';

const statusFilters: (OrderStatus | 'all')[] = ['all', 'pending', 'processing', 'completed', 'delivered', 'cancelled'];

export default function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setOrders(data ?? []);
      setLoading(false);
    })();
  }, [profile]);

  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !o.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Track your printing and branding orders</p>
        </div>
        <Link to="/app/orders/new">
          <Button><Plus className="h-4 w-4 mr-1.5" /> New Order</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders…"
            className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="No orders found" message="Create a new order to get started" icon={<Package className="h-10 w-10" />} />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Link key={o.id} to={`/app/orders/${o.id}`}>
              <Card className="p-4 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{o.title}</div>
                      <div className="text-xs text-slate-400">{formatDate(o.created_at)} · {formatCurrency(Number(o.total_amount))}</div>
                    </div>
                  </div>
                  <Badge color={statusColors[o.status]}>{o.status}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
