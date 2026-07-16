import { useEffect, useMemo, useState } from 'react';
import { FileText, Search, CheckCircle2, XCircle, Trash2, Eye } from 'lucide-react';
import { supabase, type BusinessPlan, type Category, type BusinessPlanStatus } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, Button, Input, Textarea, Select } from '../components/ui';

const statusOptions: Array<{ value: BusinessPlanStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminPlans() {
  const [plans, setPlans] = useState<(BusinessPlan & { customer?: string })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BusinessPlanStatus | 'all'>('all');
  const [selectedPlan, setSelectedPlan] = useState<(BusinessPlan & { customer?: string }) | null>(null);

  const load = async () => {
    const [{ data: plansData }, { data: categoriesData }] = await Promise.all([
      supabase.from('business_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);

    const userIds = [...new Set((plansData ?? []).map((p) => p.user_id))];
    const { data: profilesData } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
    const profileMap: Record<string, string> = {};
    (profilesData ?? []).forEach((profile: { id: string; full_name: string }) => {
      profileMap[profile.id] = profile.full_name;
    });

    const categoryMap: Record<string, string> = {};
    (categoriesData ?? []).forEach((category: Category) => {
      categoryMap[category.id] = category.name;
    });

    setCategories(categoriesData ?? []);
    setPlans((plansData ?? []).map((plan) => ({
      ...plan,
      customer: profileMap[plan.user_id] ?? 'Unknown',
      category_name: categoryMap[plan.category_id ?? ''] ?? 'Uncategorized',
    })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredPlans = useMemo(() => plans.filter((plan) => {
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    const matchesSearch = !search || [plan.title, plan.summary, plan.customer ?? ''].join(' ').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  }), [plans, search, statusFilter]);

  const updateStatus = async (planId: string, status: BusinessPlanStatus) => {
    await supabase.from('business_plans').update({ status, updated_at: new Date().toISOString() }).eq('id', planId);
    await load();
  };

  const deletePlan = async (planId: string) => {
    await supabase.from('business_plans').delete().eq('id', planId);
    await load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Plans</h1>
          <p className="text-sm text-slate-500 mt-1">Review, approve, and manage submitted plans</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans or submitter…"
            className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BusinessPlanStatus | 'all')}
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 bg-white focus:border-slate-900 focus:outline-none"
        >
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      {filteredPlans.length === 0 ? (
        <Card><EmptyState title="No plans found" message="Try changing the filters" icon={<FileText className="h-10 w-10" />} /></Card>
      ) : (
        <div className="space-y-3">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{plan.title}</h3>
                    <Badge color={plan.status === 'approved' ? 'green' : plan.status === 'rejected' ? 'red' : 'amber'}>{plan.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{plan.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>Submitted by {plan.customer}</span>
                    <span>Category: {plan.category_name}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedPlan(plan)}><Eye className="h-4 w-4 mr-1" /> View</Button>
                  <Button variant="success" size="sm" onClick={() => updateStatus(plan.id, 'approved')}><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                  <Button variant="danger" size="sm" onClick={() => updateStatus(plan.id, 'rejected')}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                  <Button variant="secondary" size="sm" onClick={() => deletePlan(plan.id)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedPlan && (
        <PlanDetailModal plan={selectedPlan} categories={categories} onClose={() => setSelectedPlan(null)} onUpdated={load} />
      )}
    </div>
  );
}

function PlanDetailModal({ plan, categories, onClose, onUpdated }: { plan: (BusinessPlan & { customer?: string }); categories: Category[]; onClose: () => void; onUpdated: () => void }) {
  const [title, setTitle] = useState(plan.title);
  const [summary, setSummary] = useState(plan.summary);
  const [notes, setNotes] = useState(plan.notes ?? '');
  const [categoryId, setCategoryId] = useState(plan.category_id ?? '');
  const [status, setStatus] = useState<BusinessPlanStatus>(plan.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('business_plans').update({ title, summary, notes, category_id: categoryId || null, status, updated_at: new Date().toISOString() }).eq('id', plan.id);
    setSaving(false);
    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Plan details</h2>
            <p className="text-sm text-slate-500">Manage submission details and review notes</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">✕</button>
        </div>
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={setTitle} />
          <Textarea label="Summary" value={summary} onChange={setSummary} rows={4} />
          <Select label="Category" value={categoryId} onChange={setCategoryId} options={categories.map((category) => ({ value: category.id, label: category.name }))} />
          <Select label="Status" value={status} onChange={(value) => setStatus(value as BusinessPlanStatus)} options={statusOptions.filter((option) => option.value !== 'all').map((option) => ({ value: option.value, label: option.label }))} />
          <Textarea label="Admin notes" value={notes} onChange={setNotes} rows={3} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
