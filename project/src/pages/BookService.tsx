import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, Camera, Truck, BadgeCheck, PackageCheck, Upload, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../components/ui';

const frameSizes = [
  { value: 'A5', label: 'A5 - Tsh 8,000', price: 8000 },
  { value: 'A4', label: 'A4 - Tsh 10,000', price: 10000 },
  { value: 'A3', label: 'A3 - Tsh 20,000', price: 20000 },
  { value: 'A2', label: 'A2 - Tsh 60,000', price: 60000 },
  { value: 'A1', label: 'A1 - Tsh 100,000', price: 100000 },
];

const frameDesigns = [
  'Classic Black',
  'Classic White',
  'Golden Frame',
  'Brown Wooden Frame',
  'Modern Luxury Frame',
];

const deliveryOptions = ['Motorcycle Delivery', 'Bus Parcel', 'Courier Service', 'Customer Pickup'];

export default function BookService() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [frameSize, setFrameSize] = useState('A4');
  const [frameDesign, setFrameDesign] = useState('Brown Wooden Frame');
  const [deliveryOption, setDeliveryOption] = useState('Motorcycle Delivery');
  const [instructions, setInstructions] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const selectedSize = frameSizes.find((size) => size.value === frameSize);
  const totalAmount = selectedSize?.price ?? 0;

  const handleFileSelection = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
  };

  const uploadOrderFiles = async (orderId: string) => {
    if (!profile || !selectedFiles.length) return;
    setUploadingFiles(true);
    try {
      for (const file of selectedFiles) {
        const safeName = file.name.replace(/\s+/g, '-');
        const filePath = `${profile.id}/${orderId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('order-files').upload(filePath, file);
        if (uploadError) {
          throw uploadError;
        }
        await supabase.from('order_files').insert({
          order_id: orderId,
          user_id: profile.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
        });
      }
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setError('Please complete your full name, phone number, and delivery address.');
      return;
    }

    setError('');
    setSubmitting(true);

    const bookingDate = new Date().toISOString().slice(0, 10);
    const bookingTime = new Date().toTimeString().slice(0, 5);
    const description = [
      `Customer: ${fullName}`,
      `Phone: ${phone}`,
      `Address: ${address}`,
      `Frame size: ${selectedSize?.label ?? frameSize}`,
      `Design: ${frameDesign}`,
      `Delivery: ${deliveryOption}`,
      `Files: ${selectedFiles.length ? selectedFiles.map((file) => file.name).join(', ') : 'No files selected'}`,
    ].join(' | ');

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: profile.id,
        title: 'Wooden Frame Order',
        description,
        notes: instructions || 'No additional instructions.',
        total_amount: totalAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      setSubmitting(false);
      setError(orderError.message);
      return;
    }

    const paymentInsert = supabase.from('payments').insert({
      user_id: profile.id,
      reference_type: 'order',
      reference_id: orderData.id,
      amount: totalAmount,
      status: 'pending',
      method: 'mobile_money',
      transaction_id: 'Awaiting admin approval',
    });

    const bookingInsert = supabase.from('bookings').insert({
      user_id: profile.id,
      service_id: null,
      service_name: 'Wooden Frame Order',
      booking_date: bookingDate,
      booking_time: bookingTime,
      location: address,
      notes: instructions || description,
      total_amount: totalAmount,
      assigned_photographer: null,
      status: 'pending',
    });

    const notificationsInsert = supabase.from('notifications').insert({
      user_id: profile.id,
      title: 'Order submitted for approval',
      message: `Your wooden frame order has been submitted and is awaiting admin approval.`,
      type: 'order',
      meta: { order_id: orderData.id },
    });

    const [{ error: paymentError }, { error: bookingError }, { error: notificationError }] = await Promise.all([paymentInsert, bookingInsert, notificationsInsert]);

    if (paymentError || bookingError || notificationError) {
      setSubmitting(false);
      setError(paymentError?.message ?? bookingError?.message ?? notificationError?.message ?? 'Submission failed.');
      return;
    }

    try {
      await uploadOrderFiles(orderData.id);
    } catch (uploadError) {
      console.error(uploadError);
    }

    try {
      const { data: adminsData, error: adminsError } = await supabase.from('profiles').select('id').eq('role', 'admin');
      if (!adminsError && adminsData?.length) {
        await Promise.all(adminsData.map((admin) => supabase.from('notifications').insert({
          user_id: admin.id,
          title: 'New order needs approval',
          message: `A new wooden frame order from ${fullName} is waiting for approval.`,
          type: 'order',
          meta: { order_id: orderData.id },
        })));
      }
    } catch {
      // Best-effort admin notification. The order itself is already saved.
    }

    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => navigate(`/app/orders/${orderData.id}`), 1200);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Order submitted!</h2>
        <p className="mt-1 text-sm text-slate-500">Your wooden frame order is now waiting for admin approval.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-6">
      <Link to="/app" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-8 lg:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <PackageCheck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-blue-700">WOODEN FRAME ORDER</h1>
          <p className="mt-2 text-sm text-slate-600">Premium wooden framing service for your favorite photo, crafted and delivered with care.</p>
        </div>

        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800">Service provided</p>
              <p className="text-lg font-bold text-slate-900">Wooden frame crafting and delivery</p>
              <p className="text-sm text-slate-600">We help you turn your photo into a beautiful wooden frame order with delivery support.</p>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900">
              From {formatCurrency(8000)}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Full Name</span>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Phone Number</span>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Delivery Address</span>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>

          <hr className="border-slate-200" />

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-blue-600">Upload Your Photo</h2>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/40">
              <Upload className="mb-2 h-5 w-5 text-blue-600" />
              <span>{selectedFiles.length ? `${selectedFiles.length} file(s) selected` : 'Choose photo or receipt files to upload'}</span>
              <input type="file" multiple onChange={handleFileSelection} className="hidden" />
            </label>
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {selectedFiles.map((file) => (
                  <div key={file.name} className="flex items-center gap-2 text-sm text-slate-700">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <hr className="border-slate-200" />

          <section>
            <h2 className="mb-3 text-xl font-bold text-blue-600">Choose Frame Size</h2>
            <select value={frameSize} onChange={(e) => setFrameSize(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
              {frameSizes.map((size) => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </section>

          <hr className="border-slate-200" />

          <section>
            <h2 className="mb-3 text-xl font-bold text-blue-600">Choose Frame Design</h2>
            <select value={frameDesign} onChange={(e) => setFrameDesign(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
              {frameDesigns.map((design) => (
                <option key={design} value={design}>{design}</option>
              ))}
            </select>
          </section>

          <hr className="border-slate-200" />

          <section>
            <h2 className="mb-5 text-xl font-bold text-blue-600">Payment Details</h2>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="mb-3 font-bold text-emerald-700">Mobile Money</h3>
              <p className="text-sm font-semibold text-slate-700">LIPA NUMBER (Vodacom)</p>
              <p className="text-sm">354112841</p>
              <p className="mt-2 text-sm">Name: <span className="font-semibold text-slate-900">SAMSON YOHANA MAGAWA</span></p>
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-700">M-PESA ACCOUNT</p>
                <p className="text-sm">0793914556</p>
                <p className="mt-2 text-sm">Name: <span className="font-semibold text-slate-900">SAMSON YOHANA MAGAWA</span></p>
              </div>
              <div className="mt-4">
                <h3 className="font-bold text-blue-700">CRDB BANK</h3>
                <p className="text-sm">Account Number:</p>
                <p className="text-sm font-semibold text-slate-900">0152932474800</p>
                <p className="mt-2 text-sm">Name:</p>
                <p className="text-sm font-semibold text-slate-900">SAMSON YOHANA MAGAWA</p>
              </div>
            </div>
          </section>

          <hr className="border-slate-200" />

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-blue-600">Delivery Option</h2>
            </div>
            <select value={deliveryOption} onChange={(e) => setDeliveryOption(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
              {deliveryOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <div className="mt-5">
              <label className="block text-sm font-semibold text-slate-700">Additional Instructions</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} placeholder="Write your instructions here..." className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
          </section>

          <hr className="border-slate-200" />

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-bold text-blue-700">After Payment</h2>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              After confirming your payment, one of our staff members will contact you to confirm your order, discuss the design if necessary, and arrange delivery of your completed wooden frame.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Estimated service total</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalAmount)}</p>
            </div>
            <button type="submit" disabled={submitting || uploadingFiles} className="rounded-xl bg-blue-700 px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Submitting order…' : uploadingFiles ? 'Uploading files…' : 'Submit Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
