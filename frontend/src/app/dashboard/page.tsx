"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Bell, CreditCard, Settings, Users, Calendar, Heart, Megaphone, BarChart3, AlertCircle, Crown, Shield } from "lucide-react";
import { api } from "../../api/client";

const modules = [
    { href: "/dashboard/prayers", label: "Prayer Times", icon: Clock, color: "#15803d", desc: "Manage schedules" },
    { href: "/dashboard/notices", label: "Announcements", icon: Bell, color: "#3b82f6", desc: "Post notices" },
    { href: "/dashboard/donations", label: "Donations", icon: CreditCard, color: "#8b5cf6", desc: "Financial records" },
    { href: "/dashboard/members", label: "Members", icon: Users, color: "#f59e0b", desc: "Manage users" },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, color: "#64748b", desc: "Mosque profile" },
];

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        api('/stats').then(setStats).catch(console.error);
        api('/auth/me').then(setUser).catch(console.error);
    }, []);

    const hasPermission = (perm: string) => {
        if (!user?.permissions) return false;
        return user.permissions.includes('all') || user.permissions.includes(perm);
    };

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #065f46 100%)', color: 'white' }}>
                <div className="flex items-center gap-4">
                    <div className="text-5xl">🕌</div>
                    <div>
                        <p className="text-white/70 text-sm">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
                        <h1 className="text-2xl font-bold">Welcome, {user?.full_name || 'User'}</h1>
                        <p className="text-white/80">Role: <strong>{user?.role || 'Loading...'}</strong></p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <div className="stat-value">${stats?.donations_month || 0}</div>
                            <div className="stat-label">This Month</div>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="stat-value">{stats?.active_notices || 0}</div>
                            <div className="stat-label">Notices</div>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <div className="stat-value">{stats?.total_members || 0}</div>
                            <div className="stat-label">Members</div>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <div className="stat-value">{stats?.upcoming_janazah || 0}</div>
                            <div className="stat-label">Janazah</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Your Permissions */}
            <div className="section-header">
                <Shield className="w-5 h-5" />
                <h3>Your Permissions</h3>
            </div>
            <div className="card">
                <div className="flex flex-wrap gap-2">
                    {(user?.permissions || []).map((p: string) => (
                        <span key={p} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            ✓ {p.replace(/_/g, ' ')}
                        </span>
                    ))}
                    {(!user?.permissions || user.permissions.length === 0) && (
                        <span className="text-gray-500">Loading permissions...</span>
                    )}
                </div>
            </div>

            {/* Modules */}
            <div className="section-header">
                <BarChart3 className="w-5 h-5" />
                <h3>Management Modules</h3>
            </div>
            <div className="module-grid">
                {modules.map((mod) => (
                    <Link key={mod.href} href={mod.href} className="module-card">
                        <div className="icon" style={{ background: mod.color }}>
                            <mod.icon className="w-7 h-7" />
                        </div>
                        <div className="font-semibold mt-2">{mod.label}</div>
                        <p className="text-xs text-gray-500 mt-1">{mod.desc}</p>
                    </Link>
                ))}
            </div>

            {/* Prayer Board */}
            <div className="section-header">
                <Clock className="w-5 h-5" />
                <h3>Today's Prayer Times</h3>
            </div>
            <div className="prayer-board">
                <div className="text-center mb-6">
                    <p className="text-yellow-400 text-xl font-arabic mb-2">بِسْمِ اللَّهِ</p>
                    <h2 className="text-2xl font-bold text-white">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                </div>
                <div className="grid grid-cols-5 gap-4">
                    {[{ n: 'Fajr', t: '05:15' }, { n: 'Dhuhr', t: '13:00' }, { n: 'Asr', t: '16:30' }, { n: 'Maghrib', t: '19:45' }, { n: 'Isha', t: '21:30' }].map(p => (
                        <div key={p.n} className="text-center p-4 bg-white/10 rounded-xl">
                            <div className="text-xs text-green-400 uppercase tracking-wider">{p.n}</div>
                            <div className="text-2xl font-bold text-white mt-1">{p.t}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
