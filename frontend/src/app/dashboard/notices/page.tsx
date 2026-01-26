"use client";
import { useEffect, useState } from "react";
import { Bell, Plus, Trash2, RefreshCw, Megaphone, AlertTriangle, Info } from "lucide-react";
import { api } from "../../../api/client";

interface Notice { id: string; title: string; content: string; priority: string; created_at: string; }

export default function NoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", content: "", priority: "NORMAL" });

    const fetchNotices = async () => {
        try { const data = await api('/notices'); setNotices(data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchNotices(); }, []);

    const handleCreate = async () => {
        if (!form.title) return;
        try {
            await api('/notices', { method: 'POST', body: JSON.stringify(form) });
            setForm({ title: "", content: "", priority: "NORMAL" });
            setShowForm(false); fetchNotices();
        } catch (err: any) { alert(err.message); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete?")) return;
        await api(`/notices/${id}`, { method: 'DELETE' }); fetchNotices();
    };

    const pConfig: Record<string, { bg: string, text: string }> = {
        HIGH: { bg: "bg-red-50 border-red-200", text: "text-red-700" },
        NORMAL: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
        LOW: { bg: "bg-gray-50 border-gray-200", text: "text-gray-600" }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="w-7 h-7 text-blue-600" />Announcements</h1>
                    <p className="text-gray-500">Manage mosque announcements</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus className="w-4 h-4" />New</button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl border p-6 space-y-4 shadow-lg">
                    <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="form-input" />
                    <textarea placeholder="Content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="form-input min-h-[100px]" />
                    <div className="flex gap-4">
                        <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="form-input">
                            <option value="HIGH">🔴 High</option><option value="NORMAL">🔵 Normal</option><option value="LOW">⚪ Low</option>
                        </select>
                        <button onClick={handleCreate} className="btn-primary">Publish</button>
                    </div>
                </div>
            )}

            {loading ? <RefreshCw className="w-8 h-8 animate-spin mx-auto" /> : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {notices.map(n => {
                        const c = pConfig[n.priority] || pConfig.NORMAL;
                        return (
                            <div key={n.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden`}>
                                <div className={`${c.bg} px-4 py-2 flex justify-between border-b`}>
                                    <span className={`text-xs font-bold ${c.text}`}>{n.priority}</span>
                                    <button onClick={() => handleDelete(n.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg">{n.title}</h3>
                                    <p className="text-gray-600 text-sm mt-2">{n.content}</p>
                                    <p className="text-xs text-gray-400 mt-4">{new Date(n.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
