"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Calendar, Save, Printer, Truck as TruckIcon, User as UserIcon, Fuel, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Truck, Driver } from "@/lib/types";
import { useRouter } from "next/navigation";

// Types matching DB interactions (simplified for UI state)
type Single = {
    id: string; // temporary ID for UI, removed before send
    loadingDate: string;
    from: string;
    to: string;
    transporter: string;
    freight: number;
    note: string;
};

type ExpenseItem = { title: string; amount: number };

export default function TripSheetPage() {
    const router = useRouter();

    // --- Data Loading ---
    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [driversList, setDriversList] = useState<Driver[]>([]);

    useEffect(() => {
        supabase.from('trucks').select('*').then(res => setTrucks(res.data || []));
        supabase.from('drivers').select('*').then(res => setDriversList(res.data || []));
    }, []);

    // --- State ---
    const [truckId, setTruckId] = useState("");
    const [truckWarning, setTruckWarning] = useState<string | null>(null);
    const [dates, setDates] = useState({ start: "", end: "" });
    const [selectedDrivers, setSelectedDrivers] = useState({ d1: "", d2: "" });

    const [odometer, setOdometer] = useState({ start: 0, end: 0 });
    const [diesel, setDiesel] = useState({ liters: 0, amount: 0 });

    const [singles, setSingles] = useState<Single[]>([
        { id: "1", loadingDate: "", from: "", to: "", transporter: "", freight: 0, note: "" }
    ]);

    const [fixedExpenses, setFixedExpenses] = useState({
        adBlue: { liters: 0, amount: 0 },
        salary: { percentage: 0, amount: 0 }, // If percentage > 0, amount is calc'd
        loading: 0,
        unloading: 0,
        rto: 0,
        fastag: 0,
    });

    const [billingExpenses, setBillingExpenses] = useState<ExpenseItem[]>([{ title: "", amount: 0 }]);
    const [otherExpenses, setOtherExpenses] = useState<ExpenseItem[]>([{ title: "", amount: 0 }]);
    const [saving, setSaving] = useState(false);

    // --- Check Active Trip on Selection ---
    useEffect(() => {
        if (!truckId) {
            setTruckWarning(null);
            return;
        }

        const checkActive = async () => {
            const { data } = await supabase
                .from('trips')
                .select('id')
                .eq('truck_id', truckId)
                .eq('status', 'ongoing');

            if (data && data.length > 0) {
                setTruckWarning("⚠️ Active Trip Found! Complete it before creating new.");
            } else {
                setTruckWarning(null);
            }
        };
        checkActive();
    }, [truckId]);

    // --- Calculations ---

    const totalFreight = useMemo(() => singles.reduce((acc, s) => acc + (Number(s.freight) || 0), 0), [singles]);

    // Salary Auto-calc
    const salaryAmount = useMemo(() => {
        if (fixedExpenses.salary.percentage > 0) {
            return totalFreight / fixedExpenses.salary.percentage;
        }
        return fixedExpenses.salary.amount;
    }, [totalFreight, fixedExpenses.salary]);

    const billingTotal = useMemo(() => billingExpenses.reduce((acc, i) => acc + (Number(i.amount) || 0), 0), [billingExpenses]);
    const otherTotal = useMemo(() => otherExpenses.reduce((acc, i) => acc + (Number(i.amount) || 0), 0), [otherExpenses]);

    const totalExpenses = useMemo(() => {
        return (
            (Number(diesel.amount) || 0) +
            (Number(fixedExpenses.adBlue.amount) || 0) +
            salaryAmount +
            (Number(fixedExpenses.loading) || 0) +
            (Number(fixedExpenses.unloading) || 0) +
            (Number(fixedExpenses.rto) || 0) +
            (Number(fixedExpenses.fastag) || 0) +
            billingTotal +
            otherTotal
        );
    }, [diesel.amount, fixedExpenses, salaryAmount, billingTotal, otherTotal]);

    const netProfit = totalFreight - totalExpenses;

    const mileage = useMemo(() => {
        const dist = odometer.end - odometer.start;
        if (dist > 0 && diesel.liters > 0) return (dist / diesel.liters).toFixed(2);
        return "0.00";
    }, [odometer, diesel.liters]);

    // --- Handlers ---

    const addSingle = () => {
        setSingles([...singles, { id: crypto.randomUUID(), loadingDate: "", from: "", to: "", transporter: "", freight: 0, note: "" }]);
    };

    const removeSingle = (id: string) => {
        if (singles.length > 1) setSingles(singles.filter(s => s.id !== id));
    };

    const updateSingle = (id: string, field: keyof Single, value: any) => {
        setSingles(singles.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const addBilling = () => setBillingExpenses([...billingExpenses, { title: "", amount: 0 }]);
    const removeBilling = (idx: number) => setBillingExpenses(billingExpenses.filter((_, i) => i !== idx));
    const updateBilling = (idx: number, field: keyof ExpenseItem, value: any) => {
        const newItems = [...billingExpenses];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setBillingExpenses(newItems);
    };

    const addOther = () => setOtherExpenses([...otherExpenses, { title: "", amount: 0 }]);
    const removeOther = (idx: number) => setOtherExpenses(otherExpenses.filter((_, i) => i !== idx));
    const updateOther = (idx: number, field: keyof ExpenseItem, value: any) => {
        const newItems = [...otherExpenses];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setOtherExpenses(newItems);
    };

    async function saveTrip() {
        const missing = [];
        if (!truckId) missing.push("Truck");
        if (!selectedDrivers.d1) missing.push("Driver 1");
        if (!dates.start) missing.push("Start Date");

        if (missing.length > 0) {
            alert(`Please fill in basic trip details: ${missing.join(", ")}`);
            return;
        }

        setSaving(true);
        try {
            // Check for existing active trip for this truck
            const { data: activeTrips, error: checkError } = await supabase
                .from('trips')
                .select('id')
                .eq('truck_id', truckId)
                .eq('status', 'ongoing');

            if (checkError) throw checkError;

            if (activeTrips && activeTrips.length > 0) {
                alert(`Selected vehicle currently has an active trip (Trip ID: ${activeTrips[0].id}). Please complete the previous trip before creating a new schedule.`);
                setSaving(false);
                return;
            }

            // 1. Create Trip
            const { data: tripData, error: tripError } = await supabase.from('trips').insert([{
                truck_id: truckId,
                driver1_id: selectedDrivers.d1,
                driver2_id: selectedDrivers.d2 || null, // handle empty string
                start_date: dates.start,
                end_date: dates.end || null,
                start_km: odometer.start,
                end_km: odometer.end,
                diesel_amount: diesel.amount,
                diesel_liters: diesel.liters,
                status: 'ongoing' // logic to determine if completed?
            }]).select().single();

            if (tripError) throw tripError;
            const tripId = tripData.id;

            // 2. Create Loads
            const loadsToInsert = singles.map(s => ({
                trip_id: tripId,
                loading_date: s.loadingDate || null,
                from_location: s.from,
                to_location: s.to,
                transporter: s.transporter,
                freight_amount: s.freight,
                note: s.note
            }));
            const { error: loadError } = await supabase.from('loads').insert(loadsToInsert);
            if (loadError) throw loadError;

            // 3. Create Expenses
            const expensesToInsert = [];

            // AdBlue
            if (fixedExpenses.adBlue.amount > 0) expensesToInsert.push({ trip_id: tripId, category: 'AdBlue', amount: fixedExpenses.adBlue.amount, liters: fixedExpenses.adBlue.liters });
            // Salary
            if (salaryAmount > 0) expensesToInsert.push({ trip_id: tripId, category: 'Salary', amount: salaryAmount, percentage: fixedExpenses.salary.percentage });
            // Fixed
            if (fixedExpenses.loading > 0) expensesToInsert.push({ trip_id: tripId, category: 'Loading', amount: fixedExpenses.loading });
            if (fixedExpenses.unloading > 0) expensesToInsert.push({ trip_id: tripId, category: 'Unloading', amount: fixedExpenses.unloading });
            if (fixedExpenses.rto > 0) expensesToInsert.push({ trip_id: tripId, category: 'RTO', amount: fixedExpenses.rto });
            if (fixedExpenses.fastag > 0) expensesToInsert.push({ trip_id: tripId, category: 'Fastag', amount: fixedExpenses.fastag });

            // Billing Lists
            billingExpenses.forEach(b => {
                if (b.amount > 0) expensesToInsert.push({ trip_id: tripId, category: 'Billing', title: b.title, amount: b.amount });
            });
            // Other Lists
            otherExpenses.forEach(o => {
                if (o.amount > 0) expensesToInsert.push({ trip_id: tripId, category: 'Other', title: o.title, amount: o.amount });
            });

            if (expensesToInsert.length > 0) {
                const { error: expError } = await supabase.from('expenses').insert(expensesToInsert);
                if (expError) throw expError;
            }

            alert("Trip saved successfully!");
            router.push('/'); // Go to dashboard

        } catch (err: any) {
            console.error("Error saving trip:", err);
            alert("Failed to save trip: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Trip Sheet</h1>
                    <p className="text-slate-500 mt-1">Manage new trip entries, expenses, and loadings.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all">
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </button>
                    <button
                        onClick={saveTrip}
                        disabled={saving}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 transition-all"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Trip'}
                    </button>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Basic Info & Specs */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Trip Details Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                            <TruckIcon className="text-indigo-600 h-5 w-5" />
                            <h2 className="text-lg font-bold text-slate-900">Trip Information</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Select Truck</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm text-slate-900"
                                    value={truckId} onChange={e => setTruckId(e.target.value)}
                                >
                                    <option value="">-- Select Truck --</option>
                                    {trucks.map(t => (
                                        <option key={t.id} value={t.id}>{t.truck_no}</option>
                                    ))}
                                </select>
                                {truckWarning && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                        <span className="text-xs font-bold text-red-600">{truckWarning}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Driver 1 (Main)</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm text-slate-900"
                                    value={selectedDrivers.d1} onChange={e => setSelectedDrivers({ ...selectedDrivers, d1: e.target.value })}
                                >
                                    <option value="">-- Select Driver --</option>
                                    {driversList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Start Date</label>
                                <input type="date" className="w-full rounded-lg border-slate-300 py-2.5 shadow-sm text-sm text-slate-900"
                                    value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">End Date</label>
                                <input type="date" className="w-full rounded-lg border-slate-300 py-2.5 shadow-sm text-sm text-slate-900"
                                    value={dates.end} onChange={e => setDates({ ...dates, end: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Driver 2 (Optional)</label>
                                <select
                                    className="w-full rounded-lg border-slate-300 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm text-slate-900"
                                    value={selectedDrivers.d2} onChange={e => setSelectedDrivers({ ...selectedDrivers, d2: e.target.value })}
                                >
                                    <option value="">-- Optional Second Driver --</option>
                                    {driversList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Loadings Table Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <div className="bg-indigo-100 p-1.5 rounded-md">
                                    <Plus className="h-4 w-4 text-indigo-700" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">Load Details</h2>
                            </div>
                            <button onClick={addSingle} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">
                                + Add Load
                            </button>
                        </div>
                        <div className="p-4 overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-50 rounded-lg">
                                    <tr>
                                        <th className="py-3 px-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider rounded-l-lg">Date</th>
                                        <th className="px-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">From</th>
                                        <th className="px-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">To</th>
                                        <th className="px-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Party</th>
                                        <th className="px-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Freight</th>
                                        <th className="px-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Note</th>
                                        <th className="px-3 rounded-r-lg"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {singles.map((single) => (
                                        <tr key={single.id} className="group hover:bg-slate-50/80 transition-colors">
                                            <td className="p-2">
                                                <input type="date" className="w-full rounded-md border-slate-200 py-1.5 text-xs focus:border-indigo-500 text-slate-900"
                                                    value={single.loadingDate} onChange={e => updateSingle(single.id, 'loadingDate', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input type="text" placeholder="Origin" className="w-full rounded-md border-slate-200 py-1.5 text-xs focus:border-indigo-500 text-slate-900"
                                                    value={single.from} onChange={e => updateSingle(single.id, 'from', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input type="text" placeholder="Dest" className="w-full rounded-md border-slate-200 py-1.5 text-xs focus:border-indigo-500 text-slate-900"
                                                    value={single.to} onChange={e => updateSingle(single.id, 'to', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input type="text" placeholder="Name" className="w-full rounded-md border-slate-200 py-1.5 text-xs focus:border-indigo-500 text-slate-900"
                                                    value={single.transporter} onChange={e => updateSingle(single.id, 'transporter', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" placeholder="0.00" className="w-24 rounded-md border-slate-200 py-1.5 text-xs focus:border-indigo-500 font-medium text-slate-900"
                                                    value={single.freight} onChange={e => updateSingle(single.id, 'freight', Number(e.target.value))}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input type="text" placeholder="Optional" className="w-full rounded-md border-slate-200 py-1.5 text-xs focus:border-indigo-500 text-slate-900"
                                                    value={single.note} onChange={e => updateSingle(single.id, 'note', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => removeSingle(single.id)} className="text-slate-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-1.5 rounded-full shadow-sm border border-slate-200">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 flex justify-end items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-sm font-medium text-slate-600">Total Freight Value:</span>
                                <span className="text-xl font-bold text-indigo-600">₹ {totalFreight.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Expenses & Summary */}
                <div className="space-y-8">

                    {/* Odometer & Fuel */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Fuel className="text-orange-500 h-5 w-5" />
                            <h3 className="font-bold text-slate-900">Running & Fuel</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Start Km</label>
                                    <input type="number" className="w-full mt-1 rounded-md border-slate-300 py-2 text-sm font-medium text-slate-900"
                                        value={odometer.start} onChange={e => setOdometer({ ...odometer, start: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">End Km</label>
                                    <input type="number" className="w-full mt-1 rounded-md border-slate-300 py-2 text-sm font-medium text-slate-900"
                                        value={odometer.end} onChange={e => setOdometer({ ...odometer, end: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-slate-700">Diesel</span>
                                    <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded border">fuel</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400">Total Amount (₹)</label>
                                        <input type="number" className="w-full rounded-md border-slate-200 py-1.5 text-sm text-slate-900"
                                            value={diesel.amount} onChange={e => setDiesel({ ...diesel, amount: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400">Total Litres</label>
                                        <input type="number" className="w-full rounded-md border-slate-200 py-1.5 text-sm text-slate-900"
                                            value={diesel.liters} onChange={e => setDiesel({ ...diesel, liters: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Mileage Stats */}
                            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                <span className="text-sm font-medium text-indigo-900">Calculated Mileage</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-indigo-600">{mileage}</span>
                                    <span className="text-xs text-indigo-400 font-semibold">Km/L</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expenses List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <IndianRupee className="text-red-500 h-5 w-5" />
                            <h3 className="font-bold text-slate-900">Trip Expenses</h3>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {/* Fixed Types */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-slate-500">AdBlue (Oil)</label>
                                        <div className="flex gap-2">
                                            <input type="number" placeholder="₹ Amount" className="w-full rounded-md border-slate-200 text-sm py-1.5 text-slate-900"
                                                value={fixedExpenses.adBlue.amount} onChange={e => setFixedExpenses({ ...fixedExpenses, adBlue: { ...fixedExpenses.adBlue, amount: Number(e.target.value) } })}
                                            />
                                            <input type="number" placeholder="Liters" className="w-20 rounded-md border-slate-200 text-sm py-1.5 bg-slate-50 text-slate-900"
                                                value={fixedExpenses.adBlue.liters} onChange={e => setFixedExpenses({ ...fixedExpenses, adBlue: { ...fixedExpenses.adBlue, liters: Number(e.target.value) } })}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-slate-500">Driver Salary</label>
                                        <div className="flex gap-2">
                                            <input type="number" placeholder="%" className="w-16 rounded-md border-slate-200 text-sm py-1.5 text-slate-900"
                                                title="Percentage"
                                                value={fixedExpenses.salary.percentage} onChange={e => setFixedExpenses({ ...fixedExpenses, salary: { ...fixedExpenses.salary, percentage: Number(e.target.value) } })}
                                            />
                                            <input type="number" className="w-full rounded-md border-slate-200 text-sm py-1.5 bg-slate-50 font-medium text-slate-700"
                                                title="Calculated Amount" readOnly
                                                value={salaryAmount}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="text-xs text-slate-400">Loading</label>
                                        <input type="number" className="w-full rounded-md border-slate-200 py-1.5 text-sm text-slate-900"
                                            value={fixedExpenses.loading} onChange={e => setFixedExpenses({ ...fixedExpenses, loading: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs text-slate-400">Unloading</label>
                                        <input type="number" className="w-full rounded-md border-slate-200 py-1.5 text-sm text-slate-900"
                                            value={fixedExpenses.unloading} onChange={e => setFixedExpenses({ ...fixedExpenses, unloading: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs text-slate-400">RTO / PC</label>
                                        <input type="number" className="w-full rounded-md border-slate-200 py-1.5 text-sm text-slate-900"
                                            value={fixedExpenses.rto} onChange={e => setFixedExpenses({ ...fixedExpenses, rto: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs text-slate-400">Fastag</label>
                                        <input type="number" className="w-full rounded-md border-slate-200 py-1.5 text-sm text-slate-900"
                                            value={fixedExpenses.fastag} onChange={e => setFixedExpenses({ ...fixedExpenses, fastag: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Types */}
                            <div className="border-t border-slate-100 pt-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Billing & Others</span>
                                    <div className="flex gap-2">
                                        <button onClick={addBilling} className="text-xs text-indigo-600 font-semibold">+ Bill</button>
                                        <button onClick={addOther} className="text-xs text-indigo-600 font-semibold">+ Other</button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {[...billingExpenses, ...otherExpenses].map((item, idx) => (
                                        /* A hacky combined view to simplify, better in real apps to separate arrays properly in UI or combine state */
                                        null
                                    ))}
                                    {/* Rendering Billing Separately for clarity */}
                                    {billingExpenses.map((bin, i) => (
                                        <div key={`b-${i}`} className="flex gap-2">
                                            <input placeholder="Billing Item" className="w-full rounded-md border-slate-200 py-1.5 text-xs text-slate-600"
                                                value={bin.title} onChange={e => updateBilling(i, 'title', e.target.value)}
                                            />
                                            <input type="number" placeholder="₹" className="w-20 rounded-md border-slate-200 py-1.5 text-xs font-semibold"
                                                value={bin.amount} onChange={e => updateBilling(i, 'amount', Number(e.target.value))}
                                            />
                                            <button onClick={() => removeBilling(i)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                    {otherExpenses.map((iex, i) => (
                                        <div key={`o-${i}`} className="flex gap-2">
                                            <input placeholder="Other Expense" className="w-full rounded-md border-slate-200 py-1.5 text-xs text-slate-600"
                                                value={iex.title} onChange={e => updateOther(i, 'title', e.target.value)}
                                            />
                                            <input type="number" placeholder="₹" className="w-20 rounded-md border-slate-200 py-1.5 text-xs font-semibold"
                                                value={iex.amount} onChange={e => updateOther(i, 'amount', Number(e.target.value))}
                                            />
                                            <button onClick={() => removeOther(i)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-200">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-slate-500">Total Expenses</span>
                                <span className="font-semibold text-slate-900">₹ {totalExpenses.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mb-3">
                                <span className="text-slate-500">Total Income</span>
                                <span className="font-semibold text-emerald-600">₹ {totalFreight.toFixed(2)}</span>
                            </div>
                            <div className={cn("p-3 rounded-lg flex justify-between items-center", netProfit >= 0 ? "bg-slate-900 text-white" : "bg-red-500 text-white")}>
                                <span className="font-medium text-sm opacity-90">Net Profit</span>
                                <span className="font-bold text-xl">₹ {netProfit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
