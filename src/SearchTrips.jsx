// src/SearchTrips.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Home as HomeIcon, CheckSquare, Square, Armchair, AlertTriangle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SearchTrips({ onBookingSuccess }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Core Booking inputs matching your specification
  const [email, setEmail] = useState('');
  const [village, setVillage] = useState('');
  const [selectedSeat, setSelectedSeat] = useState('');
  const [serviceFeeChecked, setServiceFeeChecked] = useState(false);

  // Real-time reserved seats pulled from the database
  const [takenSeats, setTakenSeats] = useState([]);

  // Generate your complete triple-column seating layout row sequences (1 to 20)
  const leftSeats = Array.from({ length: 7 }, (_, i) => `L${i + 1}`);
  const middleleftSeats = Array.from({ length: 7 }, (_, i) => `ML${i + 1}`);
   const middleRightSeats = Array.from({ length: 7 }, (_, i) => `MR${i + 1}`);
  const rightSeats = Array.from({ length: 7 }, (_, i) => `R${i + 1}`);

  useEffect(() => {
    const initializeBookingData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setEmail(session.user.email || '');
          
          // Pull existing registration variables (like full name/phone) from previous step
          const { data: profile } = await supabase
            .from('lakeshore')
            .select('departing_center')
            .eq('id', session.user.id)
            .single();

          if (profile?.departing_center) {
            setVillage(profile.departing_center);
          }
        }

        // Fetch all seats already locked in the system to omit them from choices
        const { data: bookings, error: fetchError } = await supabase
          .from('lakeshore')
          .select('selected_seat')
          .not('selected_seat', 'is', null);

        if (fetchError) throw fetchError;

        if (bookings) {
          setTakenSeats(bookings.map(b => b.selected_seat));
        }
      } catch (err) {
        console.error("Error setting up operational constraints:", err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeBookingData();
  }, []);

  const handleCommitBooking = async (e) => {
    e.preventDefault();
    if (!selectedSeat) {
      setErrorMessage("SELECTION VOID: Please isolate an available seat node.");
      return;
    }
    if (!serviceFeeChecked) {
      setErrorMessage("COMPLIANCE FAULT: You must accept the MWK 5,000 regulatory service fee.");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Session timeout. Re-authenticate.");

      // Patch the current row record with the newly generated structural metrics
      const { error } = await supabase
        .from('lakeshore')
        .update({
          booking_email: email,
          village_or_center: village,
          selected_seat: selectedSeat,
          service_fee_accepted: true,
          booking_amount: 5000
        })
        .eq('id', session.user.id);

      if (error) throw error;

      // Update state tracking to preserve parameters for Step 4 Payment Gateway
      localStorage.setItem('lakeshore_selected_trip', JSON.stringify({
        id: `SEAT-${selectedSeat}`,
        from: village,
        to: 'MUBAS Main Campus',
        time: '08:00 AM',
        fare: 'MWK 5200',
        seat: selectedSeat
      }));

      setIsBooked(true);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-500 font-mono text-xs gap-2">
        <Loader2 className="animate-spin text-cyan-400" size={16} />
        RECONCILING ALLOCATED SEAT MATRICES...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-mono animate-in fade-in duration-300">
      
      {/* TITLE CONTAINER */}
      <div>
        <h2 className="text-xl font-black text-white tracking-wider uppercase">3. MASTER TRIP BOOKING HUB</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
          Isolate open spatial vectors across left, middle, and right cabin groups
        </p>
      </div>

      {errorMessage && (
        <div className="border rounded-xl p-3 text-xs font-semibold flex items-center gap-2 bg-red-500/10 border-red-500/20 text-red-400">
          <AlertTriangle size={14} className="shrink-0" />
          <span>VALIDATION EXCEPTION: {errorMessage}</span>
        </div>
      )}

      {isBooked ? (
        <div className="bg-zinc-950 border border-cyan-500/30 rounded-2xl p-8 text-center space-y-5 max-w-md mx-auto animate-in zoom-in-95">
          <CheckCircle2 className="text-cyan-400 mx-auto" size={44} />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase">Seat Safe-Locked Successfully</h3>
            <p className="text-xs text-zinc-400">Seat node [{selectedSeat}] holds your allocation signature.</p>
          </div>
          
          <p className="text-[10px] text-zinc-500 uppercase font-bold pt-1">
            Ready to execute your PayChangu payload transaction
          </p>

          {onBookingSuccess && (
            <button
              onClick={onBookingSuccess}
              className="w-full bg-cyan-400 hover:bg-cyan-500 text-black font-black text-[11px] uppercase tracking-widest rounded-xl py-3 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              Proceed to Payment <ArrowRight size={14} />
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleCommitBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT AREA: MASTER INPUT DATA CONTROLS */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4">
              <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase block border-b border-zinc-900 pb-2">Manifest Inputs</span>
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Communication Email</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 text-zinc-600" size={13} />
                  <input 
                    type="email" 
                    required
                    placeholder="student@mubas.ac.mw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* Village/Center */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Village / Departing Node</label>
                <div className="relative flex items-center">
                  <HomeIcon className="absolute left-3.5 text-zinc-600" size={13} />
                  <input 
                    type="text" 
                    required
                    placeholder="Departing point signature"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* Dynamic Selection Readout */}
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3 text-[11px] text-zinc-400 space-y-1.5">
                <div className="flex justify-between"><span>Selected Vector:</span> <span className="text-cyan-400 font-bold">{selectedSeat || 'NONE'}</span></div>
                <div className="flex justify-between"><span>Regulatory Fee:</span> <span className="text-zinc-200">MWK 5,200</span></div>
              </div>

              {/* Checkbox for service fee */}
              <div 
                onClick={() => setServiceFeeChecked(!serviceFeeChecked)}
                className="flex items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl cursor-pointer select-none group"
              >
                {serviceFeeChecked ? (
                  <CheckSquare size={16} className="text-cyan-400 shrink-0" />
                ) : (
                  <Square size={16} className="text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                )}
                <span className="text-[10px] font-bold text-zinc-400 uppercase leading-snug">
                  Authorize MWK 5,000 travel service fee itemization
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-black text-[11px] uppercase tracking-widest rounded-xl py-3 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : "Save & Continue"}
              </button>
            </div>
          </div>

          {/* RIGHT AREA: REAL-TIME GRAPHICAL SEATING DECK LAYOUT */}
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Cabin Deck Grid Map</span>
              <span className="text-[9px] text-zinc-600 font-bold uppercase">[ Already occupied nodes automatically omitted ]</span>
            </div>

            {/* SEATING COLUMNS FLEX MATRIX */}
            <div className="grid grid-cols-3 gap-6 pt-2">
              
              {/* LEFT ROW GROUP */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block text-center mb-1">Left Deck</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {leftSeats.map(seat => {
                    if (takenSeats.includes(seat)) return null; // Disappear if booked!
                    const active = selectedSeat === seat;
                    return (
                      <button
                        type="button" key={seat} onClick={() => setSelectedSeat(seat)}
                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${active ? 'bg-cyan-400 border-cyan-400 text-black shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                      >
                        <Armchair size={10} /> {seat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MIDDLE ROW GROUP */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block text-center mb-1">Middle Aisle</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {middleSeats.map(seat => {
                    if (takenSeats.includes(seat)) return null; // Disappear if booked!
                    const active = selectedSeat === seat;
                    return (
                      <button
                        type="button" key={seat} onClick={() => setSelectedSeat(seat)}
                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${active ? 'bg-cyan-400 border-cyan-400 text-black shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                      >
                        <Armchair size={10} /> {seat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT ROW GROUP */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block text-center mb-1">Right Deck</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {rightSeats.map(seat => {
                    if (takenSeats.includes(seat)) return null; // Disappear if booked!
                    const active = selectedSeat === seat;
                    return (
                      <button
                        type="button" key={seat} onClick={() => setSelectedSeat(seat)}
                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${active ? 'bg-cyan-400 border-cyan-400 text-black shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                      >
                        <Armchair size={10} /> {seat}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </form>
      )}
    </div>
  );
}
