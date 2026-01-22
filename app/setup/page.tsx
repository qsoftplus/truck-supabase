"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Truck as TruckIcon, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Truck, Driver } from "@/lib/types";

export default function SetupPage() {
    const [activeTab, setActiveTab] = useState<"trucks" | "drivers">("trucks");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Setup</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab("trucks")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "trucks"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                            }`}
                    >
                        <TruckIcon className="inline-block w-4 h-4 mr-2" />
                        Trucks
                    </button>
                    <button
                        onClick={() => setActiveTab("drivers")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "drivers"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                            }`}
                    >
                        <User className="inline-block w-4 h-4 mr-2" />
                        Drivers
                    </button>
                </div>
            </div>

            {activeTab === "trucks" ? <TrucksManager /> : <DriversManager />}
        </div>
    );
}

function TrucksManager() {
    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrucks();
    }, []);

    async function fetchTrucks() {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('trucks').select('*').order('truck_no');
            if (error) throw error;
            setTrucks(data || []);
        } catch (error: any) {
            console.error('Error fetching trucks:', JSON.stringify(error, null, 2));
            alert(`Failed to load trucks. Please ensure you have run the schema.sql in Supabase.\nDetails: ${error.message || JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    }

    async function addTruck() {
        const truckNo = window.prompt("Enter Truck Number:");
        if (!truckNo) return;

        const { data, error } = await supabase.from('trucks').insert([{ truck_no: truckNo, fc_expiry: null, insurance_expiry: null, np_expiry: null }]).select();
        if (error) {
            alert('Error adding truck: ' + error.message);
        } else if (data) {
            setTrucks([...trucks, data[0]]);
        }
    }

    async function updateTruck(id: string, field: keyof Truck, value: string) {
        const { error } = await supabase.from('trucks').update({ [field]: value }).eq('id', id);
        if (error) {
            console.error('Update failed:', error);
            return;
        }
        setTrucks(trucks.map(t => t.id === id ? { ...t, [field]: value } : t));
    }

    async function deleteTruck(id: string) {
        if (!confirm("Are you sure?")) return;
        const { error } = await supabase.from('trucks').delete().eq('id', id);
        if (error) {
            console.error('Delete failed:', error);
            return;
        }
        setTrucks(trucks.filter(t => t.id !== id));
    }

    if (loading) return <div>Loading trucks...</div>;

    return (
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold leading-6 text-slate-900">Truck Details</h2>
                    <button
                        onClick={addTruck}
                        className="flex items-center gap-x-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" />
                        Add Truck
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-300">
                        <thead>
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Truck No</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">FC Expiry</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Insurance</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">NP Expiry</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                    <span className="sr-only">Edit</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {trucks.map((truck) => (
                                <tr key={truck.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            value={truck.truck_no}
                                            onChange={(e) => updateTruck(truck.id, 'truck_no', e.target.value)}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                        <input type="date"
                                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            value={truck.fc_expiry || ''}
                                            onChange={(e) => updateTruck(truck.id, 'fc_expiry', e.target.value)}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                        <input type="date"
                                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            value={truck.insurance_expiry || ''}
                                            onChange={(e) => updateTruck(truck.id, 'insurance_expiry', e.target.value)}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                        <input type="date"
                                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            value={truck.np_expiry || ''}
                                            onChange={(e) => updateTruck(truck.id, 'np_expiry', e.target.value)}
                                        />
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                        <button onClick={() => deleteTruck(truck.id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function DriversManager() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDrivers();
    }, []);

    async function fetchDrivers() {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('drivers').select('*').order('name');
            if (error) throw error;
            setDrivers(data || []);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    }

    async function addDriver() {
        const { data, error } = await supabase.from('drivers').insert([{ name: 'New Driver' }]).select();
        if (error) {
            alert('Error adding driver: ' + error.message);
        } else if (data) {
            setDrivers([...drivers, data[0]]);
        }
    }

    async function updateDriver(id: string, field: keyof Driver, value: string) {
        const { error } = await supabase.from('drivers').update({ [field]: value }).eq('id', id);
        if (error) {
            console.error('Update failed:', error);
            return;
        }
        setDrivers(drivers.map(d => d.id === id ? { ...d, [field]: value } : d));
    }

    async function deleteDriver(id: string) {
        if (!confirm("Are you sure?")) return;
        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (error) {
            console.error('Delete failed:', error);
            return;
        }
        setDrivers(drivers.filter(d => d.id !== id));
    }

    if (loading) return <div>Loading drivers...</div>;

    return (
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl md:col-span-2">
            <div className="px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold leading-6 text-slate-900">Driver Details</h2>
                    <button
                        onClick={addDriver}
                        className="flex items-center gap-x-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" />
                        Add Driver
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {drivers.map((driver) => (
                        <div key={driver.id} className="relative flex flex-col gap-4 rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                <label className="block text-sm font-medium leading-6 text-slate-900">Name</label>
                                <input type="text" className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    value={driver.name} onChange={(e) => updateDriver(driver.id, 'name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-slate-900">License No</label>
                                <input type="text" className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    value={driver.license_no || ''} onChange={(e) => updateDriver(driver.id, 'license_no', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-slate-900">Phone</label>
                                <input type="tel" className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    value={driver.phone || ''} onChange={(e) => updateDriver(driver.id, 'phone', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium leading-6 text-slate-900">Aadhar No</label>
                                <input type="tel" className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    value={driver.aadhar_no || ''} onChange={(e) => updateDriver(driver.id, 'aadhar_no', e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button onClick={() => deleteDriver(driver.id)} className="text-red-600 hover:text-red-900 p-2">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
