// src/Auth.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldCheck, User, Users, ShieldAlert, KeyRound, Globe, ToggleLeft, ToggleRight } from 'lucide-react';

// Modular Login/Register Views
import Login from './Login';
import Register from './Register';

export default function Auth({ onAuthSuccess }) {
  // Navigation matrix router within the authorization frame
  // Options: 'login' | 'register' | 'profile' | 'security' | 'passengers'
  const [activeSubView, setActiveSubView] = useState('login');
  
  // Dummy local states for previewing secondary management modules
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [savedPassengers, setSavedPassengers] = useState([
    { id: 1, name: "Patrick Chitambo", role: "Student" }
  ]);

  // Social Authentication Matrix
  const handleSocialLogin = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      alert(`OAuth Redirection Failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
      
      {/* ==========================================
          DYNAMICAL ROUTING PORTAL SWITCH
          ========================================== */}
      {activeSubView === 'login' && (
        <div>
          <Login onAuthSuccess={onAuthSuccess} />
          <div className="mt-4 text-center">
            <button 
              onClick={() => setActiveSubView('register')}
              className="text-xs text-zinc-500 hover:text-cyan-400 font-bold transition-colors font-mono"
            >
              [ NEW ENTITY? PROVISION USER CORE NODE ]
            </button>
          </div>
        </div>
      )}

      {activeSubView === 'register' && (
        <div>
          <Register onAuthSuccess={onAuthSuccess} />
          <div className="mt-4 text-center">
            <button 
              onClick={() => setActiveSubView('login')}
              className="text-xs text-zinc-500 hover:text-fuchsia-400 font-bold transition-colors font-mono"
            >
              [ ALREADY MAPPED? SWITCH TO AUTHENTICATION ]
            </button>
          </div>
        </div>
      )}

      {/* Profile Management Sub-View */}
      {activeSubView === 'profile' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
          <h4 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2 text-cyan-400">
            <User size={16} /> PROFILE INTERFACE MATRIX
          </h4>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-xs text-zinc-400 font-mono">NODE IDENTITY: ACTIVE SESSION USER</p>
            <input type="text" placeholder="Update Display Name" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400" />
            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] tracking-wider uppercase py-2 rounded-lg transition-colors">Commit Structural Updates</button>
          </div>
        </div>
      )}

      {/* Security Node Sub-View (2FA & Password Shifts) */}
      {activeSubView === 'security' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
          <h4 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2 text-fuchsia-400">
            <ShieldCheck size={16} /> SECURITY CRITICAL LAYERS
          </h4>
          
          {/* Change Password Panel */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-2">
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Modify Security Passphrase</label>
            <input type="password" placeholder="New Encrypted Token" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-fuchsia-500" />
            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] tracking-wider uppercase py-2 rounded-lg transition-colors">Rotate Password Signatures</button>
          </div>

          {/* Two-Factor Authentication Toggle */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white tracking-wide">Two-Factor Authentication</p>
              <p className="text-[10px] text-zinc-500 font-mono">Require multi-token handshake protocols</p>
            </div>
            <button onClick={() => setIsTwoFactorEnabled(!isTwoFactorEnabled)} className="text-zinc-400 hover:text-white transition-colors">
              {isTwoFactorEnabled ? <ToggleRight className="text-cyan-400" size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>
      )}

      {/* Saved Passengers Node Sub-View */}
      {activeSubView === 'passengers' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
          <h4 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2 text-yellow-500">
            <Users size={16} /> SAVED PASSENGER VECTORS
          </h4>
          <div className="space-y-2">
            {savedPassengers.map(p => (
              <div key={p.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                <span className="text-white font-bold">{p.name}</span>
                <span className="text-zinc-500 text-[10px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">{p.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          SOCIAL SYSTEM INTEGRATION CHANNELS (OAuth)
          ========================================== */}
      {(activeSubView === 'login' || activeSubView === 'register') && (
        <div className="mt-6 pt-4 border-t border-zinc-900/60 space-y-3">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-900"></div>
            <span className="flex-shrink mx-4 text-[9px] font-mono tracking-widest text-zinc-600 uppercase">OMNI-CHANNEL PASSPORT OAUTH</span>
            <div className="flex-grow border-t border-zinc-900"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-2.5">
            <button onClick={() => handleSocialLogin('google')} className="bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 py-2.5 rounded-xl text-xs font-bold transition-all hover:border-zinc-700 flex justify-center items-center gap-1.5">
              Google
            </button>
            <button onClick={() => handleSocialLogin('facebook')} className="bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 py-2.5 rounded-xl text-xs font-bold transition-all hover:border-zinc-700 flex justify-center items-center gap-1.5">
              Facebook
            </button>
            <button onClick={() => handleSocialLogin('apple')} className="bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 py-2.5 rounded-xl text-xs font-bold transition-all hover:border-zinc-700 flex justify-center items-center gap-1.5">
              Apple
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-NAV PANEL CONTROL STRIP
          ========================================== */}
      <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-around text-[10px] font-mono font-black tracking-wider text-zinc-500">
        <button onClick={() => setActiveSubView('login')} className={`hover:text-cyan-400 transition-colors uppercase ${activeSubView === 'login' ? 'text-cyan-400' : ''}`}>Gateway</button>
        <button onClick={() => setActiveSubView('profile')} className={`hover:text-cyan-400 transition-colors uppercase ${activeSubView === 'profile' ? 'text-cyan-400' : ''}`}>Identity</button>
        <button onClick={() => setActiveSubView('security')} className={`hover:text-cyan-400 transition-colors uppercase ${activeSubView === 'security' ? 'text-cyan-400' : ''}`}>Security</button>
        <button onClick={() => setActiveSubView('passengers')} className={`hover:text-cyan-400 transition-colors uppercase ${activeSubView === 'passengers' ? 'text-cyan-400' : ''}`}>Vectors</button>
      </div>
    </div>
  );
}