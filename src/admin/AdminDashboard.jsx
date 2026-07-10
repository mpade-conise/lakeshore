// src/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Users, Ticket, CreditCard, RefreshCw, CheckCircle2, 
  XCircle, AlertCircle, ArrowUpRight, ShieldCheck 
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalBookings: 0, totalPayouts: 0 });
  const [registrations, setRegistrations] = useState([]);
  const [processingPayout, setProcessingPayout] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch registrations tracking metrics from lakeshore table
      const { data: users, error: userErr } = await supabase
        .from('lakeshore')
        .select('*')
        .order('created_at', { ascending: false });

      if (userErr) throw userErr;

      setRegistrations(users || []);
      
      // Calculate basic analytics summaries
      const adminsCount = users?.filter(u => u.role === 'admin').length || 0;
      setStats({
        totalUsers: users?.length || 0,
        totalBookings: users?.filter(u => u.departing_center).length || 0, // Mock metric check
        totalPayouts: users?.filter(u => u.payout_completed).length || 0
      });

    } catch (err) {
      console.error("Error pulling admin datasets:", err.message);
      setStatusMessage({ type: 'error', text: 'Failed to synchronize workspace analytics trees.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Triggering the payout via your updated Edge function route pipeline
  const handleTriggerPayout = async (ownerRecord) => {
    if (!ownerRecord.mobile_number || !ownerRecord.operator_ref_id) {
      setStatusMessage({ 
        type: 'error', 
        text: `Missing active payout channel vectors for ${ownerRecord.first_name || 'User'}` 
      });
      return;
    }

    setProcessingPayout(ownerRecord.id);
    setStatusMessage({ type: '', text: '' });

    try {
      // Direct integration call out to your hosted Edge function core tree
      const response = await fetch('https://urvjylqterbrfulxodwc.supabase.co/functions/v1/paychangu-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          ownerId: ownerRecord.id,
          amount: 5000 // Replace dynamically or with a prompt payload input field later
        })
      });

      const result = await response.json();

      if (!response.ok || result.error) throw new Error(result.error || 'Payout declined');

      // Update local state indicators upon successful PayChangu route verification
      setStatusMessage({ type: 'success', text: `Successfully processed MWK 5,000 disbursement to ${ownerRecord.mobile_number}` });
      
      // Optional: Update matching column reference inside public database
      await supabase
        .from('lakeshore')
        .update({ payout_completed: true })
        .eq('id', ownerRecord.id);

      fetchAdminData(); // Refresh metrics tracking UI layout

    } catch (err) {
      setStatusMessage({ type: 'error', text: `Transfer Fault: ${err.message}` });
    } finally {
      setProcessingPayout(null);
    }
  };

  return (
    <div className="space-y-8 font-mono">
      {/* HEADER CAPTURE SYSTEMS */}
      <div className="border border-zinc-900 bg-zinc-950/60 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold tracking-widest uppercase mb-1">
            <ShieldCheck size={14} /> Operational Command Node
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">LAKESHORE SYSTEM CONTROL</h1>
        </div>
        <button 
          onClick={fetchAdminData} 
          disabled={loading}
          className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* FEEDBACK POPUP LOGS */}
      {statusMessage.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
          statusMessage.type === 'error' 
            ? 'bg-red-950/20 border-red-500/30 text-red-400' 
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
        }`}>
          {statusMessage.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SYSTEM METRICS COUNTER BLOCKS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-xs font-bold tracking-wider">TOTAL WORKSPACE USERS</span>
            <Users size={16} className="text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
        </div>
        <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-xs font-bold tracking-wider">ACTIVE BOOKINGS MAP</span>
            <Ticket size={16} className="text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.totalBookings}</p>
        </div>
        <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-xs font-bold tracking-wider">DISBURSED PAYMENTS</span>
            <CreditCard size={16} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats.totalPayouts}</p>
        </div>
      </div>

      {/* MAIN REGISTRATIONS & MANAGEMENT DATABASE TABLE VIEW */}
      <div className="border border-zinc-900 bg-zinc-950/40 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-950/60">
          <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase">Live Passenger & Owner Profiles Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-900 text-zinc-500 bg-zinc-950/20 font-bold">
                <th className="p-4">USER ID REFERENCE</th>
                <th className="p-4">SYSTEM ROLE</th>
                <th className="p-4">DEPARTURE ROUTE VECTOR</th>
                <th className="p-4">MOBILE OPERATOR KEY</th>
                <th className="p-4 text-right">ACTION SYSTEM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-600 font-bold">SYNCHRONIZING SYSTEM DATA CHANNELS...</td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-600 font-bold">No registered core identities detected inside public tables.</td>
                </tr>
              ) : (
                registrations.map((account) => (
                  <tr key={account.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-zinc-500 tracking-tight">
                      {account.id.slice(0, 8)}...{account.id.slice(-6)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase ${
                        account.role === 'admin' 
                          ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                          : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      }`}>
                        {account.role || 'student'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 max-w-[180px] truncate">
                      {account.departing_center || <span className="text-zinc-700 italic">No Active Trip Reservation</span>}
                    </td>
                    <td className="p-4 font-mono text-zinc-400">
                      {account.mobile_number ? (
                        <div className="flex flex-col">
                          <span>{account.mobile_number}</span>
                          <span className="text-[10px] text-zinc-600 truncate max-w-[120px]">{account.operator_ref_id}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-700">No Target Specified</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {account.role !== 'admin' && account.mobile_number ? (
                        <button
                          disabled={processingPayout !== null}
                          onClick={() => handleTriggerPayout(account)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-black font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 ml-auto transition-all active:scale-95 disabled:scale-100 disabled:text-zinc-600"
                        >
                          {processingPayout === account.id ? (
                            <span className="animate-pulse">ROUTING...</span>
                          ) : (
                            <>
                              Payout <ArrowUpRight size={12} />
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-zinc-700 text-[11px] italic pr-2">System Restricted</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
