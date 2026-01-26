"use client";
import { useEffect, useState } from "react";
import { DollarSign, Plus, Trash2, RefreshCw, TrendingUp, Download } from "lucide-react";
import { api } from "../../../api/client";

interface Donation { id: string; donor_name: string; amount: number; type: string; date: string; status: string; }

export default function DonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ donor_name: "", amount: "", type: "Sadaqah" });

    const fetchDonations = async () => {
        try { const data = await api('/donations'); setDonations(data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchDonations(); }, []);

    const handleCreate = async () => {
        if (!form.amount) return;
        try {
            await api('/donations', { method: 'POST', body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
            setForm({ donor_name: "", amount: "", type: "Sadaqah" });
            setShowForm(false); fetchDonations();
        } catch (err: any) { alert(err.message); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete?")) return;
        await api(`/donations/${id}`, { method: 'DELETE' }); fetchDonations();
    };

    const total = donations.reduce((s, d) => s + Number(d.amount), 0);
    const typeColors: Record<string, string> = { Zakat: "bg-purple-100 text-purple-800", Sadaqah: "bg-blue-100 text-blue-800", Fitra: "bg-green-100 text-green-800", Waqf: "bg-orange-100 text-orange-800" };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-7 h-7 text-green-600" />Donations</h1>
                    <p className="text-gray-500">Total: <span className="font-bold text-green-600">${total.toLocaleString()}</span></p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus className="w-4 h-4" />Record</button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl border p-6 shadow-lg grid gap-4 md:grid-cols-4">
                    <input type="text" placeholder="Donor Name" value={form.donor_name} onChange={e => setForm({ ...form, donor_name: e.target.value })} className="form-input" />
                    <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="form-input" />
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="form-input">
                        <option>Zakat</option><option>Sadaqah</option><option>Fitra</option><option>Waqf</option><option>General</option>
                    </select>
                    <button onClick={handleCreate} className="btn-primary">Save</button>
                </div>
            )}

            {loading ? <RefreshCw className="w-8 h-8 animate-spin mx-auto" /> : (
                <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500">Donor</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500">Type</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500">Amount</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {donations.map(d => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(d.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">{d.donor_name || "Anonymous"}</td>
                                    <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${typeColors[d.type] || 'bg-gray-100'}`}>{d.type}</span></td>
                                    <td className="px-6 py-4 font-bold text-green-600">${Number(d.amount).toFixed(2)}</td>
                                    <td className="px-6 py-4"><button onClick={() => handleDelete(d.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
