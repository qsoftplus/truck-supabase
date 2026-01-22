"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Tyre, Truck } from "@/lib/types";

export default function TyreDetailsPage() {
    const [filters, setFilters] = useState({ truckId: "", start: "", end: "" });

    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [tyres, setTyres] = useState<Tyre[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.from('trucks').select('*').then(res => setTrucks(res.data || []));
    }, []);

    useEffect(() => {
        fetchTyres();
    }, [filters.truckId]); // Auto-fetch on truck change, or use filter button

    async function fetchTyres() {
        setLoading(true);
        let query = supabase.from('tyres').select('*').order('fitment_date', { ascending: false });

        if (filters.truckId) query = query.eq('truck_id', filters.truckId);
        if (filters.start) query = query.gte('fitment_date', filters.start);
        if (filters.end) query = query.lte('fitment_date', filters.end);

        const { data, error } = await query;
        if (error) console.error(error);
        else setTyres(data || []);
        setLoading(false);
    }

    const addTyre = async () => {
        if (!filters.truckId) {
            alert("Please select a truck context first");
            return;
        }
        const { data, error } = await supabase.from('tyres').insert([{
            truck_id: filters.truckId,
            make: "",
            price: 0,
            fitment_date: new Date().toISOString().split('T')[0],
            fitting_km: 0,
            removal_date: null,
            removal_km: 0,
            remarks: ""
        }]).select().single();

        if (data) setTyres([data, ...tyres]);
    };

    const updateTyre = async (id: string, field: keyof Tyre, value: any) => {
        // Optimistic
        setTyres(tyres.map(t => t.id === id ? { ...t, [field]: value } : t));

        // DB
        await supabase.from('tyres').update({ [field]: value }).eq('id', id);
    };

    const deleteTyre = async (id: string) => {
        if (!confirm("Delete this record?")) return;
        await supabase.from('tyres').delete().eq('id', id);
        setTyres(tyres.filter(t => t.id !== id));
    };

    const calculateStats = (t: Tyre) => {
        const runningKm = (t.removal_km || 0) - (t.fitting_km || 0);
        const epk = t.price > 0 && runningKm > 0 ? (runningKm / t.price).toFixed(2) : "0.00";
        return { runningKm: runningKm > 0 ? runningKm : 0, epk };
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tyre Details</h1>

            {/* Filter Section */}
            <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl p-6">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-4 items-end">
                    <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Truck No</label>
                        <select
                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={filters.truckId} onChange={e => setFilters({ ...filters, truckId: e.target.value })}
                        >
                            <option value="">Select Truck</option>
                            {trucks.map(t => <option key={t.id} value={t.id}>{t.truck_no}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Start Date</label>
                        <input type="date" className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={filters.start} onChange={e => setFilters({ ...filters, start: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">End Date</label>
                        <input type="date" className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={filters.end} onChange={e => setFilters({ ...filters, end: e.target.value })}
                        />
                    </div>
                    <div>
                        <button onClick={fetchTyres} className="w-full flex justify-center items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                            <Search className="h-4 w-4" /> Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold leading-6 text-slate-900">Tyre Logs</h2>
                    <button onClick={addTyre} className="flex items-center gap-x-1 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100">
                        <Plus className="h-4 w-4" /> Add Record
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-300">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3.5 pl-4 px-3 text-left text-sm font-semibold text-slate-900">Make / Price</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Fitting</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Removal</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Stats</th>
                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Remarks</th>
                                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {tyres.map((t) => {
                                const stats = calculateStats(t);
                                return (
                                    <tr key={t.id}>
                                        <td className="px-3 py-2">
                                            <div className="space-y-1">
                                                <input type="text" placeholder="Make" className="block w-full rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 text-xs"
                                                    value={t.make || ''} onChange={e => updateTyre(t.id, 'make', e.target.value)}
                                                />
                                                <input type="number" placeholder="Price" className="block w-full rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 text-xs"
                                                    value={t.price || 0} onChange={e => updateTyre(t.id, 'price', Number(e.target.value))}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="space-y-1">
                                                <input type="date" className="block w-full rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 text-xs"
                                                    value={t.fitment_date || ''} onChange={e => updateTyre(t.id, 'fitment_date', e.target.value)}
                                                />
                                                <input type="number" placeholder="Km" className="block w-full rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 text-xs"
                                                    value={t.fitting_km || 0} onChange={e => updateTyre(t.id, 'fitting_km', Number(e.target.value))}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="space-y-1">
                                                <input type="date" className="block w-full rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 text-xs"
                                                    value={t.removal_date || ''} onChange={e => updateTyre(t.id, 'removal_date', e.target.value)}
                                                />
                                                <input type="number" placeholder="Km" className="block w-full rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 text-xs"
                                                    value={t.removal_km || 0} onChange={e => updateTyre(t.id, 'removal_km', Number(e.target.value))}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-xs">
                                            <div className="font-medium text-slate-900">Run: {stats.runningKm} km</div>
                                            <div className="text-slate-500">Ratio: {stats.epk}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <textarea rows={2} className="block w-full rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 text-xs"
                                                value={t.remarks || ''} onChange={e => updateTyre(t.id, 'remarks', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button onClick={() => deleteTyre(t.id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
