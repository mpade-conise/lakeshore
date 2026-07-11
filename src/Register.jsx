// src/Register.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Phone, MapPin, Clock, AlertTriangle, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Register({ onRegistrationSuccess }) {
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Primary Form State Array matching your structural logic requirements
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    guardianType1: 'Father', // Options: Father, Mother, Guardian, Other
    guardianPhone1: '',
    guardianType2: 'Mother', 
    guardianPhone2: '',
    departingCenter: '' // Selection Nodes: Mwasambo, Benga, Kamuzu Road Salima, Nkhotakota Boma
  });

  // Automatically fetch current authenticated user data to prepopulate if needed
  useEffect(() => {
    const fetchActiveSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Prefill display name signature if available from Auth stage
        setFormData(prev => ({
          ...prev,
          fullName: session.user.user_metadata?.full_name || '',
          phoneNumber: session.user.phone || ''
        }));
      }
    };
    fetchActiveSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Authentication timeout: Please log in again.");

      // Insert fresh row data payload directly into the target lakeshore table structure
      const { error } = await supabase
        .from('lakeshore')
        .upsert({
          id: session.user.id, // Primary Key ties tracking cleanly to the core user record
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          guardian_type_1: formData.guardianType1,
          guardian_phone_1: formData.guardianPhone1,
          guardian_type_2: formData.guardianType2,
          guardian_phone_2: formData.guardianPhone2,
          departing_center: formData.departingCenter,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Cache structural context strings locally to keep Step 3 & 4 pipeline active
      localStorage.setItem('lakeshore_registration', JSON.stringify({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        fromLocation: formData.departingCenter
      }));

      setIsRegistered(true);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 font-mono">
      
      {/* HIGH-PRIORITY TIMING GUARDRAIL PINNED BANNER */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
        <Clock className="text-amber-400 shrink-0 mt-0.5 animate-pulse" size={18} />
        <div>
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">CRITICAL DEPARTURE PROTOCOL</h4>
          <p className="text-[11px] text-zinc-300 leading-relaxed mt-0.5">
            "Please make sure that by 8:00 you are on the departing center for us not to waste more time on the depot."
          </p>
        </div>
      </div>

      {/* COMPONENT TITLE */}
      <div>
        <h2 className="text-xl font-black text-white tracking-wider uppercase">2. Manifest & Security Contact Node</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
          Synchronize database manifest rows with backup emergency vectors
        </p>
      </div>

      {errorMessage && (
        <div className="border rounded-xl p-3 text-xs font-semibold flex items-center gap-2 bg-red-500/10 border-red-500/20 text-red-400">
          <AlertTriangle size={14} className="shrink-0" />
          <span>DATABASE ERROR: {errorMessage}</span>
        </div>
      )}

      {isRegistered ? (
        /* SUCCESS TRANSACTION VIEWSPACE */
        <div className="bg-zinc-950 border border-cyan-500/30 rounded-2xl p-8 text-center space-y-5 animate-in zoom-in-95">
          <CheckCircle2 className="text-cyan-400 mx-auto" size={44} />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase">Data Pipeline Committed</h3>
            <p className="text-xs text-zinc-400">Student vector securely inserted into database table [lakeshore].</p>
          </div>
          
          <div className="pt-2">
            {/* NEXT STEP MANUAL OVERRIDE ACTION BUTTON */}
            <button
              type="button"
              onClick={() => onRegistrationSuccess && onRegistrationSuccess()}
              className="mx-auto bg-cyan-400 hover:bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-xl px-6 py-3.5 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.15)] active:scale-95"
            >
              <span>Proceed to 3. Booking Node</span>
              <ArrowRight size={14} strokeWidth={3} />
            </button>
          </div>

          <p className="text-[10px] text-zinc-500 uppercase font-bold animate-pulse pt-2">
            Manifest Locked // Click button above to advance to the seat choice grid
          </p>
        </div>
      ) : (
        /* REGISTRATION DATA ENTRY SCHEMATIC */
        <form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Full Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Student Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 text-zinc-600" size={14} />
                <input 
                  type="text" 
                  required
                  placeholder="Legal Name Match"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {/* 2. Phone Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Primary Contact Phone</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 text-zinc-600" size={14} />
                <input 
                  type="tel" 
                  required
                  placeholder="e.g., +265 888..."
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* BACKUP LOGIC MATRIX: GUARDIANS / PARENTS */}
          <div className="border-t border-b border-zinc-900 py-4 space-y-4">
            <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase block">
              3 & 4. Offline Communications Intermediaries (Select 2 Backup Vectors)
            </span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Guardian 1 */}
              <div className="p-3.5 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Vector Alpha Relation</label>
                  <select 
                    value={formData.guardianType1}
                    onChange={(e) => setFormData({...formData, guardianType1: e.target.value})}
                    className="bg-zinc-950 border border-zinc-800 text-[11px] rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other Relation</option>
                  </select>
                </div>
                <input 
                  type="tel" 
                  required
                  placeholder="Emergency Phone Signature"
                  value={formData.guardianPhone1}
                  onChange={(e) => setFormData({...formData, guardianPhone1: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Guardian 2 */}
              <div className="p-3.5 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Vector Beta Relation</label>
                  <select 
                    value={formData.guardianType2}
                    onChange={(e) => setFormData({...formData, guardianType2: e.target.value})}
                    className="bg-zinc-950 border border-zinc-800 text-[11px] rounded px-1.5 py-0.5 text-zinc-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other Relation</option>
                  </select>
                </div>
                <input 
                  type="tel" 
                  required
                  placeholder="Emergency Phone Signature"
                  value={formData.guardianPhone2}
                  onChange={(e) => setFormData({...formData, guardianPhone2: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* 5. Departing Center Dropdown Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Departing Center Node</label>
            <div className="relative flex items-center">
              <MapPin className="absolute left-3.5 text-zinc-600" size={14} strokeWidth={2} />
              <select
                required
                value={formData.departingCenter}
                onChange={(e) => setFormData({...formData, departingCenter: e.target.value})}
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled className="bg-zinc-950 text-zinc-600">-- Choose your departing center --</option>
                <option value="Mwasambo" className="bg-zinc-950 text-white">Mwasambo turn off</option>
                <option value="Kamuzu Road Salima" className="bg-zinc-950 text-white">Kamuzu Road Salima</option>
              
              </select>
            </div>
          </div>

          {/* Form Submit Switch */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 border border-zinc-800 hover:border-cyan-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin text-cyan-400" />
            ) : (
              <>
                <span>Commit Registry & save</span>
                <ShieldCheck size={14} className="text-cyan-400" />
              </>
            )}
          </button>

        </form>
      )}
    </div>
  );
}
