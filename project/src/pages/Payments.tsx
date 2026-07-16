import { useEffect, useState } from 'react';
import { CreditCard, TrendingUp, Check, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Payment } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, statusColors, formatCurrency, formatDate } from '../components/ui';

export default function Payments() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setPayments(data ?? []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <Spinner />;

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const pending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500 mt-1">Your payment history and transactions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalPaid)}</div>
              <div className="text-sm text-slate-500">Total paid</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(pending)}</div>
              <div className="text-sm text-slate-500">Pending</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{payments.length}</div>
              <div className="text-sm text-slate-500">Transactions</div>
            </div>
          </div>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card>
          <EmptyState title="No payments yet" message="Your payment history will appear here" icon={<CreditCard className="h-10 w-10" />} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 capitalize">{p.reference_type} payment</div>
                    <div className="text-xs text-slate-400">
                      {formatDate(p.created_at)} · {p.method} · {p.transaction_id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(Number(p.amount))}</span>
                  <Badge color={statusColors[p.status]}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
