import { useEffect, useState } from 'react';
import { UserCircle2, Lock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, Button, Input } from '../components/ui';

export default function AdminProfile() {
  const { profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone, updated_at: new Date().toISOString() }).eq('id', profile.id);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Profile updated successfully.');
    }
  };

  const handleChangePassword = async () => {
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully.');
      setPassword('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile details and change password</p>
      </div>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle2 className="h-5 w-5 text-slate-700" />
          <h2 className="font-semibold text-slate-900">Profile info</h2>
        </div>
        <div className="space-y-3">
          <Input label="Full name" value={fullName} onChange={setFullName} />
          <Input label="Phone" value={phone} onChange={setPhone} />
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile}><Save className="h-4 w-4 mr-1.5" /> Save profile</Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-slate-700" />
          <h2 className="font-semibold text-slate-900">Change password</h2>
        </div>
        <div className="space-y-3">
          <Input label="New password" type="password" value={password} onChange={setPassword} placeholder="Enter new password" />
          <div className="flex justify-end">
            <Button onClick={handleChangePassword}>Update password</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
