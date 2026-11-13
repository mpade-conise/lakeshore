import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, KeyRound, Loader2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignUp({ onAuthSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() } } });
      if (error) throw error;
      if (data.session && data.user) onAuthSuccess?.(data.user);
      else setMessage({ type: 'success', text: 'Account created. Check your email to confirm your address, then sign in.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to create your account.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="text-center mb-2">
        <h3 className="text-lg font-black text-white tracking-wide">CREATE PASSENGER ACCOUNT</h3>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Register your Lakeshore sign-in credentials</p>
      </div>
      {message.text && <div className={`border rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>{message.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}<span>{message.text}</span></div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-widest block">Full name</label>
          <div className="relative flex items-center"><User className="absolute left-3.5 text-zinc-600" size={14} /><input required minLength={2} autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white" /></div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-widest block">Email address</label>
          <div className="relative flex items-center"><Mail className="absolute left-3.5 text-zinc-600" size={14} /><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="student@example.com" className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white" /></div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold uppercase tracking-widest block">Password</label>
          <div className="relative flex items-center"><KeyRound className="absolute left-3.5 text-zinc-600" size={14} /><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white" /></div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 disabled:opacity-60 text-black font-black text-[11px] uppercase tracking-widest rounded-xl py-3 flex items-center justify-center gap-2">{loading ? <Loader2 size={14} className="animate-spin" /> : <><UserPlus size={14} /> Create account</>}</button>
      </form>
    </div>
  );
}
