// src/Login.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Key, AlertCircle, Loader2, LogIn } from 'lucide-react';

export default function Login({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        onAuthSuccess(data.user);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="text-center mb-2">
        <h3 className="text-lg font-black text-white tracking-wide">
          AUTHENTICATE CREDENTIALS
        </h3>
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
          Decrypt authorization keys for transport hub access
        </p>
      </div>

      {message.text && (
        <div className="border rounded-xl p-3 text-xs font-semibold flex items-center gap-2 bg-red-500/10 border-red-500/20 text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Address Input */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Email Vector</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 text-zinc-600" size={14} />
            <input 
              type="email" 
              required
              placeholder="student@mubas.ac.mw"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Security Passphrase</label>
          <div className="relative flex items-center">
            <Key className="absolute left-3.5 text-zinc-600" size={14} />
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* Actions Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-black text-[11px] uppercase tracking-widest rounded-xl py-3 transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <LogIn size={14} />
              <span>AUTHORIZE WORKSPACE INTERFACE</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}