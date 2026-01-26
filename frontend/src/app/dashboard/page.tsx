"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard, Bell, Clock, Plus } from "lucide-react";
import { api } from "../../api/client";

interface Stats {
    donations_month: number;
    active_notices: number;
    total_members: number;
    upcoming_janazah: number;
}

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

    const statCards = [
        {
            name: "Monthly Donations",
            value: stats ? `$${Number(stats.donations_month).toLocaleString()}` : "Loading...",
            change: "Last 30 days",
            icon: CreditCard,
            color: "text-green-500"
        },
        {
            name: "Active Notices",
            value: stats?.active_notices || "0",
            change: "Announcements",
            icon: Bell,
            color: "text-blue-500"
        },
        {
            name: "Upcoming Janazah",
            value: stats?.upcoming_janazah || "0",
            change: "Prayers scheduled",
            icon: Clock,
            color: "text-orange-500"
        },
        {
            name: "Registered Members",
            value: stats?.total_members || "0",
            change: "Total users",
            icon: Users,
            color: "text-purple-500"
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.name}
                        className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-950 dark:border-gray-800"
                    >
                        <div className="flex flex-row items-center justify-between pb-2">
                            <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div className="pt-2">
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-950 dark:border-gray-800">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid gap-3 md:grid-cols-4">
                    <a href="/dashboard/prayers" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                        <Clock className="h-5 w-5 text-green-500" />
                        <span>Update Prayer Times</span>
                    </a>
                    <a href="/dashboard/notices" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                        <Bell className="h-5 w-5 text-blue-500" />
                        <span>Post Announcement</span>
                    </a>
                    <a href="/dashboard/donations" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                        <CreditCard className="h-5 w-5 text-purple-500" />
                        <span>Record Donation</span>
                    </a>
                    <a href="/dashboard/settings" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                        <Plus className="h-5 w-5 text-gray-500" />
                        <span>Masjid Settings</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
