import { useEffect, useState, useCallback } from 'react';
import { Settings, Plus, Trash2, Edit3, X, Check } from 'lucide-react';
import { supabase, Service } from '../lib/supabase';
import { Card, Button, Input, Textarea, Badge, Spinner, EmptyState, formatCurrency } from '../components/ui';

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('services').select('*').order('category').order('name');
    setServices(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (s: Service) => {
    await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
    load();
  };

  const deleteService = async (s: Service) => {
    await supabase.from('services').delete().eq('id', s.id);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services</h1>
          <p className="text-sm text-slate-500 mt-1">Manage the services catalog</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1.5" /> New service</Button>
      </div>

      {services.length === 0 ? (
        <Card><EmptyState title="No services" message="Create your first service" icon={<Settings className="h-10 w-10" />} /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <Badge color="slate">{s.category}</Badge>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900 truncate">{s.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{s.description}</p>
                </div>
                <span className="text-sm font-bold text-slate-900 shrink-0 ml-2">{formatCurrency(s.price)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  onClick={() => toggleActive(s)}
                  className={`text-xs font-medium ${s.is_active ? 'text-emerald-600' : 'text-slate-400'}`}
                >
                  {s.is_active ? 'Active' : 'Inactive'}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(s)} className="text-slate-400 hover:text-slate-900"><Edit3 className="h-4 w-4" /></button>
                  <button onClick={() => deleteService(s)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <ServiceModal
          service={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function ServiceModal({ service, onClose, onSaved }: { service: Service | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(service?.name ?? '');
  const [category, setCategory] = useState(service?.category ?? 'printing');
  const [description, setDescription] = useState(service?.description ?? '');
  const [price, setPrice] = useState(service ? String(service.price) : '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name,
      category,
      description,
      price: parseFloat(price) || 0,
      is_active: true,
    };
    if (service) {
      await supabase.from('services').update(payload).eq('id', service.id);
    } else {
      await supabase.from('services').insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <Card className="w-full max-w-lg p-6" >
        <div className="flex items-center justify-between mb-4" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-bold text-slate-900">{service ? 'Edit service' : 'New service'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
          <Input label="Name" value={name} onChange={setName} placeholder="e.g. Business Card Printing" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-none"
            >
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="printing">Printing</option>
              <option value="branding">Branding</option>
            </select>
          </div>
          <Textarea label="Description" value={description} onChange={setDescription} rows={2} />
          <Input label="Price (TZS)" type="number" value={price} onChange={setPrice} placeholder="0" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name || !price}>
              <Check className="h-4 w-4 mr-1.5" />{saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
