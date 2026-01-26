"use client";

import { useEffect, useState } from "react";
import { Save, Calendar, RefreshCw } from "lucide-react";
import { api } from "../../../api/client";

interface PrayerTime {
    id?: string;
    date: string;
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jumuah?: string;
}

const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        days.push({
            date: date.toISOString().split('T')[0],
            day: date.toLocaleDateString('en-US', { weekday: 'long' }),
            fajr: "05:00", dhuhr: "13:00", asr: "16:30", maghrib: "19:45", isha: "21:30", jumuah: ""
        });
    }
    return days;
};

export default function PrayerTimesPage() {
    const [schedule, setSchedule] = useState<PrayerTime[]>(getNext7Days());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchPrayers = async () => {
            try {
                const data = await api('/prayers');
                if (data && data.length > 0) {
                    // Merge fetched data with default days
                    const merged = getNext7Days().map(day => {
                        const found = data.find((p: PrayerTime) => p.date === day.date);
                        return found ? { ...day, ...found } : day;
                    });
                    setSchedule(merged);
                }
            } catch (err) {
                console.error('Failed to load prayers:', err);
            }
        };
        fetchPrayers();
    }, []);

    const handleTimeChange = (index: number, field: string, value: string) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage("");
        try {
            for (const prayer of schedule) {
                await api('/prayers', {
                    method: 'POST',
                    body: JSON.stringify(prayer)
                });
            }
            setMessage("✅ Prayer times saved successfully!");
        } catch (err: any) {
            setMessage("❌ " + (err.message || "Failed to save"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Weekly Prayer Schedule</h2>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50"
                >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </button>
            </div>

            {message && <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-800">{message}</div>}

            <div className="rounded-md border bg-white dark:bg-gray-950 dark:border-gray-800 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Fajr</th>
                            <th className="px-4 py-3 font-medium">Dhuhr</th>
                            <th className="px-4 py-3 font-medium">Asr</th>
                            <th className="px-4 py-3 font-medium">Maghrib</th>
                            <th className="px-4 py-3 font-medium">Isha</th>
                            <th className="px-4 py-3 font-medium">Jumuah</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {schedule.map((row, idx) => (
                            <tr key={row.date}>
                                <td className="px-4 py-3 font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <div>{new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                        <div className="text-xs text-gray-400">{row.date}</div>
                                    </div>
                                </td>
                                {["fajr", "dhuhr", "asr", "maghrib", "isha", "jumuah"].map((prayer) => (
                                    <td key={prayer} className="px-2 py-2">
                                        <input
                                            type="time"
                                            value={(row as any)[prayer] || ""}
                                            onChange={(e) => handleTimeChange(idx, prayer, e.target.value)}
                                            className="w-full rounded border px-2 py-1 text-center bg-transparent focus:ring-1 focus:ring-black text-sm"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
