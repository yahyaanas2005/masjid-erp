"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Clock, Bell, CreditCard, Settings, Users, Calendar,
    Heart, Megaphone, BookOpen, MapPin, Phone, Globe,
    BarChart3, TrendingUp, AlertCircle
} from "lucide-react";
import { api } from "../../api/client";

interface Stats {
    donations_month: number;
    active_notices: number;
    total_members: number;
    upcoming_janazah: number;
}

const modules = [
    { href: "/dashboard/prayers", label: "Prayer Times", icon: Clock, color: "#0d9488", desc: "Manage daily schedules" },
    { href: "/dashboard/notices", label: "Announcements", icon: Bell, color: "#3b82f6", desc: "Post & manage notices" },
    { href: "/dashboard/donations", label: "Donations", icon: CreditCard, color: "#8b5cf6", desc: "Record & track" },
    { href: "/dashboard/settings", label: "Mosque Profile", icon: Settings, color: "#f59e0b", desc: "Update details" },
];

const quickActions = [
    { label: "Add Prayer Time", icon: Clock, href: "/dashboard/prayers", color: "#10b981" },
    { label: "New Announcement", icon: Megaphone, href: "/dashboard/notices", color: "#3b82f6" },
    { label: "Record Donation", icon: Heart, href: "/dashboard/donations", color: "#ec4899" },
    { label: "Janazah Alert", icon: AlertCircle, href: "/dashboard/notices", color: "#f97316" },
    { label: "View Members", icon: Users, href: "/dashboard/settings", color: "#8b5cf6" },
    { label: "Monthly Report", icon: BarChart3, href: "/dashboard/donations", color: "#06b6d4" },
];

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api('/stats');
                setStats(data);
            } catch (err) {
                console.error('Failed to load stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <div className="value">${stats?.donations_month || 0}</div>
                            <div className="label">Monthly Donations</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="value">{stats?.active_notices || 0}</div>
                            <div className="label">Active Notices</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <div className="value">{stats?.total_members || 0}</div>
                            <div className="label">Members</div>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <div className="value">{stats?.upcoming_janazah || 0}</div>
                            <div className="label">Janazah Alerts</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Modules - CloudHQ Style */}
            <div>
                <div className="section-header">
                    <h3>📦 Management Modules</h3>
                </div>
                <div className="module-grid">
                    {modules.map((mod) => (
                        <Link key={mod.href} href={mod.href} className="module-card">
                            <div className="icon" style={{ background: `linear-gradient(135deg, ${mod.color} 0%, ${mod.color}dd 100%)` }}>
                                <mod.icon className="w-7 h-7" />
                            </div>
                            <div className="title">{mod.label}</div>
                            <p className="text-xs text-gray-400 mt-1">{mod.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <div className="section-header">
                    <h3>⚡ Quick Actions</h3>
                </div>
                <div className="module-grid">
                    {quickActions.map((action, i) => (
                        <Link key={i} href={action.href} className="module-card">
                            <div className="icon" style={{ background: action.color }}>
                                <action.icon className="w-6 h-6" />
                            </div>
                            <div className="title text-sm">{action.label}</div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Today's Prayer Times Preview */}
            <div>
                <div className="section-header">
                    <h3>🕌 Today's Prayer Times</h3>
                </div>
                <div className="prayer-board">
                    <div className="prayer-board-header">
                        <h2>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</h2>
                        <p className="text-white/60 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="space-y-1">
                        {[
                            { name: "Fajr", time: "05:15 AM", iqamah: "05:30 AM" },
                            { name: "Dhuhr", time: "01:00 PM", iqamah: "01:30 PM" },
                            { name: "Asr", time: "04:30 PM", iqamah: "05:00 PM" },
                            { name: "Maghrib", time: "07:45 PM", iqamah: "07:50 PM" },
                            { name: "Isha", time: "09:30 PM", iqamah: "10:00 PM" },
                        ].map((prayer) => (
                            <div key={prayer.name} className="prayer-row">
                                <div className="prayer-name">{prayer.name}</div>
                                <div className="prayer-time">{prayer.time}</div>
                                <div className="prayer-iqamah">{prayer.iqamah}</div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-4 pt-4 border-t border-white/10">
                        <p className="text-yellow-400 text-sm">🕋 Jumuah: 01:30 PM</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
