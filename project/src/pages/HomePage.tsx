import { MessageSquare, Brain, BarChart3, BookOpen, ArrowRight } from 'lucide-react';
import type { Page } from '../components/Navbar';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

const features = [
  {
    icon: MessageSquare,
    title: 'Chatbot ya AI',
    desc: 'Uliza maswali yote kuhusu Muungano wa Tanzania na upate majibu papo hapo.',
    page: 'chatbot' as Page,
    color: 'from-tz-green to-tz-green-dark',
  },
  {
    icon: Brain,
    title: 'Jaribio',
    desc: 'Jaribu maarifa yako kuhusu Tanzania kwa maswali ya kuchagua.',
    page: 'jaribio' as Page,
    color: 'from-tz-yellow to-tz-yellow-dark',
  },
  {
    icon: BarChart3,
    title: 'Dashibodi',
    desc: 'Fuatilia maendeleo yako ya masomo na matokeo ya majaribio.',
    page: 'dashibodi' as Page,
    color: 'from-tz-blue to-tz-blue-dark',
  },
  {
    icon: BookOpen,
    title: 'Kuhusu',
    desc: 'Jifunze zaidi kuhusu kusudi na historia ya MuunganoAI.',
    page: 'kuhusu' as Page,
    color: 'from-tz-green-dark to-tz-blue-dark',
  },
];

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-tz-green/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-tz-blue/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-tz-yellow/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-tz-green/30 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-tz-green animate-pulse" />
            <span className="text-sm text-gray-300">Jifunze kuhusu Muungano wa Tanzania</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 animate-slide-up">
            <span className="text-white">Muungano</span>
            <span className="bg-gradient-to-r from-tz-green via-tz-yellow to-tz-blue bg-clip-text text-transparent"> AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Jifunze historia, utamaduni, na siasa za Muungano wa Tanganyika na Zanzibar kwa njia ya kisasa
            na ya kufurahisha. Uliza, jaribu, na fuatilia maendeleo yako.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => onNavigate('chatbot')}
              className="btn-primary bg-tz-green text-white hover:bg-tz-green-dark shadow-xl shadow-tz-green/20 flex items-center justify-center gap-2"
            >
              Anza Mazungumzo
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('jaribio')}
              className="btn-primary bg-white/10 text-white border border-white/20 hover:bg-white/15 flex items-center justify-center gap-2"
            >
              Jaribu Maarifa
              <Brain className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {[
              { value: '1964', label: 'Muungano' },
              { value: '31', label: 'Mikoa' },
              { value: '120+', label: 'Makabila' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-b from-tz-green to-tz-yellow bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Vipengele vya <span className="text-tz-green">MuunganoAI</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Zana nne kuu za kukusaidia kujifunza kuhusu Tanzania
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <button
                key={feature.title}
                onClick={() => onNavigate(feature.page)}
                className="card p-6 text-left hover:border-tz-green/40 hover:bg-white/10 transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-tz-green text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Endelea <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-12 text-center">
            Mstari wa Wakati wa <span className="text-tz-green">Muungano</span>
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-tz-green via-tz-yellow to-tz-blue" />

            {[
              { year: '1961', event: 'Tanganyika inapata uhuru', side: 'left' },
              { year: '1963', event: 'Zanzibar inapata uhuru', side: 'right' },
              { year: '1964', event: 'Muungano wa Tanganyika na Zanzibar', side: 'left' },
              { year: '1967', event: 'Azimio la Arusha - Ujamaa na Kujitegemea', side: 'right' },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`relative flex items-center mb-8 ${
                  item.side === 'left' ? 'sm:justify-start' : 'sm:justify-end'
                }`}
              >
                <div className={`flex items-center gap-4 sm:w-1/2 ${item.side === 'left' ? 'sm:pr-8' : 'sm:pl-8 sm:flex-row-reverse'}`}>
                  <div className="relative z-10 w-8 h-8 rounded-full bg-tz-green flex items-center justify-center shrink-0 ring-4 ring-tz-black">
                    <span className="w-3 h-3 rounded-full bg-tz-yellow" />
                  </div>
                  <div className="card p-4 flex-1 animate-slide-up">
                    <div className="font-display text-2xl font-bold text-tz-green">{item.year}</div>
                    <div className="text-gray-300 mt-1">{item.event}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
