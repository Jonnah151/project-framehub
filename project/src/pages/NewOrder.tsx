import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Service } from '../lib/supabase';
import { Card, Button, Input, Textarea, Select, Spinner, formatCurrency } from '../components/ui';

export default function NewOrder() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .in('category', ['printing', 'branding'])
        .order('name');
      setServices(data ?? []);
      setLoading(false);
    })();
  }, []);

  const selectedSvc = services.find((s) => s.id === serviceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedSvc) return;
    setError('');
    setSubmitting(true);
    const { data, error: insertError } = await supabase
      .from('orders')
      .insert({
        user_id: profile.id,
        service_id: selectedSvc.id,
        title,
        description,
        notes,
        total_amount: selectedSvc.price,
        status: 'pending',
      })
      .select()
      .single();
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await supabase.from('notifications').insert({
      user_id: profile.id,
      title: 'Order placed',
      message: `Your order "${title}" has been placed successfully.`,
      type: 'order',
      meta: { order_id: data.id },
    });
    setSuccess(true);
    setTimeout(() => navigate(`/app/orders/${data.id}`), 1200);
  };

  if (loading) return <Spinner />;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Order placed!</h2>
        <p className="mt-1 text-sm text-slate-500">Redirecting to your order…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/app/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Order</h1>
        <p className="text-sm text-slate-500 mt-1">Place a printing or branding order</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Order title" value={title} onChange={setTitle} placeholder="e.g. 500 Business Cards" required />
          <Select
            label="Service"
            value={serviceId}
            onChange={setServiceId}
            placeholder="Select a service"
            options={services.map((s) => ({ value: s.id, label: `${s.name} — ${formatCurrency(s.price)}` }))}
          />
          {selectedSvc && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{selectedSvc.description}</div>
          )}
          <Textarea label="Description" value={description} onChange={setDescription} placeholder="Describe what you need…" rows={3} />
          <Textarea label="Notes" value={notes} onChange={setNotes} placeholder="Any special instructions…" rows={2} />

          {selectedSvc && (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <span className="text-sm text-slate-600">Total: <strong className="text-slate-900">{formatCurrency(selectedSvc.price)}</strong></span>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Placing order…' : 'Place order'}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
