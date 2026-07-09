// src/App.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Bus, LayoutDashboard, UserPlus, Ticket, CreditCard, ShieldCheck, LogOut } from 'lucide-react';

// Import our clean architecture nodes
import Auth from './Auth';
import Home from './Home';
import RegisterComponent from './Register'; // Aliased to prevent collision
import SearchTrips from './SearchTrips';   // Maps to Booking tree
import Payment from './Payment';

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' or 'student'
  const [initializing, setInitializing] = useState(true);
  
  // Sidebar view manager: matches your 4 diagram items
  const [sidebarView, setSidebarView] = useState('home'); 

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

  // 3. Admin Branch Escape Route (Admin Portal Only)
  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
        <div className="border border-red-500/30 bg-red-950/10 rounded-2xl p-8 max-w-md text-center space-y-4">
          <ShieldCheck className="text-red-400 mx-auto" size={48} />
          <h2 className="text-xl font-black tracking-wider">ADMINISTRATOR SECURE PORTAL</h2>
          <p className="text-xs text-zinc-400 font-mono">System routing isolated from passenger workflows.</p>
          <button onClick={handleLogout} className="bg-red-500 text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-2 mx-auto">
            <LogOut size={14} /> Terminate Session
          </button>
        </div>
      </div>
    );
  }

  // 4. Regular Users & Liccommers Layout (Main Dashboard Tree)
  return (
    <div className="min-h-screen bg-black text-white flex">
      
      {/* SIDEBAR NAVIGATION GRID */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between p-4 shrink-0 font-mono">
        <div className="space-y-8">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <Bus className="text-cyan-400" size={20} />
            <span className="font-black tracking-widest text-sm text-zinc-200">LAKESHORE</span>
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={() => setSidebarView('home')} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${sidebarView === 'home' ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <LayoutDashboard size={16} /> 1. Home
            </button>
            <button 
              onClick={() => setSidebarView('register')} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${sidebarView === 'register' ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <UserPlus size={16} /> 2. Register
            </button>
            <button 
              onClick={() => setSidebarView('booking')} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${sidebarView === 'booking' ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <Ticket size={16} /> 3. Booking
            </button>
            <button 
              onClick={() => setSidebarView('payment')} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${sidebarView === 'payment' ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <CreditCard size={16} /> 4. Payment
            </button>
          </nav>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-2 text-zinc-600 hover:text-red-400 text-xs font-bold p-2 transition-colors">
          <LogOut size={14} /> Exit Station
        </button>
      </aside>

      {/* DASHBOARD ROUTED CONTENT VIEWSPACE */}
      <main className="flex-grow p-8 bg-zinc-950/40 relative overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,240,255,0.015),transparent_50%)] pointer-events-none"></div>
        
        {sidebarView === 'home' && <Home />}
        {sidebarView === 'register' && <RegisterComponent />}
        {sidebarView === 'booking' && <SearchTrips />}
        {sidebarView === 'payment' && <Payment />}
      </main>

    </div>
  );
}