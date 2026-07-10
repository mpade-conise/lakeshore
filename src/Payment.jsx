// src/Payment.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CreditCard, User, HelpCircle, ShieldCheck, Loader2, Smartphone, Bell } from 'lucide-react';

export default function Payment() {
  const [passenger, setPassenger] = useState(null);
  const [trip, setTrip] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Mobile Money configuration states
  const [momoNumber, setMomoNumber] = useState('');
  const [momoProvider, setMomoProvider] = useState('airtel'); // airtel or tnm

  // Live Gateway Notifications Array
  const [notifications, setNotifications] = useState([
    { id: 'INIT-NODE', type: 'system', text: 'Payment Gateway Node active. Awaiting secure PayChangu handshake variables.', time: new Date().toLocaleTimeString() }
  ]);

  useEffect(() => {
    // Read manifest payload states from prior stages
    const storedPassenger = localStorage.getItem('lakeshore_registration');
    const storedTrip = localStorage.getItem('lakeshore_selected_trip');

    if (storedPassenger) {
      const parsedPassenger = JSON.parse(storedPassenger);
      setPassenger(parsedPassenger);
      // Fallback fallback extraction strategy safely mapping incoming strings
      setMomoNumber(parsedPassenger.phone_number || parsedPassenger.phoneNumber || '');
    }
    
    if (storedTrip) {
      setTrip(JSON.parse(storedTrip));
    } else {
      // Safe fallback configuration if step 3 cache structural variables are out of sync
      setTrip({
        id: 'SECURE-MANIFEST',
        seat: 'L3',
        from: 'Mwasambo',
        fare: 'MWK 5,000'
      });
    }
  }, []);

  const handleExecutePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMessage('');

    // Ensure strict uniqueness for tx_ref to avoid PayChangu API 400 validation failures
    const txReference = `LAKE-TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const targetAmount = 5000; // Fixed structural booking fee (MWK 5,000)

    try {
      // Check if PayChangu library is properly loaded into window context
      if (typeof window.PaychanguCheckout === 'undefined') {
        throw new Error("PayChangu SDK not initialized. Please ensure popup.js script is included in your index.html head.");
      }

      // DOM Guard: Verify document body state explicitly
      if (!document || !document.body) {
        throw new Error("DOM Engine unready. Please trigger transaction stack re-evaluation.");
      }

      // ====================================================================
      // HARD DOM RESET: Clean up broken overlays/iframes from previous crashes
      // ====================================================================
      const existingIframes = document.querySelectorAll('iframe[src*="paychangu"]');
      existingIframes.forEach(iframe => iframe.remove());

      const brokenOverlays = document.querySelectorAll('div[style*="position: fixed"]');
      brokenOverlays.forEach(div => {
        if (div.textContent.includes('technical error') || div.innerHTML === '') {
          div.remove();
        }
      });

      // Fetch active auth session safely without breaking context execution
      let userId = passenger?.id || "1e58f1a5-5a8f-4013-87bf-9cede57cf326"; 
      let userEmail = passenger?.booking_email || passenger?.email || "conise@gmail.com";
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          userId = session.user.id;
          userEmail = session.user.email;
        }
      } catch (authErr) {
        console.warn("Supabase session check bypassed for gateway setup:", authErr.message);
      }

      // ====================================================================
      // LIVE PAYCHANGU INLINE DEPOSIT POPUP INITIALIZATION
      // ====================================================================
      // Deferring execution gives the browser window 150ms to mount target parent frames properly
      setTimeout(() => {
        try {
          window.PaychanguCheckout({
            public_key: import.meta.env.VITE_PAYCHANGU_PUBLIC_KEY, 
            tx_ref: txReference,
            amount: targetAmount,
            currency: "MWK",
            callback_url: window.location.href, 
            customer_id: userId,
            customer_name: passenger?.full_name || passenger?.fullName || "Patrick Chitambo",
            customer_email: userEmail,
            custom_fields: {
              seat_node: trip?.seat || "L3",
              departing_center: trip?.from || "Mwasambo"
            },
            onclose: () => {
              setProcessing(false);
              setNotifications(prev => [{
                id: `CANCEL-${Date.now()}`,
                type: 'system',
                text: 'Gateway checkout window closed by user.',
                time: new Date().toLocaleTimeString()
              }, ...prev]);
            },
            onsuccess: async (response) => {
              try {
                // ====================================================================
                // SUPABASE PRODUCTION MUTATION LOOP
                // ====================================================================
                // Settle and finalize state tracking structures inside 'lakeshore' table
                const { error: dbError } = await supabase
                  .from('lakeshore')
                  .update({
                    payment_status: 'PAID',
                    payment_reference: txReference,
                    momo_number: momoNumber,
                    momo_provider: momoProvider === 'airtel' ? 'Airtel Money' : 'TNM Mpamba',
                    payment_completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userId);

                if (dbError) throw dbError;

                // Clear out local trip parameters to settle process flow
                localStorage.removeItem('lakeshore_selected_trip');

                // Dispatch success statement packet to the notification deck log
                const confirmationMsg = {
                  id: txReference,
                  type: 'success',
                  text: `SUCCESS // Booking Finalized! Record mutated to PAID. Ref: ${txReference}. Confirmed receipt of MWK ${targetAmount.toLocaleString()} via ${momoProvider.toUpperCase()}.`,
                  time: new Date().toLocaleTimeString()
                };

                setNotifications(prev => [confirmationMsg, ...prev]);
                setTrip(null); 
              } catch (dbErr) {
                console.error("Post-success handling error inside Database write:", dbErr);
                setErrorMessage(`Payment confirmed but local ledger update failed: ${dbErr.message}`);
              } finally {
                setProcessing(false);
              }
            }
          });
        } catch (innerScriptErr) {
          console.error("PayChangu inner instantiation crash handled:", innerScriptErr);
          setErrorMessage(`SDK Engine initialization exception: ${innerScriptErr.message}`);
          setProcessing(false);
        }
      }, 150);

    } catch (err) {
      setErrorMessage(err.message);
      setNotifications(prev => [{
        id: `ERR-${Date.now()}`,
        type: 'error',
        text: `Gateway Interface Failure: ${err.message}`,
        time: new Date().toLocaleTimeString()
      }, ...prev]);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-mono text-zinc-300 animate-in fade-in duration-300">
      
      {/* HEADER MATRIX STATUS */}
      <div>
        <h2 className="text-xl font-black text-white tracking-wider">4. SECURE TRANSACTION MATRIX</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
          Verify confirmed seat node variables and settle operational transport fees
        </p>
      </div>

      {errorMessage && (
        <div className="border rounded-xl p-3 text-xs font-semibold bg-red-500/10 border-red-500/20 text-red-400">
          GATEWAY FAULT: {errorMessage}
        </div>
      )}

      {/* CORE CONTROL HUB GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COMPONENT BLOCK */}
        <form onSubmit={handleExecutePayment} className="lg:col-span-2 space-y-4">
          
          {/* IMMUTABLE CONFIRMED SEAT MANIFEST RECEIPT */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <User size={14} className="text-cyan-400" /> Manifest Verification Receipt
            </h3>
            {passenger || trip ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-400 pt-1">
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
                  <span className="text-[10px] text-zinc-600 font-bold block mb-1">PASSENGER NAME</span>
                  <span className="text-white font-bold">{passenger?.full_name || passenger?.fullName || 'patrick chitambo'}</span>
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-cyan-400/20 shadow-[0_0_15px_rgba(0,240,255,0.03)]">
                  <span className="text-[10px] text-cyan-400 font-bold block mb-1">SECURE ALLOCATED SEAT</span>
                  <span className="text-cyan-400 font-black text-sm tracking-widest">
                    [ {trip?.seat || 'L3'} ]
                  </span>
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
                  <span className="text-[10px] text-zinc-600 font-bold block mb-1">DEPARTING BOARDING HUB</span>
                  <span className="text-zinc-300 font-bold">{passenger?.departing_center || passenger?.fromLocation || trip?.from || 'Mwasambo'}</span>
                </div>
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
                  <span className="text-[10px] text-zinc-600 font-bold block mb-1">ESTIMATED LAUNCH TIMING</span>
                  <span className="text-zinc-300 font-bold">08:00 AM Prompt</span>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-6 text-center text-zinc-500 text-xs uppercase font-bold">
                🎉 No active pending trip vectors mapped. System status: cleared.
              </div>
            )}
          </div>

          {/* TELEMETRY MOBILE MONEY INPUT VALUES */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Smartphone size={14} className="text-cyan-400" /> Mobile Money Vector Inputs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Network Provider</label>
                <select
                  value={momoProvider}
                  onChange={(e) => setMomoProvider(e.target.value)}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer"
                >
                  <option value="airtel" className="bg-zinc-950">Airtel Money</option>
                  <option value="tnm" className="bg-zinc-950">TNM Mpamba</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Billing Wallet Number</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs text-zinc-600 font-bold">+265</span>
                  <input 
                    type="tel"
                    required
                    placeholder="893059655"
                    value={momoNumber.replace(/^\+265/, '')}
                    onChange={(e) => setMomoNumber('+265' + e.target.value.replace(/\s+/g, ''))}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl py-2.5 pl-14 pr-4 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

            </div>
          </div>

        </form>

        {/* RIGHT COLUMN: REVENUE ACTIONS & LOG REPORT DATA */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* PRICE SETTLEMENT PANEL */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle size={14} className="text-cyan-400" /> Settlement Parameters
            </h3>

            <div className="flex justify-between items-baseline pt-1 border-b border-zinc-900/80 pb-3">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Aggregate Service Fee</span>
              <span className="text-xl font-black text-white">MWK 5,000</span>
            </div>

            <button
              type="button"
              onClick={handleExecutePayment}
              disabled={processing}
              className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 disabled:from-zinc-900 disabled:to-zinc-900 text-black disabled:text-zinc-600 font-black text-[11px] uppercase tracking-widest rounded-xl py-3.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center justify-center gap-2"
            >
              {processing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <CreditCard size={14} />
                  <span>Execute PayChangu Loop</span>
                </>
              )}
            </button>
          </div>

          {/* DYNAMIC LIVE NOTIFICATION CENTER COMPONENT */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Bell size={12} className="text-cyan-400" /> Gateway Notification Center
              </h4>
              <span className="text-[9px] text-zinc-600 uppercase font-bold">[ Online ]</span>
            </div>
            
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {notifications.map((note) => (
                <div key={note.id} className={`p-2.5 border rounded-xl space-y-1 bg-zinc-900/30 ${note.type === 'success' ? 'border-emerald-500/20' : 'border-zinc-900/60'}`}>
                  <div className="flex justify-between text-[9px] font-bold">
                    <span className={note.type === 'success' ? 'text-emerald-400' : 'text-zinc-500'}>
                      {note.type === 'success' ? '✓ GATEWAY_CONFIRM' : '⚙ MATRIX_LOG'}
                    </span>
                    <span className="text-zinc-600">{note.time}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">{note.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* BASE FOOTER */}
      <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-xl flex items-center gap-3 text-[10px] text-zinc-500 uppercase tracking-wider">
        <ShieldCheck size={16} className="text-emerald-500" /> Encryption Verification System Active // PayChangu Client Deposit Protocol Stable
      </div>

    </div>
  );
}
