import { useEffect, useState } from 'react';
import { BarChart3, Trophy, MessageSquare, TrendingUp, Award, Target, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Page } from '../components/Navbar';

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
}

interface QuizResult {
  id: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [chatCount, setChatCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: quizData }, { count }] = await Promise.all([
        supabase
          .from('quiz_results')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false }),
        supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      setResults(quizData ?? []);
      setChatCount(count ?? 0);
      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="card p-8 sm:p-12 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-tz-yellow/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-tz-yellow" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-3">Dashibodi Inahitaji Akaunti</h1>
          <p className="text-gray-400 mb-6">
            Ili kuona maendeleo yako, unahitaji kuingia kwenye akaunti yako.
          </p>
          <button
            onClick={() => onNavigate('ingia')}
            className="btn-primary bg-tz-green text-white hover:bg-tz-green-dark inline-flex items-center gap-2"
          >
            Ingia
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-tz-green border-t-transparent rounded-full animate-spin" />
          Inapakia...
        </div>
      </div>
    );
  }

  const bestScore = results.length > 0 ? Math.max(...results.map((r) => r.percentage)) : 0;
  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
      : 0;
  const totalQuizzes = results.length;

  const stats = [
    {
      icon: Trophy,
      label: 'Alama Bora',
      value: `${bestScore}%`,
      color: 'from-tz-green to-tz-green-dark',
    },
    {
      icon: TrendingUp,
      label: 'Wastani',
      value: `${avgScore}%`,
      color: 'from-tz-yellow to-tz-yellow-dark',
    },
    {
      icon: Target,
      label: 'Majaribio',
      value: `${totalQuizzes}`,
      color: 'from-tz-blue to-tz-blue-dark',
    },
    {
      icon: MessageSquare,
      label: 'Ujumbe',
      value: `${chatCount}`,
      color: 'from-tz-green-dark to-tz-blue-dark',
    },
  ];

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-tz-blue to-tz-blue-dark flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Dashibodi yangu</h1>
              <p className="text-sm text-gray-400">Fuatilia maendeleo yako ya kujifunza</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="card p-5 animate-slide-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progress chart */}
        <div className="card p-6 mb-8">
          <h2 className="font-display text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-tz-yellow" />
            Maendeleo ya Majaribio
          </h2>
          {results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">Bado hujafanya jaribio lolote</p>
              <button
                onClick={() => onNavigate('jaribio')}
                className="btn-primary bg-tz-green text-white hover:bg-tz-green-dark inline-flex items-center gap-2"
              >
                Anza Jaribio la Kwanza
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {results.slice(0, 10).map((result, idx) => (
                <div key={result.id} className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="text-sm text-gray-400 w-8 shrink-0">#{results.length - idx}</div>
                  <div className="flex-1">
                    <div className="h-8 rounded-lg bg-white/5 overflow-hidden relative">
                      <div
                        className={`h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3 ${
                          result.percentage >= 75
                            ? 'bg-gradient-to-r from-tz-green to-tz-green-light'
                            : result.percentage >= 50
                            ? 'bg-gradient-to-r from-tz-yellow to-tz-yellow-light'
                            : 'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ width: `${result.percentage}%` }}
                      >
                        <span className="text-xs font-semibold text-tz-black">{result.percentage}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 shrink-0 hidden sm:block">
                    {result.score}/{result.total_questions}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievement badges */}
        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-tz-yellow" />
            Medali Zilizopatikana
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Mwanzo', desc: 'Jaribio la kwanza', unlocked: totalQuizzes >= 1, icon: Target },
              { label: 'Mtaalamu', desc: 'Alama 75%+', unlocked: bestScore >= 75, icon: Trophy },
              { label: 'Mzungumzaji', desc: 'Ujumbe 10+', unlocked: chatCount >= 10, icon: MessageSquare },
              { label: 'Bingwa', desc: 'Alama 100%', unlocked: bestScore === 100, icon: Award },
            ].map((badge) => (
              <div
                key={badge.label}
                className={`p-4 rounded-xl text-center border transition-all ${
                  badge.unlocked
                    ? 'bg-tz-green/10 border-tz-green/30'
                    : 'bg-white/5 border-white/10 opacity-40'
                }`}
              >
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  badge.unlocked ? 'bg-tz-green/20' : 'bg-white/5'
                }`}>
                  <badge.icon className={`w-6 h-6 ${badge.unlocked ? 'text-tz-green' : 'text-gray-500'}`} />
                </div>
                <div className="text-sm font-semibold text-white">{badge.label}</div>
                <div className="text-xs text-gray-400 mt-1">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
