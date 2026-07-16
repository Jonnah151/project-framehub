import { useState, useEffect, ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Camera, LayoutDashboard, Package, Calendar, CreditCard, Bell, Users,
  BarChart3, ClipboardList, Truck, Palette, LogOut, Menu, X, Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/supabase';
import { supabase } from '../lib/supabase';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const navByRole: Record<UserRole, NavItem[]> = {
  customer: [
    { to: '/app', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/app/book', label: 'Book a Service', icon: <Calendar className="h-5 w-5" /> },
    { to: '/app/orders', label: 'My Orders', icon: <Package className="h-5 w-5" /> },
    { to: '/app/payments', label: 'Payments', icon: <CreditCard className="h-5 w-5" /> },
    { to: '/app/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  ],
  admin: [
    { to: '/app', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/app/admin/users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    { to: '/app/admin/orders', label: 'All Orders', icon: <Package className="h-5 w-5" /> },
    { to: '/app/admin/bookings', label: 'All Bookings', icon: <Calendar className="h-5 w-5" /> },
    { to: '/app/admin/plans', label: 'Plans', icon: <ClipboardList className="h-5 w-5" /> },
    { to: '/app/admin/categories', label: 'Categories', icon: <Settings className="h-5 w-5" /> },
    { to: '/app/admin/reports', label: 'Reports', icon: <BarChart3 className="h-5 w-5" /> },
    { to: '/app/admin/services', label: 'Services', icon: <Settings className="h-5 w-5" /> },
    { to: '/app/admin/profile', label: 'Profile', icon: <Settings className="h-5 w-5" /> },
    { to: '/app/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  ],
  designer: [
    { to: '/app', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/app/staff/orders', label: 'Assigned Orders', icon: <Palette className="h-5 w-5" /> },
    { to: '/app/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  ],
  photographer: [
    { to: '/app', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/app/staff/bookings', label: 'My Bookings', icon: <Camera className="h-5 w-5" /> },
    { to: '/app/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  ],
  delivery: [
    { to: '/app', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/app/staff/deliveries', label: 'Deliveries', icon: <Truck className="h-5 w-5" /> },
    { to: '/app/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  ],
};

const roleLabels: Record<UserRole, string> = {
  customer: 'Customer',
  admin: 'Administrator',
  designer: 'Designer',
  photographer: 'Photographer',
  delivery: 'Delivery Staff',
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
  }, [profile, location.pathname]);

  if (!profile) return null;

  const navItems = navByRole[profile.role] ?? navByRole.customer;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_28%)] pointer-events-none" />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 bg-slate-950/95 backdrop-blur-xl text-white flex-col transition-transform duration-300 lg:flex ${
          sidebarOpen ? 'flex translate-x-0' : 'hidden lg:flex -translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">FrameHub</span>
          </div>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 rounded-3xl bg-white/5 p-4 shadow-soft">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-sm font-semibold text-white shadow-lg shadow-cyan-500/20">
              {initials || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{profile.full_name}</div>
              <div className="text-xs text-slate-400">{roleLabels[profile.role]}</div>
            </div>
            <button onClick={handleSignOut} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200 hover:bg-white/10 transition" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-slate-900" />
            <span className="font-semibold text-slate-900">FrameHub</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-xs font-semibold text-white">
            {initials || 'U'}
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
