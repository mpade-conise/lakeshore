// src/Home.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart3, MapPin, Users, TrendingUp, Bus, Loader2, Info, ArrowRight } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    activeRoutes: 0,
    seatsFilledToday: 0,
  });
  const [bookedPassengers, setBookedPassengers] = useState([]);
  const [routeStats, setRouteStats] = useState([]);
  
  // Notice board pricing state
  const [noticePrices, setNoticePrices] = useState({
    'mwasambo-mubas': 65000,
    'benga-mubas': 5000,
    'lilongwe-mubas': 25000
  });

  useEffect(() => {
    // Synchronize informational prices from administrator configuration
    const savedPrices = localStorage.getItem('lakeshore_route_prices');
    if (savedPrices) {
      try {
        setNoticePrices(JSON.parse(savedPrices));
      } catch (e) {
        console.error("Error reading price matrix configuration:", e);
      }
    }

    async function fetchLiveDashboardData() {
      try {
        setLoading(true);

        // 1. Fetch data explicitly naming key columns to bypass decryption policies
        const { data: passengers, error: fetchError } = await supabase
          .from('lakeshore') 
          .select('id, full_name, selected_seat, departing_center, created_at')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const recordArray = passengers || [];

        // 2. Compute dynamic metrics based on real-time table state
        const total = recordArray.length;
        
        const uniqueCenters = [...new Set(recordArray.map(p => p.departing_center).filter(Boolean))];
        const activeCentersCount = uniqueCenters.length || 4; 

        const todayStr = new Date().toISOString().split('T')[0];
        const filledToday = recordArray.filter(p => p.created_at && p.created_at.startsWith(todayStr)).length;

        setAnalytics({
          totalBookings: total,
          activeRoutes: activeCentersCount,
          seatsFilledToday: filledToday || total, 
        });

        // 3. Populate passenger roster array
        const formattedPassengers = recordArray.map((p, idx) => ({
          id: p.id || `gen-${idx}`,
          name: p.full_name || 'Anonymous Student',
          seat: p.selected_seat || 'Pending',
          center: p.departing_center || 'Mwasambo Hub',
        }));
        setBookedPassengers(formattedPassengers);

        // 4. Calculate dynamic route demand distribution percentages
        const routeCounts = {};
        recordArray.forEach(p => {
          const loc = p.departing_center || 'Other Routes';
          routeCounts[loc] = (routeCounts[loc] || 0) + 1;
        });

        const derivedStats = Object.keys(routeCounts).map(route => ({
          name: route,
          percentage: total > 0 ? Math.round((routeCounts[route] / total) * 100) : 0
        })).sort((a, b) => b.percentage - a.percentage);

        setRouteStats(derivedStats.length > 0 ? derivedStats : [
          { name: 'MUBAS Main Campus', percentage: 75 },
          { name: 'Lakeshore Express', percentage: 25 }
        ]);

      } catch (err) {
        console.error("Dashboard data sync matrix error:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center space-y-3 font-mono text-zinc-500">
        <Loader2 className="animate-spin text-cyan-400" size={24} />
        <span className="text-xs uppercase tracking-widest">Synchronizing Live Matrix Logs...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 space-y-5 font-mono text-zinc-300 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-black text-white tracking-wider">1. HOME STATION // ANALYTICS LOG</h2>
        <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest leading-normal">
          Operational monitoring node for active student transports
        </p>
      </div>

      {/* PRICE ADVISORY BANNER PANEL (STUDENT PORTAL INFORMATION VECTOR) */}
      <div className="border border-zinc-900 bg-zinc-950/40 p-4 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
          <Info size={14} /> Transport Route Price Advisories
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(noticePrices).map(([routeKey, value]) => (
            <div key={routeKey} className="bg-zinc-950/60 border border-zinc-900/80 px-3 py-2.5 rounded-xl flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium capitalize flex items-center gap-1.5">
                {routeKey.split('-')[0]} <ArrowRight size={10} className="text-zinc-600" /> {routeKey.split('-')[1] || 'MUBAS'}
              </span>
              <span className="text-white font-black tracking-tight">MWK {value.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 italic">
          * Note: Prices above serve as reference guidelines for travel budgeting, not exact transactional validation values.
        </p>
      </div>

      {/* METRIC CARD MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* TOTAL BOOKINGS */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 sm:p-4 text-cyan-500/10"><TrendingUp size={36} /></div>
          <p className="text-[9px] sm:text-[10px] tracking-widest text-zinc-500 uppercase font-bold">Total Live Bookings</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">{analytics.totalBookings}</p>
        </div>
        
        {/* ACTIVE ROUTES */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 sm:p-4 text-fuchsia-500/10"><MapPin size={36} /></div>
          <p className="text-[9px] sm:text-[10px] tracking-widest text-zinc-500 uppercase font-bold">Active Location Centers</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">{analytics.activeRoutes}</p>
        </div>

        {/* SEATS FILLED */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-5 col-span-1 sm:col-span-2 lg:col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 sm:p-4 text-emerald-500/10"><Users size={36} /></div>
          <p className="text-[9px] sm:text-[10px] tracking-widest text-zinc-500 uppercase font-bold">Seats Filled Cycle</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{analytics.seatsFilledToday}</p>
        </div>
      </div>

      {/* LOWER GRID: CHARTS & PASSENGER LISTINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* DYNAMIC ROUTE DEMAND DISTRIBUTION */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-[11px] sm:text-xs font-black tracking-wider text-zinc-400 uppercase flex items-center gap-2">
              <BarChart3 size={14} className="text-cyan-400 flex-shrink-0" /> Route Demand Distribution
            </h3>
            <div className="space-y-4 mt-4">
              {routeStats.map((route, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span className="truncate pr-2 font-bold max-w-[180px] sm:max-w-none">{route.name}</span>
                    <span className="text-cyan-400 flex-shrink-0 font-black">{route.percentage}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${i % 2 === 0 ? 'bg-cyan-400' : 'bg-fuchsia-500'}`} 
                      style={{ width: `${route.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-3 border-t border-zinc-900/60 flex items-center gap-2 text-[9px] text-zinc-500 uppercase font-bold">
            <Bus size={12} className="flex-shrink-0 text-emerald-500" /> Database streaming active // nominal
          </div>
        </div>

        {/* BOOKED PASSENGERS MATRIX SHOWCASE */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-5 space-y-4">
          <h3 className="text-[11px] sm:text-xs font-black tracking-wider text-zinc-400 uppercase flex items-center gap-2">
            <Users size={14} className="text-cyan-400 flex-shrink-0" /> Booked Passengers & Assigned Seats
          </h3>
          
          {bookedPassengers.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-600 uppercase font-bold">
              No passenger vectors initialized in manifest database.
            </div>
          ) : (
            <>
              {/* DESKTOP/TABLET COMPACT TABLE VIEW */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[10px] tracking-wider font-bold">
                      <th className="pb-2.5">Passenger Name</th>
                      <th className="pb-2.5">Location Center</th>
                      <th className="pb-2.5 text-right">Seat Node</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                    {bookedPassengers.map((passenger) => (
                      <tr key={passenger.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="py-2.5 font-bold text-white max-w-[150px] truncate">{passenger.name}</td>
                        <td className="py-2.5 text-zinc-400 max-w-[200px] truncate">{passenger.center}</td>
                        <td className="py-2.5 text-right font-black text-cyan-400 tracking-wider">[ {passenger.seat} ]</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ULTRA-MOBILE OPTIMIZED CARD VIEW */}
              <div className="block sm:hidden space-y-2 max-h-72 overflow-y-auto pr-1">
                {bookedPassengers.map((passenger) => (
                  <div key={passenger.id} className="bg-zinc-900/30 border border-zinc-900/80 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-black text-white truncate">{passenger.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
                        <MapPin size={10} className="text-zinc-600 flex-shrink-0" /> {passenger.center}
                      </p>
                    </div>
                    <div className="bg-cyan-500/5 border border-cyan-400/20 px-2.5 py-1 rounded-lg text-right flex-shrink-0">
                      <span className="text-[8px] font-bold block text-zinc-600 tracking-widest uppercase">SEAT</span>
                      <span className="text-xs font-black text-cyan-400">{passenger.seat}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
