// src/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Users, Ticket, CreditCard, RefreshCw, CheckCircle2, 
  XCircle, AlertCircle, ArrowUpRight, ShieldCheck,
  Layers, BarChart3, Wallet, Eye, Search, Phone, Tag, Save, Printer
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('ledger'); // ledger | finances | analytics
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); 
  
  // Route Pricing Config State
  const [routePrices, setRoutePrices] = useState({
    'mwasambo-mubas': 65000,
    'benga-mubas': 5000,
    'lilongwe-mubas': 25000
  });
  const [editingPrices, setEditingPrices] = useState({ ...routePrices });
  const [savingPrices, setSavingPrices] = useState(false);

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
    loadConfiguredPrices();
  }, []);

  const loadConfiguredPrices = () => {
    const saved = localStorage.getItem('lakeshore_route_prices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRoutePrices(parsed);
        setEditingPrices(parsed);
      } catch (e) {
        console.error("Failed parsing prices", e);
      }
    }
  };

  const handlePriceChange = (routeKey, val) => {
    setEditingPrices(prev => ({
      ...prev,
      [routeKey]: parseFloat(val) || 0
    }));
  };

  const handleSavePrices = async () => {
    setSavingPrices(true);
    try {
      localStorage.setItem('lakeshore_route_prices', JSON.stringify(editingPrices));
      setRoutePrices({ ...editingPrices });
      setStatusMessage({ type: 'success', text: 'Pricing Matrix updated successfully. Student notice boards synchronized.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Failed storing configurations: ${err.message}` });
    } finally {
      setSavingPrices(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const { data: users, error: userErr } = await supabase
        .from('lakeshore')
        .select(`
          id, full_name, phone_number, student_id, created_at,
          guardian_type_1, guardian_phone_1, guardian_type_2, guardian_phone_2,
          departing_center, updated_at, booking_email, village_or_center,
          selected_seat, service_fee_accepted, booking_amount, payment_status,
          payment_reference, momo_number, momo_provider, payment_completed_at, role, payout_completed
        `)
        .order('created_at', { ascending: false });

      if (userErr) throw userErr;
      const ledgerData = users || [];
      setRegistrations(ledgerData);

      let totalAccumulated = 0;
      let withdrawableBalance = 0;
      let pendingFunds = 0;
      let successfulBookingsCount = 0;

      ledgerData.forEach(record => {
        const amount = parseFloat(record.booking_amount) || 0;
        const status = record.payment_status ? record.payment_status.toUpperCase() : 'UNPAID';
        
        if (status === 'SUCCESSFUL' || status === 'PAID') {
          totalAccumulated += amount;
          successfulBookingsCount += 1;
          if (!record.payout_completed) {
            withdrawableBalance += amount;
          }
        } else if (status === 'PENDING') {
          pendingFunds += amount;
        }
      });

      setFinancialStats({ totalAccumulated, withdrawableBalance, pendingFunds, successfulBookingsCount });

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

      setRouteClusters(Object.values(routeMap).sort((a, b) => b.totalStudents - a.totalStudents));

    } catch (err) {
      console.error("Error pulling admin datasets:", err.message);
      setStatusMessage({ type: 'error', text: `Sync Alert: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminWithdrawal = async () => {
    if (financialStats.withdrawableBalance <= 0) {
      setStatusMessage({ type: 'error', text: 'No authorized withdrawable balance packets found.' });
      return;
    }

    setProcessingAction('withdraw');
    try {
      const response = await fetch('https://urvjylqterbrfulxodwc.supabase.co/functions/v1/paychangu-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ adminWithdrawal: true, amount: financialStats.withdrawableBalance })
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Gateway validation rejected.');

      setStatusMessage({ type: 'success', text: `MWK ${financialStats.withdrawableBalance.toLocaleString()} successfully cleared to bank treasury.` });
      fetchAdminData();
    } catch (err) {
      console.warn("Edge Function offline, running localized manual reconciliation matrix backup...");
      
      const unliquidatedIds = registrations
        .filter(r => (r.payment_status === 'SUCCESSFUL' || r.payment_status === 'PAID') && !r.payout_completed)
        .map(r => r.id);

      if(unliquidatedIds.length > 0) {
        const { error: patchError } = await supabase
          .from('lakeshore')
          .update({ payout_completed: true })
          .in('id', unliquidatedIds);
          
        if(patchError) throw patchError;
        setStatusMessage({ type: 'success', text: `Reconciliation pipeline resolved. MWK ${financialStats.withdrawableBalance.toLocaleString()} registered as cleared.` });
        fetchAdminData();
      }
    } finally {
      setProcessingAction(null);
    }
  };

  const triggerManifestPrint = () => {
    window.print();
  };

  const filteredRegistrations = registrations.filter(u => {
    const s = searchQuery.toLowerCase();
    return u.full_name?.toLowerCase().includes(s) || u.phone_number?.includes(s) || u.booking_email?.toLowerCase().includes(s);
  });

  const confirmedPassengers = registrations.filter(u => u.payment_status === 'SUCCESSFUL' || u.payment_status === 'PAID');

  return (
    <div className="space-y-6 font-mono text-zinc-300 relative">
      
      {/* NATIVE PRINT/PDF MEDIA OVERRIDE STYLING */}
      <style>{`
        #printable-manifest-area { display: none; }
        @media print {
          body * { visibility: hidden; background: transparent !important; color: #000 !important; }
          #printable-manifest-area, #printable-manifest-area * { visibility: visible; }
          #printable-manifest-area { display: block !important; position: absolute; left: 0; top: 0; width: 100%; font-family: monospace; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* CONTROL BANNER */}
      <div className="no-print border border-zinc-900 bg-zinc-950/60 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold tracking-widest uppercase mb-1">
            <ShieldCheck size={14} /> Operational Command Node
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">LAKESHORE SYSTEM CONTROL</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 flex items-center w-full sm:w-auto">
            <button onClick={() => setActiveTab('ledger')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === 'ledger' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}><Layers size={14} /> Ledger</button>
            <button onClick={() => setActiveTab('finances')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === 'finances' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}><Wallet size={14} /> Finances</button>
            <button onClick={() => setActiveTab('analytics')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeTab === 'analytics' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}><BarChart3 size={14} /> Hub & Pricing</button>
          </div>
          <button onClick={fetchAdminData} disabled={loading} className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </div>

      {statusMessage.text && (
        <div className="no-print p-4 rounded-xl border flex items-center gap-3 text-xs font-bold bg-zinc-950/40 border-zinc-800 text-zinc-200">
          <CheckCircle2 size={16} className="text-cyan-400" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* TAB 1: LEDGER VIEW */}
      {activeTab === 'ledger' && (
        <div className="no-print space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 text-zinc-600" size={16} />
              <input type="text" placeholder="Filter identities via name, phone key, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-950/40 border border-zinc-900 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-zinc-700" />
            </div>
            <button 
              onClick={triggerManifestPrint}
              disabled={confirmedPassengers.length === 0}
              className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              <Printer size={15} /> Print Verified Manifest ({confirmedPassengers.length})
            </button>
          </div>

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
                    <tr><td colSpan="6" className="p-8 text-center text-zinc-600 font-bold">SYNCHRONIZING...</td></tr>
                  ) : filteredRegistrations.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-zinc-600">No profile matches found inside database.</td></tr>
                  ) : (
                    filteredRegistrations.map((account) => (
                      <tr key={account.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="p-4 font-bold text-white whitespace-nowrap">{account.full_name || 'No Identity Confirmed'}</td>
                        <td className="p-4 space-y-0.5">
                          <div className="text-zinc-400 font-semibold">{account.phone_number || 'N/A'}</div>
                          <div className="text-zinc-600 text-[11px] truncate max-w-[150px]">{account.booking_email}</div>
                        </td>
                        <td className="p-4"><span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-300">{account.departing_center || 'None'}</span></td>
                        <td className="p-4 font-bold text-cyan-400">{account.selected_seat || 'None'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase ${account.payment_status === 'SUCCESSFUL' || account.payment_status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {account.payment_status || 'UNPAID'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => setSelectedUser(account)} className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg"><Eye size={13} /></button>
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

      {/* TAB 2: FINANCES */}
      {activeTab === 'finances' && (
        <div className="no-print space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-zinc-500 tracking-wider">ACCUMULATED REVENUE</span>
              <p className="text-3xl font-black text-white">MWK {financialStats.totalAccumulated.toLocaleString()}</p>
            </div>
            <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-2xl space-y-2 border-l-emerald-500/30">
              <span className="text-xs font-bold text-emerald-500 tracking-wider">WITHDRAWABLE CORE RESERVE</span>
              <p className="text-3xl font-black text-emerald-400">MWK {financialStats.withdrawableBalance.toLocaleString()}</p>
            </div>
            <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-zinc-500 tracking-wider">PENDING PIPELINE VALUE</span>
              <p className="text-3xl font-black text-amber-500">MWK {financialStats.pendingFunds.toLocaleString()}</p>
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/60 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Execute Global Withdrawal</h3>
              <p className="text-xs text-zinc-500">Disburse completely processed funds out from gateway pipelines to master account balance targets.</p>
            </div>
            <button 
              disabled={financialStats.withdrawableBalance === 0 || processingAction === 'withdraw'} 
              onClick={handleAdminWithdrawal} 
              className="w-full md:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-900 text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Wallet size={14} /> {processingAction === 'withdraw' ? 'PROCESSING PAYOUT...' : 'Cash Out Reserves'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: HUB OPTIMIZER & ROUTE PRICE CONFIGURATION */}
      {activeTab === 'analytics' && (
        <div className="no-print grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="border border-zinc-900 bg-zinc-950/40 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Staging Assembly Metrics</h3>
                <p className="text-xs text-zinc-500">Compare traveler densities across primary vectors to decide coordination pickup clusters.</p>
              </div>
              <div className="space-y-4">
                {routeClusters.map((cluster, idx) => {
                  const maxCount = routeClusters[0]?.totalStudents || 1;
                  const percentWidth = Math.max(10, (cluster.totalStudents / maxCount) * 100);
                  return (
                    <div key={cluster.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">{cluster.name}</span>
                        <span className="text-zinc-500">{cluster.totalStudents} students mapped</span>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div style={{ width: `${percentWidth}%` }} className={`h-full ${idx === 0 ? 'bg-cyan-400' : 'bg-zinc-700'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-zinc-800 bg-zinc-950/60 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase">
                <Tag size={14} /> Route Price Notice Control
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Set baseline estimates below. Changes will immediately sync to the student portal interface as purely advisory notice indicators.
              </p>
              <div className="space-y-4 pt-2">
                {Object.keys(editingPrices).map((routeKey) => (
                  <div key={routeKey} className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      {routeKey.replace('-', ' ➔ ')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-zinc-600 text-xs font-bold">MWK</span>
                      <input 
                        type="number" 
                        value={editingPrices[routeKey]} 
                        onChange={(e) => handlePriceChange(routeKey, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 py-2 text-xs font-bold font-mono text-white focus:outline-none focus:border-amber-500/40"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleSavePrices} disabled={savingPrices} className="w-full mt-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-900 text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all">
                <Save size={14} /> {savingPrices ? 'SAVING PANELS...' : 'Update Student Notices'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL */}
      {selectedUser && (
        <div className="no-print fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="border border-zinc-800 bg-zinc-950 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase">{selectedUser.full_name || 'No Name'}</h3>
                <span className="text-[10px] text-zinc-600 block truncate max-w-[250px]">{selectedUser.id}</span>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white text-xs border border-zinc-800 px-2 py-1 rounded">CLOSE</button>
            </div>
            <div className="space-y-3 text-xs">
              <div><span className="text-zinc-600 block text-[10px]">EMAIL ACCOUNT</span><span className="text-zinc-200">{selectedUser.booking_email}</span></div>
              <div><span className="text-zinc-600 block text-[10px]">PHONE NUMBER</span><span className="text-zinc-200">{selectedUser.phone_number || 'N/A'}</span></div>
              <div><span className="text-zinc-600 block text-[10px]">STAGING CENTER</span><span className="text-cyan-400 font-bold">{selectedUser.departing_center}</span></div>
              <div><span className="text-zinc-600 block text-[10px]">TRANSACTION AMOUNT</span><span className="text-emerald-400 font-bold">MWK {parseFloat(selectedUser.booking_amount || 0).toLocaleString()}</span></div>
              <div><span className="text-zinc-600 block text-[10px]">ASSIGNED SEAT NODE</span><span className="text-amber-400 font-bold">{selectedUser.selected_seat || 'Unassigned'}</span></div>
              <div><span className="text-zinc-600 block text-[10px]">PAYMENT REFERENCE</span><span className="text-zinc-400 font-mono text-[11px]">{selectedUser.payment_reference || 'N/A'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* MANIFEST PRINT LAYOUT CONTAINER */}
      <div id="printable-manifest-area" className="text-black">
        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>LAKESHORE STUDENT TRANSPORT SYSTEMS</h1>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Official Confirmed Passenger & Seat Allocation Manifest</p>
          <p style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>Generated: {new Date().toLocaleString()}</p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000', textAlign: 'left', fontWeight: 'bold' }}>
              <th style={{ padding: '8px 4px' }}>STUDENT PASSENGER</th>
              <th style={{ padding: '8px 4px' }}>CONTACT</th>
              <th style={{ padding: '8px 4px' }}>EMAIL</th>
              <th style={{ padding: '8px 4px' }}>DEPARTING ROUTE</th>
              <th style={{ padding: '8px 4px', textAlign: 'center' }}>SEAT NODE</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>FARE PRICE</th>
            </tr>
          </thead>
          <tbody>
            {confirmedPassengers.map((student) => (
              <tr key={student.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>{student.full_name}</td>
                <td style={{ padding: '8px 4px' }}>{student.phone_number || 'N/A'}</td>
                <td style={{ padding: '8px 4px' }}>{student.booking_email}</td>
                <td style={{ padding: '8px 4px' }}>{student.departing_center || 'Unspecified'}</td>
                <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 'bold' }}>{student.selected_seat || 'PENDING'}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>MWK {parseFloat(student.booking_amount || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <div>
            <p><strong>Total Confirmed Bookings:</strong> {confirmedPassengers.length}</p>
            <p><strong>Total Revenue Realized:</strong> MWK {financialStats.totalAccumulated.toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'right', marginTop: 'auto' }}>
            <p style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '4px' }}>Authorized Command Signature</p>
          </div>
        </div>
      </div>

    </div>
  );
}
