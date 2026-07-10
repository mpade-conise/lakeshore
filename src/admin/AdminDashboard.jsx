// src/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Users, Ticket, CreditCard, RefreshCw, CheckCircle2, 
  XCircle, AlertCircle, ArrowUpRight, ShieldCheck,
  Layers, BarChart3, Wallet, Eye, Search, Phone
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('ledger'); // ledger | finances | analytics
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // Deep inspection modal state
  
  // Advanced state structures
  const [financialStats, setFinancialStats] = useState({
    totalAccumulated: 0,
    withdrawableBalance: 0,
    pendingFunds: 0,
    successfulBookingsCount: 0
  });
  const [routeClusters, setRouteClusters] = useState([]);
  
  const [processingAction, setProcessingAction] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      // 1. Core Data Retrieval from Lakeshore table
      const { data: users, error: userErr } = await supabase
        .from('lakeshore')
        .select('*')
        .order('created_at', { ascending: false });

      if (userErr) throw userErr;
      const ledgerData = users || [];
      setRegistrations(ledgerData);

      // 2. Financial Logic Pipeline using actual schema values
      let totalAccumulated = 0;
      let withdrawableBalance = 0;
      let pendingFunds = 0;
      let successfulBookingsCount = 0;

      ledgerData.forEach(record => {
        const amount = parseFloat(record.booking_amount) || 0;
        
        // Count overall revenue allocations based on real payment statuses
        if (record.payment_status === 'SUCCESSFUL' || record.payment_status === 'PAID') {
          totalAccumulated += amount;
          successfulBookingsCount += 1;
          
          // If payout_completed is not flagged yet, admin can pull it out
          if (!record.payout_completed) {
            withdrawableBalance += amount;
          }
        } else if (record.payment_status === 'PENDING') {
          pendingFunds += amount;
        }
      });

      setFinancialStats({
        totalAccumulated,
        withdrawableBalance,
        pendingFunds,
        successfulBookingsCount
      });

      // 3. Smart Clustering Analytics Engine for easy transportation matching
      const routeMap = {};
      ledgerData.forEach(record => {
        if (record.departing_center) {
          const center = record.departing_center;
          if (!routeMap[center]) {
            routeMap[center] = { name: center, totalStudents: 0, revenueGenerated: 0 };
          }
          routeMap[center].totalStudents += 1;
          routeMap[center].revenueGenerated += (parseFloat(record.booking_amount) || 0);
        }
      });

      // Transform object map to sortable arrays for rendering
      const sortedClusters = Object.values(routeMap).sort((a, b) => b.totalStudents - a.totalStudents);
      setRouteClusters(sortedClusters);

    } catch (err) {
      console.error("Error pulling admin datasets:", err.message);
      setStatusMessage({ type: 'error', text: 'Failed to synchronize workspace analytics trees.' });
    } finally {
      setLoading(false);
    }
  };

  // Triggering global treasury cashout/withdrawal mechanisms 
  const handleAdminWithdrawal = async () => {
    if (financialStats.withdrawableBalance <= 0) {
      setStatusMessage({ type: 'error', text: 'No withdrawable balance packets available in safe reserves.' });
      return;
    }

    setProcessingAction('withdraw');
    try {
      // API call linking to your remote payment execution architecture
      const response = await fetch('https://urvjylqterbrfulxodwc.supabase.co/functions/v1/paychangu-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          adminWithdrawal: true,
          amount: financialStats.withdrawableBalance
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Withdrawal rejected by gateway');

      setStatusMessage({ 
        type: 'success', 
        text: `Successfully routed MWK ${financialStats.withdrawableBalance.toLocaleString()} to your corporate master wallet.` 
      });

      // Update structural rows locally
      await supabase
        .from('lakeshore')
        .update({ payout_completed: true })
        .eq('payment_status', 'SUCCESSFUL');

      fetchAdminData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Treasury Fault: ${err.message}` });
    } finally {
      setProcessingAction(null);
    }
  };

  // Filtered dataset ledger mapping
  const filteredRegistrations = registrations.filter(u => {
    const searchString = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(searchString) ||
      u.phone_number?.includes(searchString) ||
      u.booking_email?.toLowerCase().includes(searchString) ||
      u.id?.includes(searchString)
    );
  });

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      
      {/* 1. TOP CAPTURE SYSTEMS BAR */}
      <div className="border border-zinc-900 bg-zinc-950/60 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold tracking-widest uppercase mb-1">
            <ShieldCheck size={14} /> System Core Level: Master Root
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">LAKESHORE SYSTEM CONTROL</h1>
        </div>

        {/* CONTROLS BAR */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* TAB SWAP CONTROLLERS */}
          <div className="bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 flex items-center w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('ledger')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === 'ledger' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Layers size={14} /> Ledger
            </button>
            <button 
              onClick={() => setActiveTab('finances')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === 'finances' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Wallet size={14} /> Finances
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === 'analytics' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <BarChart3 size={14} /> Hub Optimizer
            </button>
          </div>

          <button 
            onClick={fetchAdminData} 
            disabled={loading}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUS LOGS */}
      {statusMessage.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
          statusMessage.type === 'error' ? 'bg-red-950/20 border-red-500/30 text-red-400' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
        }`}>
          {statusMessage.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ======================= TAB 1: LEDGER VIEW ======================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Live Search Node Filter */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-3.5 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="Search by full name, telephone key, email account..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/40 border border-zinc-900 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-zinc-700 font-mono placeholder:text-zinc-600 text-white"
            />
          </div>

          {/* TABLE SYSTEM GRID */}
          <div className="border border-zinc-900 bg-zinc-950/40 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 bg-zinc-950/20 font-bold">
                    <th className="p-4">PASSENGER NAME</th>
                    <th className="p-4">CONTACT CHANNELS</th>
                    <th className="p-4">HUB ROUTE VECTOR</th>
                    <th className="p-4">SEAT</th>
                    <th className="p-4">PAY STATUS</th>
                    <th className="p-4 text-right">INSPECT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-zinc-600 font-bold">SYNCHRONIZING SYSTEM DATA CHANNELS...</td>
                    </tr>
                  ) : filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-zinc-600">No profile signatures found matching the search criteria.</td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((account) => (
                      <tr key={account.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="p-4 font-bold text-white whitespace-nowrap">
                          {account.full_name || <span className="text-zinc-700 italic">No Identity Confirmed</span>}
                          {account.role === 'admin' && <span className="ml-2 px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-black rounded border border-red-500/20">ADMIN</span>}
                        </td>
                        <td className="p-4 space-y-0.5">
                          <div className="text-zinc-400 font-semibold">{account.phone_number || 'N/A'}</div>
                          <div className="text-zinc-600 text-[11px] max-w-[150px] truncate">{account.booking_email}</div>
                        </td>
                        <td className="p-4">
                          {account.departing_center ? (
                            <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-300 font-semibold">{account.departing_center}</span>
                          ) : (
                            <span className="text-zinc-700 italic">No Active Booking</span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-cyan-400">{account.selected_seat || 'None'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase ${
                            account.payment_status === 'SUCCESSFUL' || account.payment_status === 'PAID'
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                              : account.payment_status === 'PENDING' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-zinc-900 text-zinc-500'
                          }`}>
                            {account.payment_status || 'UNPAID'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setSelectedUser(account)}
                            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: FINANCES ======================= */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          {/* VAULT COUNTER SYSTEM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-zinc-500 tracking-wider">ACCUMULATED REVENUE (PAID)</span>
              <p className="text-3xl font-black text-white">MWK {financialStats.totalAccumulated.toLocaleString()}</p>
              <div className="text-[10px] text-zinc-600">Generated from {financialStats.successfulBookingsCount} successful trips</div>
            </div>
            <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-2xl space-y-2 border-l-emerald-500/30">
              <span className="text-xs font-bold text-emerald-500 tracking-wider">WITHDRAWABLE CORE RESERVE</span>
              <p className="text-3xl font-black text-emerald-400">MWK {financialStats.withdrawableBalance.toLocaleString()}</p>
              <div className="text-[10px] text-zinc-500">Unclaimed finalized settlement pools</div>
            </div>
            <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-zinc-500 tracking-wider">PENDING PIPELINE VALUE</span>
              <p className="text-3xl font-black text-amber-500">MWK {financialStats.pendingFunds.toLocaleString()}</p>
              <div className="text-[10px] text-zinc-600">Awaiting PayChangu provider callback loops</div>
            </div>
          </div>

          {/* LIQUIDITY ACTIONS */}
          <div className="border border-zinc-900 bg-zinc-950/60 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Trigger Settlement Pipeline</h3>
              <p className="text-xs text-zinc-500 max-w-xl">Disburse all currently accumulated withdrawable reserves into your configured primary banking or mobile money operator system node.</p>
            </div>
            <button
              disabled={processingAction === 'withdraw' || financialStats.withdrawableBalance === 0}
              onClick={handleAdminWithdrawal}
              className="w-full md:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-900 text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:scale-100 disabled:text-zinc-600 border border-transparent disabled:border-zinc-800"
            >
              {processingAction === 'withdraw' ? (
                <span className="animate-pulse">PROCESSING WITHDRAWAL...</span>
              ) : (
                <>
                  Execute Cash Out <ArrowUpRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: HUB OPTIMIZER CHART ======================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="border border-zinc-900 bg-zinc-950/40 p-6 rounded-2xl space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Departure Center Density Index</h3>
            <p className="text-xs text-zinc-500">Use this live data framework to identify which staging terminals contain the highest density of students to coordinate optimized group transit paths.</p>
          </div>

          {routeClusters.length === 0 ? (
            <div className="border border-zinc-900 bg-zinc-950/20 p-12 text-center rounded-2xl text-zinc-600">
              No geographical metrics mapped yet. Awaiting passenger center booking inputs.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* VIRTUALIZED GRAPH TRACKS */}
              <div className="border border-zinc-900 bg-zinc-950/40 p-6 rounded-2xl space-y-5">
                <h4 className="text-xs font-black text-zinc-400 tracking-widest uppercase">Student Density Graph</h4>
                <div className="space-y-4">
                  {routeClusters.map((cluster, idx) => {
                    // Calculate basic percentage bar size relative to most crowded terminal
                    const maxCount = routeClusters[0]?.totalStudents || 1;
                    const percentWidth = Math.max(8, (cluster.totalStudents / maxCount) * 100);

                    return (
                      <div key={cluster.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{cluster.name}</span>
                          <span className="text-zinc-500 text-[11px] font-semibold">{cluster.totalStudents} passengers bound</span>
                        </div>
                        <div className="h-2.5 bg-zinc-900 border border-zinc-800/60 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${percentWidth}%` }}
                            className={`h-full transition-all duration-500 ${
                              idx === 0 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]' : idx === 1 ? 'bg-purple-400' : 'bg-zinc-700'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ROUTE SUMMARY MATRIX */}
              <div className="border border-zinc-900 bg-zinc-950/40 p-6 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-zinc-400 tracking-widest uppercase">Optimal Logistics Breakdown</h4>
                <div className="divide-y divide-zinc-900">
                  {routeClusters.map((cluster, i) => (
                    <div key={cluster.name} className="py-3 flex justify-between items-center text-xs first:pt-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="text-zinc-600 text-[10px]">#{i+1}</span> {cluster.name}
                        </div>
                        <div className="text-[11px] text-zinc-500">Revenue Gathered: MWK {cluster.revenueGenerated.toLocaleString()}</div>
                      </div>
                      
                      {i === 0 ? (
                        <span className="px-2 py-0.5 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-black rounded-md">IDEAL PICKUP HUB</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-zinc-900 text-zinc-500 text-[10px] rounded-md font-semibold">Secondary Staging</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= GLOBAL POPUP INTERFERENCE LAYER: SPECIFIC USER INSPECTOR MODAL ======================= */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="border border-zinc-800 bg-zinc-950 w-full max-w-lg rounded-2xl p-6 relative font-mono space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Title Banner */}
            <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Passenger Data Signature</h3>
                <p className="text-[11px] text-zinc-600 font-mono tracking-tight">{selectedUser.id}</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-zinc-500 hover:text-white border border-zinc-900 bg-zinc-900/40 px-2 py-1 rounded-md text-[11px]"
              >
                CLOSE
              </button>
            </div>

            {/* Profile Variables Display Layout */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-zinc-600 text-[10px] font-bold block">FULL LEGAL NAME</span>
                <span className="text-white font-bold">{selectedUser.full_name || 'Not filled'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-600 text-[10px] font-bold block">STUDENT REGISTER ID</span>
                <span className="text-zinc-300">{selectedUser.student_id || 'None Entered'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-600 text-[10px] font-bold block">PRIMARY PHONE</span>
                <span className="text-zinc-300 flex items-center gap-1"><Phone size={12}/> {selectedUser.phone_number || 'N/A'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-600 text-[10px] font-bold block">BOOKING ACCOUNT EMAIL</span>
                <span className="text-zinc-300 block truncate">{selectedUser.booking_email || 'N/A'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-600 text-[10px] font-bold block">DEPARTING HUB / VILLAGE</span>
                <span className="text-cyan-400 font-bold">{selectedUser.departing_center || 'None'} / {selectedUser.village_or_center || 'None'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-600 text-[10px] font-bold block">ASSIGNED VEHICLE SEAT</span>
                <span className="text-purple-400 font-bold tracking-widest">{selectedUser.selected_seat || 'UNASSIGNED'}</span>
              </div>
            </div>

            {/* Guardian emergency contacts structure mapping */}
            <div className="border border-zinc-900 bg-zinc-950/80 p-3.5 rounded-xl space-y-2">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Emergency Guardian Grid</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-600 block text-[9px]">{selectedUser.guardian_type_1 || 'Guardian 1'}</span>
                  <span className="font-semibold text-zinc-300">{selectedUser.guardian_phone_1 || 'Unspecified'}</span>
                </div>
                <div>
                  <span className="text-zinc-600 block text-[9px]">{selectedUser.guardian_type_2 || 'Guardian 2'}</span>
                  <span className="font-semibold text-zinc-300">{selectedUser.guardian_phone_2 || 'Unspecified'}</span>
                </div>
              </div>
            </div>

            {/* Financial tracking footprint detail vectors */}
            <div className="border border-zinc-900 bg-zinc-950/80 p-3.5 rounded-xl space-y-3">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gateway Footprint Metrics</h4>
              <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                <div>
                  <span className="text-zinc-600 block text-[9px]">BILLING CASH TARGET</span>
                  <span className="font-semibold text-white">MWK {(parseFloat(selectedUser.booking_amount) || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-600 block text-[9px]">PAYMENT STATUS FLAG</span>
                  <span className="font-bold text-zinc-300">{selectedUser.payment_status || 'UNKNOWN'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-600 block text-[9px]">MOMO TRANSACTION PAYOUT PROVIDER KEY</span>
                  <span className="font-mono text-[10px] text-zinc-400 block truncate">{selectedUser.momo_provider || 'None'} : {selectedUser.momo_number || 'No MoMo logged'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-600 block text-[9px]">GATEWAY OPERATOR REFERENCE ID</span>
                  <span className="font-mono text-[10px] text-zinc-500 block truncate">{selectedUser.payment_reference || 'No transaction proof linked'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
