import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Camera, Video, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Service, Profile } from '../lib/supabase';
import { Card, Button, Input, Textarea, Select, Spinner, Badge, formatCurrency } from '../components/ui';

const categoryIcons: Record<string, React.ReactNode> = {
  photography: <Camera className="h-5 w-5" />,
  videography: <Video className="h-5 w-5" />,
  printing: <Camera className="h-5 w-5" />,
  branding: <Camera className="h-5 w-5" />,
};

export default function BookService() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [photographers, setPhotographers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [selectedService, setSelectedService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [photographer, setPhotographer] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [{ data: svcs, error: svcError }, { data: ph, error: phError }] = await Promise.all([
          supabase.from('services').select('*').neq('is_active', false).order('name'),
          supabase.from('profiles').select('*').eq('role', 'photographer'),
        ]);

        if (svcError) {
          setError(svcError.message);
          console.error('Service load error:', svcError.message);
        }
        if (phError) {
          console.error('Photographer load error:', phError.message);
        }

        setServices(svcs ?? []);
        setPhotographers(ph ?? []);
      } catch (loadError) {
        setError('Unable to load services. Please try again later.');
        console.error(loadError);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedSvc = services.find((s) => s.id === selectedService);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedSvc) return;
    setError('');
    setSubmitting(true);
    const { data, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: profile.id,
        service_id: selectedSvc.id,
        service_name: selectedSvc.name,
        booking_date: date,
        booking_time: time,
        location,
        notes,
        total_amount: selectedSvc.price,
        assigned_photographer: photographer || null,
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
      title: 'Booking created',
      message: `Your booking for ${selectedSvc.name} on ${date} has been created.`,
      type: 'booking',
      meta: { booking_id: data.id },
    });
    setSuccess(true);
    setTimeout(() => navigate('/app'), 1500);
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to load services</h2>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-slate-700" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No bookable services available</h2>
        <p className="mt-1 text-sm text-slate-500">We couldn't find any active services right now. Check back soon or contact support.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Booking confirmed!</h2>
        <p className="mt-1 text-sm text-slate-500">We'll notify you once a photographer is assigned.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book a Service</h1>
        <p className="text-sm text-slate-500 mt-1">Schedule a photography or videography session</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Service selection */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Choose a service</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedService(s.id)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                selectedService === s.id
                  ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    {categoryIcons[s.category] ?? <Camera className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                    <Badge color="slate">{s.category}</Badge>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(s.price)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{s.description}</p>
            </button>
          ))}
        </div>
      </div>

      {selectedSvc && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-semibold text-slate-900">Booking details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Date" type="date" value={date} onChange={setDate} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Downtown Studio, 123 Main St"
                  required
                  className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
                />
              </div>
            </div>
            <Select
              label="Preferred photographer (optional)"
              value={photographer}
              onChange={setPhotographer}
              placeholder="Auto-assign"
              options={photographers.map((p) => ({ value: p.id, label: p.full_name }))}
            />
            <Textarea label="Notes" value={notes} onChange={setNotes} placeholder="Any special requests or details about the shoot…" rows={3} />

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4" />
                <span>Total: <strong className="text-slate-900">{formatCurrency(selectedSvc.price)}</strong></span>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Booking…' : 'Confirm booking'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
