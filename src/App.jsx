import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, BusFront, LayoutDashboard, UserRoundPlus, Ticket, CreditCard, LogOut, Menu, X, ChevronRight, ShieldCheck } from 'lucide-react';
import Auth from './Auth';
import Home from './Home';
import RegisterComponent from './Register';
import SearchTrips from './SearchTrips';
import Payment from './Payment';
import AdminDashboard from './admin/AdminDashboard';

const studentNavigation = [
  { id: 'home', label: 'Overview', description: 'Your transport hub', icon: LayoutDashboard },
  { id: 'register', label: 'Passenger details', description: 'Your travel profile', icon: UserRoundPlus },
  { id: 'booking', label: 'Book a seat', description: 'Choose your journey', icon: Ticket },
  { id: 'payment', label: 'Payments', description: 'Complete your booking', icon: CreditCard }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [sidebarView, setSidebarView] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchUserRole(currentUser.id);
      else setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchUserRole(currentUser.id);
      else {
        setRole(null);
        setInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase.from('lakeshore').select('role').eq('id', userId).single();
      if (error) throw error;
      setRole(data?.role || 'student');
    } catch {
      setRole('student');
    } finally {
      setInitializing(false);
    }
  };

  const handleLogout = () => supabase.auth.signOut();
  const selectView = (view) => {
    setSidebarView(view);
    setIsMobileMenuOpen(false);
  };

  if (initializing) {
    return (
      <div className="app-loading">
        <div className="app-loading-mark"><BusFront size={27} /></div>
        <Loader2 className="animate-spin" size={22} />
        <p>Preparing your Lakeshore experience</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <div className="app-brand-mark"><BusFront size={24} /></div>
          <div><strong>LAKESHORE</strong><span>MUBAS TRANSPORT</span></div>
        </div>
        <Auth onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />
        <p className="auth-footer">Reliable journeys. Simpler travel.</p>
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <div className="app-shell">
        <aside className="app-sidebar admin-sidebar">
          <div className="app-brand">
            <div className="app-brand-mark"><BusFront size={23} /></div>
            <div className="app-brand-copy"><strong>LAKESHORE</strong><span>ADMINISTRATION</span></div>
          </div>
          <div className="sidebar-admin-note"><ShieldCheck size={17} /><span>Administrator workspace</span></div>
          <div className="sidebar-bottom">
            <div className="sidebar-user"><div className="sidebar-avatar">A</div><div><strong>Administrator</strong><span>Control centre</span></div></div>
            <button onClick={handleLogout} className="sidebar-logout"><LogOut size={17} /> Sign out</button>
          </div>
        </aside>
        <main className="app-main admin-main">
          <div className="app-content"><AdminDashboard /></div>
        </main>
      </div>
    );
  }

  const activeItem = studentNavigation.find(item => item.id === sidebarView) || studentNavigation[0];
  const userLabel = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Passenger';
  const initials = userLabel.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button className="mobile-brand" onClick={() => selectView('home')} aria-label="Go to overview">
          <span className="app-brand-mark"><BusFront size={21} /></span><strong>LAKESHORE</strong>
        </button>
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}>
          {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <aside className={`app-sidebar student-sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
        <button className="app-brand brand-button" onClick={() => selectView('home')}>
          <div className="app-brand-mark"><BusFront size={23} /></div>
          <div className="app-brand-copy"><strong>LAKESHORE</strong><span>MUBAS TRANSPORT</span></div>
        </button>
        <div className="sidebar-section-label">MENU</div>
        <nav className="sidebar-nav">
          {studentNavigation.map(item => {
            const Icon = item.icon;
            const active = sidebarView === item.id;
            return (
              <button key={item.id} onClick={() => selectView(item.id)} className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}>
                <span className="sidebar-link-icon"><Icon size={19} /></span>
                <span className="sidebar-link-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                {active && <ChevronRight size={16} className="sidebar-link-arrow" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-help-card">
          <div className="help-card-icon"><BusFront size={19} /></div>
          <strong>Travel with confidence</strong>
          <p>Manage your passenger details, seats and payments in one place.</p>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-copy"><strong>{userLabel}</strong><span>Passenger account</span></div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout"><LogOut size={17} /> Sign out</button>
        </div>
      </aside>

      {isMobileMenuOpen && <button className="mobile-backdrop" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close navigation" />}
      <main className="app-main">
        <div className="main-topbar">
          <div><span className="topbar-eyebrow">PASSENGER PORTAL</span><h1>{activeItem.label}</h1></div>
          <div className="topbar-account"><div className="topbar-avatar">{initials}</div><div><strong>{userLabel}</strong><span>Student account</span></div></div>
        </div>
        <div className="app-content">
          {sidebarView === 'home' && <Home />}
          {sidebarView === 'register' && <RegisterComponent onRegistrationSuccess={() => selectView('booking')} />}
          {sidebarView === 'booking' && <SearchTrips onBookingSuccess={() => selectView('payment')} />}
          {sidebarView === 'payment' && <Payment />}
        </div>
        <footer className="app-footer"><span>LAKESHORE · MUBAS TRANSPORT</span><span>Making every journey easier</span></footer>
      </main>
    </div>
  );
}
