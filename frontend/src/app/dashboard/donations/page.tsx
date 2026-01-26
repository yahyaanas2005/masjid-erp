"use client";

import { useEffect, useState } from "react";
import { DollarSign, Download, Plus, Trash2, RefreshCw } from "lucide-react";
import { api } from "../../../api/client";

interface Donation {
    id: string;
    donor_name: string;
    amount: number;
    type: string;
    date: string;
    status: string;
}

export default function DonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ donor_name: "", amount: "", type: "Sadaqah" });

    const fetchDonations = async () => {
        try {
            const data = await api('/donations');
            setDonations(data);
        } catch (err) {
            console.error('Failed to load donations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDonations(); }, []);

    const handleCreate = async () => {
        try {
            await api('/donations', {
                method: 'POST',
                body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
            });
            setForm({ donor_name: "", amount: "", type: "Sadaqah" });
            setShowForm(false);
            fetchDonations();
        } catch (err: any) {
            alert(err.message || "Failed to record");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this donation record?")) return;
        try {
            await api(`/donations/${id}`, { method: 'DELETE' });
            fetchDonations();
        } catch (err: any) {
            alert(err.message || "Failed to delete");
        }
    };

    const typeColors: Record<string, string> = {
        Zakat: "bg-purple-100 text-purple-800",
        Sadaqah: "bg-blue-100 text-blue-800",
        Fitra: "bg-green-100 text-green-800",
        Waqf: "bg-orange-100 text-orange-800",
        General: "bg-gray-100 text-gray-800"
    };

    const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Financial Ledger</h2>
                    <p className="text-sm text-gray-500">Total: ${total.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800">
                        <Download className="h-4 w-4" /> Export
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                        <DollarSign className="h-4 w-4" /> Record Donation
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="rounded-lg border bg-white p-4 dark:bg-gray-950 dark:border-gray-800 space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <input
                            type="text"
                            placeholder="Donor Name (or Anonymous)"
                            value={form.donor_name}
                            onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
                            className="w-full rounded-md border p-2"
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            className="w-full rounded-md border p-2"
                        />
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="rounded-md border p-2"
                        >
                            <option value="Zakat">Zakat</option>
                            <option value="Sadaqah">Sadaqah</option>
                            <option value="Fitra">Fitra</option>
                            <option value="Waqf">Waqf</option>
                            <option value="General">General</option>
                        </select>
                    </div>
                    <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded-md">
                        Save Donation
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin" /></div>
            ) : (
                <div className="rounded-md border bg-white dark:bg-gray-950 dark:border-gray-800 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Donor</th>
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 font-medium">Amount</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {donations.map((d) => (
                                <tr key={d.id}>
                                    <td className="px-6 py-4">{new Date(d.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">{d.donor_name || "Anonymous"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-full ${typeColors[d.type] || typeColors.General}`}>
                                            {d.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">${Number(d.amount).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-green-600 font-medium">{d.status}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleDelete(d.id)} className="text-gray-400 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
