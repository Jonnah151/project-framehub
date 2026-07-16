import { useState } from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../lib/auth';

export type Page = 'mwanzo' | 'chatbot' | 'jaribio' | 'dashibodi' | 'kuhusu' | 'ingia';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string }[] = [
  { id: 'mwanzo', label: 'Mwanzo' },
  { id: 'chatbot', label: 'Chatbot' },
  { id: 'jaribio', label: 'Jaribio' },
  { id: 'dashibodi', label: 'Dashibodi' },
  { id: 'kuhusu', label: 'Kuhusu' },
];

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-tz-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNav('mwanzo')}
            className="flex items-center gap-3 group"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-tz-green via-tz-yellow to-tz-blue shadow-lg group-hover:scale-110 transition-transform">
              <div className="absolute inset-0 bg-tz-diagonal opacity-90" />
              <span className="relative z-10 font-display font-bold text-white text-lg">M</span>
            </div>
            <span className="font-display font-bold text-xl text-white hidden sm:block">
              Muungano<span className="text-tz-green">AI</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  currentPage === item.id
                    ? 'bg-tz-green/20 text-tz-green'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <User className="w-4 h-4 text-tz-green" />
                  <span className="max-w-[150px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Toka
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNav('ingia')}
                className="btn-primary bg-tz-green text-white hover:bg-tz-green-dark shadow-lg shadow-tz-green/20"
              >
                Ingia
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:bg-white/5"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`px-4 py-3 rounded-lg font-medium text-left transition-all ${
                    currentPage === item.id
                      ? 'bg-tz-green/20 text-tz-green'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {user ? (
                <div className="flex items-center justify-between gap-2 px-4 py-3 mt-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-gray-300 truncate">
                    <User className="w-4 h-4 text-tz-green shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                    Toka
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNav('ingia')}
                  className="mt-2 btn-primary bg-tz-green text-white hover:bg-tz-green-dark"
                >
                  Ingia
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
