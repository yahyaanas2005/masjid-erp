"use client";

import { useEffect, useState } from "react";
import { Save, Calendar, RefreshCw, Clock } from "lucide-react";
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
            fajr: "05:15", dhuhr: "13:00", asr: "16:30", maghrib: "19:45", isha: "21:30", jumuah: "13:30"
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Clock className="w-7 h-7 text-teal-600" />
                        Weekly Prayer Schedule
                    </h1>
                    <p className="text-gray-500 mt-1">Manage prayer times for the upcoming week</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? <RefreshCw className="w-4 w-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save All Changes
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message}
                </div>
            )}

            {/* Prayer Board Display */}
            <div className="prayer-board">
                <div className="prayer-board-header">
                    <h2>🕌 Weekly Salah Schedule</h2>
                </div>

                {/* Header Row */}
                <div className="grid grid-cols-8 gap-2 text-center text-sm font-medium text-yellow-400 mb-4 pb-2 border-b border-white/20">
                    <div>Day</div>
                    <div>Fajr</div>
                    <div>Dhuhr</div>
                    <div>Asr</div>
                    <div>Maghrib</div>
                    <div>Isha</div>
                    <div>Jumuah</div>
                    <div></div>
                </div>

                {/* Prayer Rows */}
                {schedule.map((row, idx) => (
                    <div key={row.date} className="grid grid-cols-8 gap-2 items-center py-3 border-b border-white/10 last:border-0">
                        <div className="text-left">
                            <div className="text-green-400 font-semibold">
                                {new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="text-xs text-white/50">{row.date}</div>
                        </div>
                        {["fajr", "dhuhr", "asr", "maghrib", "isha", "jumuah"].map((prayer) => (
                            <input
                                key={prayer}
                                type="time"
                                value={(row as any)[prayer] || ""}
                                onChange={(e) => handleTimeChange(idx, prayer, e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1.5 text-center text-white text-sm focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                            />
                        ))}
                        <div className="text-center">
                            {idx === 0 && <span className="text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded">Today</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Public Display Preview */}
            <div className="section-header">
                <h3>📺 Public Display Preview</h3>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-yellow-400">Today's Prayer Times</h2>
                    <p className="text-white/60">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div className="grid grid-cols-5 gap-4">
                    {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((name, i) => {
                        const field = name.toLowerCase();
                        const time = (schedule[0] as any)[field];
                        return (
                            <div key={name} className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-xs text-white/50 uppercase tracking-wider mb-1">{name}</div>
                                <div className="text-2xl font-bold text-white">{time || '--:--'}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
