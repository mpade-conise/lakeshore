// src/App.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Bus, LayoutDashboard, UserPlus, Ticket, CreditCard, LogOut, Menu, X } from 'lucide-react';

// Import our clean architecture nodes
import Auth from './Auth';
import Home from './Home';
import RegisterComponent from './Register'; // Aliased to prevent collision
import SearchTrips from './SearchTrips';   // Maps to Booking tree
import Payment from './Payment';
import AdminDashboard from './Admin/AdminDashboard'; // Administrative Command Node

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' or 'student'
  const [initializing, setInitializing] = useState(true);
  
  // Sidebar view manager: matches your 4 diagram items
  const [sidebarView, setSidebarView] = useState('home'); 

  // Mobile navigation drawer toggle state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initial handshake check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchUserRole(currentUser.id);
      else setInitializing(false);
    });

    // Real-time authentication session changes
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
      const { data, error } = await supabase
        .from('lakeshore')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setRole(data?.role || 'student');
    } catch (err) {
      setRole('student'); // Default safe state fallback
    } finally {
      setInitializing(false);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  // 1. Initial decrypting loading system
  if (initializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-400 gap-4">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
        <p className="text-xs font-mono tracking-widest text-zinc-600">RESETTING CORE SYSTEM LOGIC...</p>
      </div>
    );
  }

  // 2. Auth Gateway Portal (If unauthorized)
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Auth onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />
      </div>
    );
  }

  // 3. Admin Branch Escape Route (Admin Portal Fully Operational)
  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col md:flex-row relative overflow-x-hidden">
        {/* ADMIN SIDEBAR DRAWER */}
        <aside className="w-full md:w-64 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-900 flex flex-row md:flex-col justify-between p-4 font-mono shrink-0 items-center md:items-stretch">
          <div className="flex md:flex-col gap-6 items-center md:items-start w-full">
            <div className="flex items-center gap-2.5 px-2 py-1">
              <Bus className="text-red-400" size={20} />
              <span className="font-black tracking-widest text-sm text-zinc-200">LAKESHORE CONTROL</span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-zinc-500 hover:text-red-400 text-xs font-bold p-2 transition-colors">
            <LogOut size={14} /> Kill Command
          </button>
        </aside>

        {/* MAIN VIEWSPACE PORTAL */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 bg-zinc-950/40 relative overflow-y-auto w-full max-w-full">
          <AdminDashboard />
        </main>
      </div>
    );
  }

  // 4. Regular Users & Liccommers Layout (Main Passenger Dashboard Tree)
  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row relative overflow-x-hidden">
      
      {/* MOBILE TOPBAR CONTROLLER (Only mounts on small screens) */}
      <div className="md:hidden w-full bg-zinc-950 border-b border-zinc-900 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Bus className="text-cyan-400" size={18} />
          <span className="font-black tracking-widest text-xs text-zinc-200">LAKESHORE</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl active:scale-95"
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* SIDEBAR NAVIGATION GRID (Responsive Drawer Overlay on Smartphones) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between p-4 font-mono
        transform transition-transform duration-300 ease-in-out md:relative md:transform-none md:shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-8">
          <div className="hidden md:flex items-center gap-2.5 px-2 py-1">
            <Bus className="text-cyan-400" size={20} />
            <span className="font-black tracking-widest text-sm text-zinc-200">LAKESHORE</span>
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={() => {
                setSidebarView('home');
                setIsMobileMenuOpen(false); // Auto close mobile menu
              }} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${sidebarView === 'home' ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <LayoutDashboard size={16} /> 1. Home
            </button>
            <button 
              onClick={() => {
                setSidebarView('register');
                setIsMobileMenuOpen(false); // Auto close mobile menu
              }} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${sidebarView === 'register' ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <UserPlus size={16} /> 2. Register
            </button>
            <button 
              onClick={() => {
                setSidebarView('booking');
                setIsMobileMenuOpen(false); // Auto close mobile menu
              }} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${sidebarView === 'booking' ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <Ticket size={16} /> 3. Booking
            </button>
            <button 
              onClick={() => {
                setSidebarView('payment');
                setIsMobileMenuOpen(false); // Auto close mobile menu
              }} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${sidebarView === 'payment' ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <CreditCard size={16} /> 4. Payment
            </button>
          </nav>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-2 text-zinc-600 hover:text-red-400 text-xs font-bold p-2 transition-colors mt-auto">
          <LogOut size={14} /> Exit Station
        </button>
      </aside>

      {/* MOBILE DARK BACKDROP OVERLAY TRAP */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* DASHBOARD ROUTED CONTENT VIEWSPACE */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 bg-zinc-950/40 relative overflow-y-auto w-full max-w-full">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,240,255,0.015),transparent_50%)] pointer-events-none"></div>
        
        {sidebarView === 'home' && <Home />}
        
        {sidebarView === 'register' && (
          <RegisterComponent onRegistrationSuccess={() => setSidebarView('booking')} />
        )}
        
        {sidebarView === 'booking' && (
          <SearchTrips onBookingSuccess={() => setSidebarView('payment')} />
        )}
        
        {sidebarView === 'payment' && <Payment />}
      </main>

    </div>
  );
}
