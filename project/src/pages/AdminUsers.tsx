import { useEffect, useState } from 'react';
import { Users, Search, Mail, Phone, Shield, PencilLine, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase, type Profile, type UserRole } from '../lib/supabase';
import { Card, Badge, Spinner, EmptyState, Button, Input } from '../components/ui';

const roleColors: Record<UserRole, 'slate' | 'blue' | 'green' | 'amber' | 'purple'> = {
  customer: 'slate',
  admin: 'purple',
  designer: 'blue',
  photographer: 'green',
  delivery: 'amber',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        setUsers([]);
      } else {
        setUsers((data as Profile[] | null) ?? []);
      }
    } catch (err) {
      setError('Failed to load users.');
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const roleCounts: Record<string, number> = {};
  users.forEach((u) => { roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1; });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all platform users</p>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(['all', 'customer', 'admin', 'designer', 'photographer', 'delivery'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`rounded-xl border p-3 text-left transition-all ${
              roleFilter === r ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-2xl font-bold text-slate-900">
              {r === 'all' ? users.length : roleCounts[r] ?? 0}
            </div>
            <div className="text-xs text-slate-500 capitalize">{r === 'all' ? 'All users' : r}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all"
          />
        </div>

      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="No users found" message="Try adjusting your filters" icon={<Users className="h-10 w-10" />} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    {u.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{u.full_name}</div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</span>
                      {u.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{u.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={roleColors[u.role]}>
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3" />{u.role}</span>
                  </Badge>
                  <button onClick={() => setEditingUser(u)} className="text-slate-400 hover:text-slate-900"><PencilLine className="h-4 w-4" /></button>
                  <button
                    onClick={async () => {
                      const { error: toggleError } = await supabase.from('profiles').update({ is_active: !u.is_active, updated_at: new Date().toISOString() }).eq('id', u.id);
                      if (toggleError) setError(toggleError.message);
                      else loadUsers();
                    }}
                    className="text-slate-400 hover:text-slate-900"
                    title={u.is_active !== false ? 'Deactivate user' : 'Activate user'}
                  >
                    {u.is_active !== false ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button onClick={async () => { const { error: delError } = await supabase.from('profiles').delete().eq('id', u.id); if (delError) setError(delError.message); else loadUsers(); }} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {editingUser && (
        <UserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={async () => { setEditingUser(null); await loadUsers(); }}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSaved }: { user: Profile | null; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'customer');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const payload = { full_name: fullName, email, phone, role, updated_at: new Date().toISOString() };
    const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', user?.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{user ? 'Edit user' : 'Add user'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">✕</button>
        </div>
        <div className="space-y-4">
          <Input label="Full name" value={fullName} onChange={setFullName} />
          <Input label="Email" value={email} onChange={setEmail} />
          <Input label="Phone" value={phone} onChange={setPhone} />
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 bg-white">
              {(['customer', 'admin', 'designer', 'photographer', 'delivery'] as UserRole[]).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !fullName || !email}>Save</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
