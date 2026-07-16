import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Upload, File as FileIcon, Trash2, CreditCard, AlertCircle, ArrowLeft,
  Check, Clock, Loader, Truck, XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Order, OrderFile, Payment } from '../lib/supabase';
import { Card, Button, Badge, Spinner, EmptyState, Input, statusColors, formatCurrency, formatDateTime } from '../components/ui';

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: <Clock className="h-4 w-4" /> },
  { key: 'processing', label: 'Processing', icon: <Loader className="h-4 w-4" /> },
  { key: 'completed', label: 'Completed', icon: <Check className="h-4 w-4" /> },
  { key: 'delivered', label: 'Delivered', icon: <Truck className="h-4 w-4" /> },
];

export default function OrderDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    const [{ data: o }, { data: f }, { data: p }] = await Promise.all([
      supabase.from('orders').select('*').eq('id', id).maybeSingle(),
      supabase.from('order_files').select('*').eq('order_id', id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('reference_type', 'order').eq('reference_id', id).maybeSingle(),
    ]);
    setOrder(o as Order | null);
    setFiles(f ?? []);
    setPayment(p as Payment | null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !profile || !order) return;
    setUploading(true);
    setError('');
    for (const file of Array.from(e.target.files)) {
      const filePath = `${profile.id}/${order.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('order-files').upload(filePath, file);
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      await supabase.from('order_files').insert({
        order_id: order.id,
        user_id: profile.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
      });
    }
    setUploading(false);
    e.target.value = '';
    loadData();
  };

  const handleDeleteFile = async (file: OrderFile) => {
    await supabase.storage.from('order-files').remove([file.file_path]);
    await supabase.from('order_files').delete().eq('id', file.id);
    setFiles(files.filter((f) => f.id !== file.id));
  };

  const handlePay = async () => {
    if (!order || !profile) return;
    if (!paymentRef.trim()) {
      setError('Enter your payment number to proceed.');
      return;
    }
    setError('');
    setPaying(true);
    const { data, error: payErr } = await supabase
      .from('payments')
      .insert({
        user_id: profile.id,
        reference_type: 'order',
        reference_id: order.id,
        amount: order.total_amount,
        status: 'paid',
        method: 'mobile_money',
        transaction_id: paymentRef.trim(),
      })
      .select()
      .single();
    setPaying(false);
    if (payErr) {
      setError(payErr.message);
      return;
    }
    setPayment(data as Payment);
    await supabase.from('orders').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', order.id);
    setOrder({ ...order, status: 'processing' });
    await supabase.from('notifications').insert({
      user_id: profile.id,
      title: 'Payment successful',
      message: `Payment of ${formatCurrency(Number(order.total_amount))} for "${order.title}" was processed.`,
      type: 'payment',
      meta: { payment_id: data.id },
    });
  };

  if (loading) return <Spinner />;
  if (!order) return <EmptyState title="Order not found" message="This order may have been deleted" />;

  const currentStepIdx = statusSteps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/app/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.title}</h1>
          <p className="text-sm text-slate-500 mt-1">Created {formatDateTime(order.created_at)}</p>
        </div>
        <Badge color={statusColors[order.status]}>{order.status}</Badge>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status tracker */}
      <Card className="p-6">
        {isCancelled ? (
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="h-6 w-6" />
            <span className="font-semibold">This order was cancelled</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {statusSteps.map((step, idx) => (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                      idx <= currentStepIdx ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${idx <= currentStepIdx ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < statusSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${idx < currentStepIdx ? 'bg-slate-900' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Order info */}
      <Card className="p-6 space-y-3">
        <h2 className="font-semibold text-slate-900">Order details</h2>
        {order.description && <p className="text-sm text-slate-600">{order.description}</p>}
        {order.notes && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <span className="font-medium">Notes:</span> {order.notes}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm text-slate-500">Total amount</span>
          <span className="text-lg font-bold text-slate-900">{formatCurrency(Number(order.total_amount))}</span>
        </div>
      </Card>

      {/* Payment */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Payment</h2>
              {payment ? (
                <p className="text-sm text-slate-500">Transaction: {payment.transaction_id}</p>
              ) : (
                <p className="text-sm text-slate-500">Pay with mock card</p>
              )}
            </div>
          </div>
          {payment ? (
            <Badge color={statusColors[payment.status]}>{payment.status}</Badge>
          ) : (
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <Input
                label="Payment number"
                value={paymentRef}
                onChange={setPaymentRef}
                placeholder="Enter your payment reference"
                required
              />
              <Button onClick={handlePay} disabled={paying || !paymentRef.trim()} variant="success">
                {paying ? 'Processing…' : `Pay ${formatCurrency(Number(order.total_amount))}`}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* File upload */}
      <Card className="p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Files & Uploads</h2>
        <label className="block">
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all">
            <Upload className="h-8 w-8 text-slate-400" />
            <span className="mt-2 text-sm font-medium text-slate-700">
              {uploading ? 'Uploading…' : 'Click to upload files'}
            </span>
            <span className="text-xs text-slate-400">Images, PDFs, design files</span>
          </div>
          <input type="file" multiple onChange={handleUpload} className="hidden" />
        </label>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{f.file_name}</div>
                    <div className="text-xs text-slate-400">
                      {(f.file_size / 1024).toFixed(1)} KB · {formatDateTime(f.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={supabase.storage.from('order-files').getPublicUrl(f.file_path).data.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-slate-500 hover:text-slate-900"
                  >
                    View
                  </a>
                  <button onClick={() => handleDeleteFile(f)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
