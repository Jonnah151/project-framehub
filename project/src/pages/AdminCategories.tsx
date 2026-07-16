import { useEffect, useState } from 'react';
import { Layers3, Plus, Trash2, PencilLine } from 'lucide-react';
import { supabase, type Category } from '../lib/supabase';
import { Card, Button, Input, Textarea, Spinner, EmptyState } from '../components/ui';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), description: description.trim(), is_active: true, updated_at: new Date().toISOString() };
    if (editingId) {
      await supabase.from('categories').update(payload).eq('id', editingId);
    } else {
      await supabase.from('categories').insert({ ...payload, created_at: new Date().toISOString() });
    }
    setName('');
    setDescription('');
    setEditingId(null);
    await load();
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description);
  };

  const handleDelete = async (categoryId: string) => {
    await supabase.from('categories').delete().eq('id', categoryId);
    await load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <p className="text-sm text-slate-500 mt-1">Create and manage service categories</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers3 className="h-5 w-5 text-slate-700" />
          <h2 className="font-semibold text-slate-900">{editingId ? 'Edit category' : 'Add category'}</h2>
        </div>
        <div className="space-y-3">
          <Input label="Name" value={name} onChange={setName} placeholder="e.g. Printing" />
          <Textarea label="Description" value={description} onChange={setDescription} placeholder="Describe the category" rows={3} />
          <div className="flex gap-2">
            <Button onClick={handleSave}><Plus className="h-4 w-4 mr-1" /> {editingId ? 'Save changes' : 'Add category'}</Button>
            {editingId && <Button variant="secondary" onClick={() => { setEditingId(null); setName(''); setDescription(''); }}>Cancel</Button>}
          </div>
        </div>
      </Card>

      {categories.length === 0 ? (
        <Card><EmptyState title="No categories yet" message="Add your first category to organize services" icon={<Layers3 className="h-10 w-10" />} /></Card>
      ) : (
        <div className="grid gap-3">
          {categories.map((category) => (
            <Card key={category.id} className="p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{category.name}</h3>
                <p className="text-sm text-slate-500">{category.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleEdit(category)}><PencilLine className="h-4 w-4 mr-1" /> Edit</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(category.id)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
