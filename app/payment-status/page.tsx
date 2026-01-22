"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Load, Truck, Trip } from "@/lib/types";

// Extended Load type for UI including joined courier
// Extended Load type for UI including joined courier
interface LoadWithDetails extends Omit<Load, 'courier_details'> {
    courier_details?: {
        id: string;
        load_id: string;
        received_date?: string;
        vendor?: string;
        delivery_date?: string;
    };
    trip?: Trip;
}

export default function PaymentStatusPage() {
    const [truckId, setTruckId] = useState("");
    const [tripDate, setTripDate] = useState("");

    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(false);

    const [singles, setSingles] = useState<LoadWithDetails[]>([]);

    useEffect(() => {
        supabase.from('trucks').select('*').then(res => setTrucks(res.data || []));
    }, []);

    // Fetch trips when truck is selected
    useEffect(() => {
        if (truckId) {
            supabase.from('trips').select('*').eq('truck_id', truckId).order('start_date', { ascending: false })
                .then(res => setTrips(res.data || []));
        } else {
            setTrips([]);
        }
    }, [truckId]);

    async function fetchDetails() {
        if (!truckId || !tripDate) return;
        setLoading(true);
        try {
            // Find the trip ID for the selected date (approximate logic, assuming unique start date per truck for dropdown)
            // In reality, might need to robustly select specific Trip ID.
            // Here tripDate is actually the trip ID from the value dropdown.
            const { data, error } = await supabase.from('loads')
                .select('*, courier_details(*)')
                .eq('trip_id', tripDate);

            if (error) throw error;
            setSingles(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function updateSingle(id: string, field: keyof Load, value: any) {
        // Optimistic update
        const oldSingles = [...singles];
        const updatedSingles = singles.map(s => {
            if (s.id !== id) return s;
            const updated = { ...s, [field]: value };
            // Logic for amounts
            if (field === 'pay_term') {
                if (value === 'To Pay') {
                    updated.advance_amount = updated.freight_amount;
                    updated.balance_amount = 0;
                } else {
                    updated.advance_amount = 0;
                    updated.balance_amount = updated.freight_amount;
                }
            }
            if (field === 'advance_amount' && updated.pay_term === 'Advance') {
                updated.balance_amount = updated.freight_amount - Number(value);
            }
            return updated;
        });
        setSingles(updatedSingles);

        // DB Update
        const target = updatedSingles.find(s => s.id === id);
        if (!target) return;

        const { error } = await supabase.from('loads').update({
            pay_term: target.pay_term,
            advance_amount: target.advance_amount,
            balance_amount: target.balance_amount,
        }).eq('id', id);

        if (error) {
            console.error("Update failed", error);
            setSingles(oldSingles); // Revert
        }
    };

    async function updateCourier(loadId: string, field: string, value: any) {
        const oldSingles = [...singles];
        const load = singles.find(s => s.id === loadId);
        if (!load) return;

        // Optimistic
        const updatedSingles = singles.map(s => {
            if (s.id !== loadId) return s;
            return {
                ...s,
                courier_details: { ...s.courier_details, [field]: value, id: s.courier_details?.id || 'temp', load_id: s.id }
            };
        });
        setSingles(updatedSingles);

        // Check if courier record exists
        if (load.courier_details?.id && load.courier_details.id !== 'temp') {
            // Update
            await supabase.from('courier_details').update({ [field]: value }).eq('id', load.courier_details.id);
        } else {
            // Insert new (upsert-ish, or just insert if we know it doesn't exist)
            // If we relied on eager creation, we'd update. 
            // Better: Upsert based on load_id if we have a unique constraint. We defined `load_id unique` in schema.
            const { data, error } = await supabase.from('courier_details').upsert({
                load_id: loadId,
                [field]: value
            }, { onConflict: 'load_id' }).select().single();

            if (data) {
                // Update local state with real ID
                setSingles(prev => prev.map(s => s.id === loadId ? { ...s, courier_details: data } : s));
            }
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Status</h1>

            {/* Filter Section */}
            <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl p-6">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3 items-end">
                    <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Truck No</label>
                        <select
                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={truckId} onChange={e => setTruckId(e.target.value)}
                        >
                            <option value="">Select Truck</option>
                            {trucks.map(t => <option key={t.id} value={t.id}>{t.truck_no}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium leading-6 text-slate-900">Trip Start Date</label>
                        <select
                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={tripDate} onChange={e => setTripDate(e.target.value)}
                        >
                            <option value="">Select Trip</option>
                            {trips.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.start_date} ({t.status})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <button
                            onClick={fetchDetails}
                            disabled={!truckId || !tripDate || loading}
                            className="w-full flex justify-center items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-slate-300"
                        >
                            <Search className="h-4 w-4" /> {loading ? 'Fetching...' : 'Fetch Details'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Table */}
            {singles.length > 0 && (
                <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold leading-6 text-slate-900">Load Payments</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-300">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="py-3.5 pl-4 px-3 text-left text-sm font-semibold text-slate-900">From / To</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Freight (₹)</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Pay Terms</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Amounts</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Courier Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {singles.map((single) => (
                                    <tr key={single.id} className="align-top">
                                        <td className="px-3 py-4 text-sm text-slate-500">
                                            <div className="font-medium text-slate-900">{single.from_location}</div>
                                            <div className="text-xs">to</div>
                                            <div className="font-medium text-slate-900">{single.to_location}</div>
                                        </td>
                                        <td className="px-3 py-4 text-sm font-semibold text-slate-900">
                                            ₹{single.freight_amount?.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-4">
                                            <select
                                                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                value={single.pay_term} onChange={e => updateSingle(single.id, 'pay_term', e.target.value)}
                                            >
                                                <option value="To Pay">To Pay</option>
                                                <option value="Advance">Advance</option>
                                            </select>
                                        </td>
                                        <td className="px-3 py-4 space-y-2">
                                            {single.pay_term === 'To Pay' ? (
                                                <div className="text-sm">
                                                    <div className="flex justify-between"><span className="text-slate-500">Full:</span> <span>₹{single.freight_amount}</span></div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="block text-xs text-slate-500">Advance</label>
                                                        <input type="number" className="block w-24 rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 sm:text-xs"
                                                            value={single.advance_amount} onChange={e => updateSingle(single.id, 'advance_amount', Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-slate-500">Balance</label>
                                                        <div className="text-sm font-semibold text-slate-900">₹{single.balance_amount}</div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="border-t border-slate-100 pt-1 mt-1 font-bold text-sm">
                                                Total: ₹{single.pay_term === 'To Pay' ? single.freight_amount : (single.advance_amount + single.balance_amount)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            {single.pay_term === 'Advance' && (
                                                <div className="space-y-2 text-sm">
                                                    <input type="date" className="block w-full rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 sm:text-xs"
                                                        placeholder="Received Date"
                                                        value={single.courier_details?.received_date || ''} onChange={e => updateCourier(single.id, "received_date", e.target.value)}
                                                    />
                                                    <input type="text" className="block w-full rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 sm:text-xs"
                                                        placeholder="Vendor"
                                                        value={single.courier_details?.vendor || ''} onChange={e => updateCourier(single.id, "vendor", e.target.value)}
                                                    />
                                                    <input type="date" className="block w-full rounded-md border-0 py-1 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 sm:text-xs"
                                                        placeholder="Delivery Date"
                                                        value={single.courier_details?.delivery_date || ''} onChange={e => updateCourier(single.id, "delivery_date", e.target.value)}
                                                    />
                                                </div>
                                            )}
                                            {single.pay_term === 'To Pay' && <span className="text-xs text-slate-400 italic">No courier details required</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
