import { Info, Users, Target, BookOpen, Heart, Mail, Github, Globe } from 'lucide-react';

export function AboutPage() {
  const values = [
    {
      icon: BookOpen,
      title: 'Elimu kwa Wote',
      desc: 'Tunaamini kuwa kila mtu anastahili kupata elimu kuhusu historia ya nchi yake bila malipo.',
    },
    {
      icon: Target,
      title: 'Usahihi',
      desc: 'Taarifa zetu zinapatikana kutoka vyanzo vya kuaminika na zinakaguliwa kwa usahihi.',
    },
    {
      icon: Users,
      title: 'Jumuiya',
      desc: 'Tunajenga jumuiya ya Watanzania wanaojifunza na kushirikiana pamoja.',
    },
    {
      icon: Heart,
      title: 'Upendo wa Taifa',
      desc: 'Tunathamini sana urithi na utambulisho wa taifa letu la Tanzania.',
    },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-tz-green via-tz-yellow to-tz-blue flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Info className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Kuhusu <span className="text-tz-green">MuunganoAI</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            MuunganoAI ni jukwaa la kidijitali linalolenga kuelimisha na kuhamasisha Watanzania
            kuhusu historia, utamaduni, na siasa za Muungano wa Tanganyika na Zanzibar.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8 sm:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-tz-green/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-tz-green" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white">Dyetu</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              Lengo letu ni kufanya elimu kuhusu Muungano wa Tanzania kuwa rahisi, ya kuvutia, na
              inayopatikana kwa kila mtu anayetumia teknolojia ya kisasa. Tunatumaini kuwa kwa njia hii,
              Watanzania wote - wadogo na wakubwa - wataweza kuelewa vizuri historia ya nchi yao,
            </p>
            <p className="text-gray-300 leading-relaxed">
              Muungano wa Tanganyika na Zanzibar uliotokea tarehe 26 Aprili 1964 ni tukio muhimu sana
              katika historia ya Afrika. Sisi tunataka kuhakikisha kuwa kizazi kipya kinakumbuka na
              kuelewa umuhimu wa tukio hili.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-white text-center mb-12">
            Maadili Yetu
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((value, idx) => (
              <div
                key={value.title}
                className="card p-6 hover:border-tz-green/40 transition-all animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tz-green to-tz-blue flex items-center justify-center shrink-0">
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white mb-2">{value.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{value.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-white mb-4">Teknolojia Tumizi</h2>
            <p className="text-gray-400 mb-6">Programu hii imejengwa kwa kutumia teknolojia za kisasa</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Vite', 'Lucide Icons'].map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-4">Wasiliana Nasi</h2>
          <p className="text-gray-400 mb-8">Tunakaribisha maoni na mapendekezo yako</p>
          <div className="flex justify-center gap-4">
            {[
              { icon: Mail, label: 'Barua pepe' },
              { icon: Github, label: 'GitHub' },
              { icon: Globe, label: 'Tovuti' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-tz-green/40 hover:bg-tz-green/10 transition-all cursor-pointer"
              >
                <item.icon className="w-5 h-5 text-gray-300" />
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-8">
            MuunganoAI &copy; 2024 - Imejengwa kwa upendo wa Taifa la Tanzania
          </p>
        </div>
      </section>
    </div>
  );
}
