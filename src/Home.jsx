// src/Home.jsx
import React, { useState } from 'react';
import { BarChart3, MapPin, Users, TrendingUp, Bus } from 'lucide-react';

export default function Home() {
  // Mock data representing the real-time student analytics metrics
  const [analytics] = useState({
    totalBookings: 148,
    activeRoutes: 4,
    seatsFilledToday: 32,
  });

  const [bookedPassengers] = useState([
    { id: '001', name: 'Patrick Chitambo', seat: 'A1', center: 'MUBAS Main Campus' },
    { id: '002', name: 'Chifundo Banda', seat: 'B3', center: 'Lakeshore Terminal' },
    { id: '003', name: 'Limikani Phiri', seat: 'A2', center: 'MUBAS Main Campus' },
    { id: '004', name: 'Tiwonge Chisale', seat: 'C1', center: 'Limbe Transit Hub' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl font-black text-white tracking-wider font-mono">1. HOME STATION // ANALYTICS LOG</h2>
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-1">
          Operational monitoring node for active student transports
        </p>
      </div>

      {/* METRIC CARD MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-cyan-500/10"><TrendingUp size={40} /></div>
          <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Total Weekly Bookings</p>
          <p className="text-2xl font-black text-white mt-1 font-mono">{analytics.totalBookings}</p>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-fuchsia-500/10"><MapPin size={40} /></div>
          <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Active Location Centers</p>
          <p className="text-2xl font-black text-white mt-1 font-mono">{analytics.activeRoutes}</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-emerald-500/10"><Users size={40} /></div>
          <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Seats Filled Today</p>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">{analytics.seatsFilledToday}</p>
        </div>
      </div>

      {/* LOWER GRID: CHARTS & PASSENGER LISTINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* REVENUE/TRAFFIC CHART SIMULATOR */}
        <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black tracking-wider text-zinc-400 uppercase font-mono flex items-center gap-2 mb-4">
              <BarChart3 size={14} className="text-cyan-400" /> Route Demand Chart
            </h3>
            <div className="space-y-3 mt-2">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                  <span>MUBAS Campus Route</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                  <span>Lakeshore Express</span>
                  <span>45%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-fuchsia-500 h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-900/60 mt-4 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
            <Bus size={12} /> System operational frequency nominal
          </div>
        </div>

        {/* BOOKED PASSENGERS & SEATS ROSTER */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
          <h3 className="text-xs font-black tracking-wider text-zinc-400 uppercase font-mono flex items-center gap-2 mb-4">
            <Users size={14} className="text-cyan-400" /> Booked Passengers & Assigned Seats
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[10px] tracking-wider">
                  <th className="pb-2 font-bold">Passenger Name</th>
                  <th className="pb-2 font-bold">Location Center</th>
                  <th className="pb-2 font-bold text-right">Seat Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                {bookedPassengers.map((passenger) => (
                  <tr key={passenger.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="py-2.5 font-bold text-white">{passenger.name}</td>
                    <td className="py-2.5 text-zinc-400">{passenger.center}</td>
                    <td className="py-2.5 text-right font-bold text-cyan-400">{passenger.seat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}