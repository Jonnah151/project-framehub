import { useEffect, useState, useCallback } from 'react';
import { Calendar, MapPin, Clock, User, Search } from 'lucide-react';
import { supabase, Booking, Profile, BookingStatus } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, Select, statusColors, formatDate } from '../components/ui';

const statusOptions: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

export default function AdminBookings() {
  const [bookings, setBookings] = useState<(Booking & { customer?: string; photographer_name?: string })[]>([]);
  const [photographers, setPhotographers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const { data: bks } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    const userIds = [...new Set((bks ?? []).map((b) => b.user_id))];
    const phIds = [...new Set((bks ?? []).map((b) => b.assigned_photographer).filter(Boolean))] as string[];
    const [{ data: profiles }, { data: phs }, { data: allPh }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', userIds),
      supabase.from('profiles').select('id, full_name').in('id', phIds),
      supabase.from('profiles').select('*').eq('role', 'photographer'),
    ]);
    const map: Record<string, string> = {};
    (profiles as Profile[] | null)?.forEach((p) => { map[p.id] = p.full_name; });
    const phMap: Record<string, string> = {};
    (phs as Profile[] | null)?.forEach((p) => { phMap[p.id] = p.full_name; });
    setBookings((bks ?? []).map((b) => ({ ...b, customer: map[b.user_id] ?? 'Unknown', photographer_name: b.assigned_photographer ? phMap[b.assigned_photographer] : undefined })));
    setPhotographers(allPh as Profile[] ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.service_name.toLowerCase().includes(q) || (b.customer ?? '').toLowerCase().includes(q) || b.location.toLowerCase().includes(q);
  });

  const updateBooking = async (id: string, field: 'status' | 'assigned_photographer', value: string) => {
    const update: Record<string, unknown> = { [field]: value || null };
    if (field === 'assigned_photographer' && value) update.status = 'confirmed';
    await supabase.from('bookings').update(update).eq('id', id);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage photography and videography bookings</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by service, customer, or location…"
          className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState title="No bookings found" message="No bookings match your search" icon={<Calendar className="h-10 w-10" />} /></Card>
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
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{b.customer}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(b.booking_date)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.booking_time}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.location}</span>
                    </div>
                  </div>
                </div>
                <Badge color={statusColors[b.status]}>{b.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <Select
                  label="Photographer"
                  value={b.assigned_photographer ?? ''}
                  onChange={(v) => updateBooking(b.id, 'assigned_photographer', v)}
                  placeholder="Auto-assign"
                  options={photographers.map((p) => ({ value: p.id, label: p.full_name }))}
                />
                <Select
                  label="Status"
                  value={b.status}
                  onChange={(v) => updateBooking(b.id, 'status', v)}
                  options={statusOptions.map((s) => ({ value: s, label: s }))}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
