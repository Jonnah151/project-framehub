import { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { Page } from '../components/Navbar';

interface AuthPageProps {
  onNavigate: (page: Page) => void;
}

export function AuthPage({ onNavigate }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onNavigate('dashibodi');
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="card p-8 animate-slide-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-tz-green via-tz-yellow to-tz-blue flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="font-display font-bold text-white text-2xl">M</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              {mode === 'signin' ? 'Karibu Tena!' : 'Jiunge Nasi'}
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              {mode === 'signin'
                ? 'Ingia kwenye akaunti yako kuendelea'
                : 'Tengeneza akaunti mpya ya MuunganoAI'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 rounded-xl bg-white/5 mb-6">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'signin'
                  ? 'bg-tz-green text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Ingia
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'signup'
                  ? 'bg-tz-green text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Jiunge
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Barua pepe</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="mfano@baruapepe.com"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nenosiri</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Angalau herudi 6"
                  className="input-field pl-11"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary bg-tz-green text-white hover:bg-tz-green-dark disabled:opacity-50 disabled:cursor-not-allowed w-full shadow-lg shadow-tz-green/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Subiri...
                </>
              ) : (
                <>
                  {mode === 'signin' ? 'Ingia' : 'Tengeneza Akaunti'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'signin' ? 'Huna akaunti? ' : 'Una akaunti tayari? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
              className="text-tz-green hover:text-tz-green-light font-medium"
            >
              {mode === 'signin' ? 'Jiunge sasa' : 'Ingia'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
