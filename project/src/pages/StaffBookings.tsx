import { useEffect, useState, useCallback } from 'react';
import { Calendar, MapPin, Clock, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Booking, BookingStatus } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, Select, statusColors, formatDate } from '../components/ui';

const statusOptions: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

export default function StaffBookings() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('assigned_photographer', profile.id)
      .order('booking_date', { ascending: true });
    setBookings(data ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const filtered = bookings.filter((b) =>
    !search || b.service_name.toLowerCase().includes(search.toLowerCase()) || b.location.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">Photography and videography bookings assigned to you</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by service or location…"
          className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState title="No bookings assigned" message="Bookings assigned to you will appear here" icon={<Calendar className="h-10 w-10" />} /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{b.service_name}</div>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(b.booking_date)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.booking_time}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.location}</span>
                    </div>
                    {b.notes && <p className="mt-1 text-xs text-slate-500 line-clamp-1">{b.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={statusColors[b.status]}>{b.status}</Badge>
                  <Select
                    value={b.status}
                    onChange={(v) => updateStatus(b.id, v as BookingStatus)}
                    options={statusOptions.map((s) => ({ value: s, label: s }))}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
