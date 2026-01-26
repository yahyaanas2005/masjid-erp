"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, Trash2, RefreshCw } from "lucide-react";
import { api } from "../../../api/client";

interface Notice {
    id: string;
    title: string;
    content: string;
    priority: string;
    created_at: string;
}

export default function NoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", content: "", priority: "NORMAL" });

    const fetchNotices = async () => {
        try {
            const data = await api('/notices');
            setNotices(data);
        } catch (err) {
            console.error('Failed to load notices:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotices(); }, []);

    const handleCreate = async () => {
        try {
            await api('/notices', {
                method: 'POST',
                body: JSON.stringify(form)
            });
            setForm({ title: "", content: "", priority: "NORMAL" });
            setShowForm(false);
            fetchNotices();
        } catch (err: any) {
            alert(err.message || "Failed to create");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this notice?")) return;
        try {
            await api(`/notices/${id}`, { method: 'DELETE' });
            fetchNotices();
        } catch (err: any) {
            alert(err.message || "Failed to delete");
        }
    };

    const priorityColors: Record<string, string> = {
        HIGH: "bg-red-100 text-red-700",
        NORMAL: "bg-green-100 text-green-700",
        LOW: "bg-gray-100 text-gray-700"
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Announcements</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" />
                    Create Notice
                </button>
            </div>

            {showForm && (
                <div className="rounded-lg border bg-white p-4 dark:bg-gray-950 dark:border-gray-800 space-y-4">
                    <input
                        type="text"
                        placeholder="Title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-md border p-2"
                    />
                    <textarea
                        placeholder="Content"
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        className="w-full rounded-md border p-2"
                        rows={3}
                    />
                    <div className="flex gap-4 items-center">
                        <select
                            value={form.priority}
                            onChange={(e) => setForm({ ...form, priority: e.target.value })}
                            className="rounded-md border p-2"
                        >
                            <option value="HIGH">High Priority</option>
                            <option value="NORMAL">Normal</option>
                            <option value="LOW">Low Priority</option>
                        </select>
                        <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded-md">
                            Publish
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin" /></div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {notices.map((notice) => (
                        <div key={notice.id} className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-950 dark:border-gray-800">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityColors[notice.priority] || priorityColors.NORMAL}`}>
                                    {notice.priority}
                                </span>
                                <button onClick={() => handleDelete(notice.id)} className="text-gray-400 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <h3 className="font-bold text-lg">{notice.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">{notice.content}</p>
                            <div className="mt-4 flex items-center text-xs text-gray-400">
                                <Bell className="mr-1 h-3 w-3" />
                                {new Date(notice.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
