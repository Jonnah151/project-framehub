import { useState } from 'react';
import { Brain, CheckCircle2, XCircle, Trophy, RotateCcw, ArrowRight, Lock, BarChart3 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { quizQuestions } from '../data/quiz';
import type { Page } from '../components/Navbar';

interface QuizPageProps {
  onNavigate: (page: Page) => void;
}

type Stage = 'intro' | 'playing' | 'result';

export function QuizPage({ onNavigate }: QuizPageProps) {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleStart = () => {
    setStage('playing');
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setShowExplanation(false);
  };

  const handleSelect = (idx: number) => {
    if (showExplanation) return;
    setSelected(idx);
    setShowExplanation(true);
    setAnswers((prev) => [...prev, idx]);
  };

  const handleNext = async () => {
    if (currentQ + 1 < quizQuestions.length) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      const score = answers.filter((a, i) => a === quizQuestions[i].correctIndex).length;
      const percentage = Math.round((score / quizQuestions.length) * 100);

      if (user) {
        await supabase.from('quiz_results').insert({
          user_id: user.id,
          score,
          total_questions: quizQuestions.length,
          percentage,
        });
      }

      setStage('result');
    }
  };

  const score = answers.filter((a, i) => a === quizQuestions[i].correctIndex).length;
  const percentage = Math.round((score / quizQuestions.length) * 100);

  // Intro
  if (stage === 'intro') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="card p-8 sm:p-12 text-center animate-slide-up">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-tz-yellow to-tz-yellow-dark flex items-center justify-center mx-auto mb-6 shadow-xl shadow-tz-yellow/20">
              <Brain className="w-10 h-10 text-tz-black" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Jaribio la Muungano
            </h1>
            <p className="text-gray-300 mb-2">
              Jaribu maarifa yako kuhusu Muungano wa Tanganyika na Zanzibar.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Maswali {quizQuestions.length} · Kila swali lina maelezo ya jibu
            </p>

            {!user && (
              <div className="flex items-center gap-2 justify-center mb-6 text-sm text-tz-yellow">
                <Lock className="w-4 h-4" />
                <span>Ili matokeo yako yahifadhiwe, tafadhali </span>
                <button onClick={() => onNavigate('ingia')} className="text-tz-green underline hover:text-tz-green-light">
                  ingia kwenye akaunti yako
                </button>
              </div>
            )}

            <button
              onClick={handleStart}
              className="btn-primary bg-tz-green text-white hover:bg-tz-green-dark shadow-xl shadow-tz-green/20 inline-flex items-center gap-2"
            >
              Anza Jaribio
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing
  if (stage === 'playing') {
    const question = quizQuestions[currentQ];
    const progress = ((currentQ + 1) / quizQuestions.length) * 100;

    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Swali {currentQ + 1} kati ya {quizQuestions.length}
              </span>
              <span className="text-sm font-medium text-tz-green">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-tz-green to-tz-yellow transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="card p-6 sm:p-8 animate-fade-in">
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-white mb-6">
              {question.question}
            </h2>

            <div className="space-y-3">
              {question.options.map((option, idx) => {
                const isCorrect = idx === question.correctIndex;
                const isSelected = idx === selected;
                let style = 'bg-white/5 border-white/10 text-gray-200 hover:border-tz-green/40 hover:bg-white/10';

                if (showExplanation) {
                  if (isCorrect) {
                    style = 'bg-tz-green/15 border-tz-green text-white';
                  } else if (isSelected) {
                    style = 'bg-red-500/15 border-red-500 text-white';
                  } else {
                    style = 'bg-white/5 border-white/10 text-gray-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={showExplanation}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between ${style} ${
                      !showExplanation ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span className="text-sm sm:text-base">{option}</span>
                    {showExplanation && isCorrect && <CheckCircle2 className="w-5 h-5 text-tz-green shrink-0" />}
                    {showExplanation && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="mt-6 p-4 rounded-xl bg-tz-blue/10 border border-tz-blue/20 animate-slide-up">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-tz-blue/20 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-tz-blue-light" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-tz-blue-light mb-1">Maelezo</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{question.explanation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next button */}
            {showExplanation && (
              <button
                onClick={handleNext}
                className="mt-6 btn-primary bg-tz-green text-white hover:bg-tz-green-dark w-full flex items-center justify-center gap-2 animate-fade-in"
              >
                {currentQ + 1 < quizQuestions.length ? (
                  <>
                    Swali Linalofuata
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Angalia Matokeo
                    <Trophy className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Result
  const passed = percentage >= 50;
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="card p-8 sm:p-12 text-center animate-slide-up">
          <div
            className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${
              passed
                ? 'bg-gradient-to-br from-tz-green to-tz-green-dark shadow-tz-green/20'
                : 'bg-gradient-to-br from-tz-yellow to-tz-yellow-dark shadow-tz-yellow/20'
            }`}
          >
            <Trophy className={`w-12 h-12 ${passed ? 'text-white' : 'text-tz-black'}`} />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
            {passed ? 'Hongera!' : 'Jaribu Tena!'}
          </h1>
          <p className="text-gray-400 mb-8">
            {passed ? 'Umefanya vizuri sana' : 'Unahitaji kujifunza zaidi'}
          </p>

          {/* Score circle */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1EB53A" />
                  <stop offset="50%" stopColor="#FCD116" />
                  <stop offset="100%" stopColor="#66AAD4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-4xl font-bold text-white">{percentage}%</span>
              <span className="text-sm text-gray-400 mt-1">
                {score}/{quizQuestions.length}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleStart}
              className="btn-primary bg-tz-green text-white hover:bg-tz-green-dark flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Jaribu Tena
            </button>
            {user && (
              <button
                onClick={() => onNavigate('dashibodi')}
                className="btn-primary bg-white/10 text-white border border-white/20 hover:bg-white/15 flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                Angalia Dashibodi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


