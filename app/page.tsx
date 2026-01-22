"use client";

import { useEffect, useState } from "react";
import { Truck, Wallet, FileText, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [stats, setStats] = useState([
    { name: 'Total Revenue', stat: '₹0', icon: Wallet, color: 'bg-emerald-500' },
    { name: 'Active Trips', stat: '0', icon: Truck, color: 'bg-indigo-500' },
    { name: 'Pending Payments', stat: '₹0', icon: AlertCircle, color: 'bg-amber-500' },
    { name: 'Total Expenses', stat: '₹0', icon: FileText, color: 'bg-red-500' },
  ]);

  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Revenue & Pending (from Loads)
        const { data: loads } = await supabase.from('loads').select('freight_amount, balance_amount');
        const revenue = loads?.reduce((sum, l) => sum + (Number(l.freight_amount) || 0), 0) || 0;
        const pending = loads?.reduce((sum, l) => sum + (Number(l.balance_amount) || 0), 0) || 0;

        // 2. Active Trips (from Trips)
        const { count: activeTripsCount } = await supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'ongoing');

        // 3. Expenses (Diesel + Other Expenses)
        // Trips Diesel
        const { data: tripsDiesel } = await supabase.from('trips').select('diesel_amount');
        const dieselTotal = tripsDiesel?.reduce((sum, t) => sum + (Number(t.diesel_amount) || 0), 0) || 0;

        // Other Expenses table
        const { data: otherExps } = await supabase.from('expenses').select('amount');
        const otherTotal = otherExps?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

        const totalExp = dieselTotal + otherTotal;

        setStats([
          { name: 'Total Revenue', stat: `₹${revenue.toLocaleString()}`, icon: Wallet, color: 'bg-emerald-500' },
          { name: 'Active Trips', stat: String(activeTripsCount || 0), icon: Truck, color: 'bg-indigo-500' },
          { name: 'Pending Payments', stat: `₹${pending.toLocaleString()}`, icon: AlertCircle, color: 'bg-amber-500' },
          { name: 'Total Expenses', stat: `₹${totalExp.toLocaleString()}`, icon: FileText, color: 'bg-red-500' },
        ]);

        // 4. Recent Trips
        const { data: recent } = await supabase
          .from('trips')
          .select('*, trucks(truck_no)')
          .order('start_date', { ascending: false })
          .limit(5);
        setRecentTrips(recent || []);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard
          </h2>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-2xl bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${item.color} bg-opacity-10`}>
                <item.icon className={`h-6 w-6 text-white`} aria-hidden="true" />
                {/* Note: Icon bg needs to be solid color typically, using parent text-white for icon might be invisible if bg-opacity-10 is used on light bg. 
                    Let's fix aggregation style: 
                */}
                <div className={`absolute inset-0 opacity-20 ${item.color.replace('bg-', '') === 'white' ? 'bg-slate-500' : ''}`}></div>
              </div>
              {/* Re-using exact structure from before but safer styling */}
              <div className={`absolute rounded-md p-3 ${item.color}`}>
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-slate-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1 sm:pb-7">
              <p className="text-2xl font-semibold text-slate-900">{loading ? '...' : item.stat}</p>
            </dd>
          </div>
        ))}
      </dl>

      {/* Quick Actions / Recent Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl p-6">
          <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/trip-sheet" className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-slate-50 transition-colors">
              <Plus className="h-8 w-8 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-slate-900">New Trip Sheet</span>
            </Link>
            <Link href="/setup" className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-slate-50 transition-colors">
              <TruckIcon className="h-8 w-8 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-slate-900">Add Truck</span>
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl p-6">
          <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">Recent Trips</h3>
          {recentTrips.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No trips recorded yet.</p>
          ) : (
            <ul role="list" className="divide-y divide-slate-100">
              {recentTrips.map((trip) => (
                <li key={trip.id} className="flex justify-between gap-x-6 py-5">
                  <div className="flex min-w-0 gap-x-4">
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-slate-900">
                        {trip.trucks?.truck_no || 'Unknown Truck'}
                      </p>
                      <p className="mt-1 truncate text-xs leading-5 text-slate-500">
                        Started {trip.start_date} • {trip.status}
                      </p>
                    </div>
                  </div>
                  <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                    {/* Approx income would require joining loads, simplifying for list */}
                    <p className="text-sm leading-6 text-slate-900 font-medium">
                      {trip.status === 'ongoing' ? 'Active' : 'Completed'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function TruckIcon(props: any) {
  return <Truck {...props} />
}
