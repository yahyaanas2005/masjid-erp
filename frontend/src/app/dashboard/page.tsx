"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Bell, CreditCard, Settings, Users, TrendingUp, AlertCircle, Calendar, ArrowUpRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "../../api/client";

const modules = [
    { href: "/dashboard/prayers", label: "Prayer Times", icon: Clock, color: "from-emerald-500 to-teal-600", desc: "Manage daily schedules" },
    { href: "/dashboard/notices", label: "Announcements", icon: Bell, color: "from-blue-500 to-indigo-600", desc: "Post & manage notices" },
    { href: "/dashboard/donations", label: "Donations", icon: CreditCard, color: "from-violet-500 to-purple-600", desc: "Financial records" },
    { href: "/dashboard/members", label: "Members", icon: Users, color: "from-amber-500 to-orange-600", desc: "Manage committee" },
];

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        api('/stats').then(setStats).catch(console.error);
        api('/auth/me').then(setUser).catch(console.error);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Hero */}
            <Card className="border-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-xl overflow-hidden relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,white_1px,transparent_1px)] bg-[length:20px_20px]" />
                <CardContent className="p-8 relative">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-1">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
                            <h1 className="text-3xl font-bold mb-2">Assalamu Alaikum, {user?.full_name?.split(' ')[0] || 'User'}!</h1>
                            <p className="text-white/80">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            <Badge variant="secondary" className="mt-4 bg-white/20 text-white border-0">
                                <Sparkles className="w-3 h-3 mr-1" /> {user?.role || 'Loading...'}
                            </Badge>
                        </div>
                        <div className="text-7xl opacity-30">🕌</div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Donations</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${stats?.donations_month || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Notices</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.active_notices || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Announcements</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.total_members || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registered</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Janazah</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.upcoming_janazah || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
                    </CardContent>
                </Card>
            </div>

            {/* Modules Grid */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Quick Access
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {modules.map((mod) => (
                        <Link key={mod.href} href={mod.href}>
                            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                <CardContent className="p-6">
                                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                        <mod.icon className="h-7 w-7 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {mod.label}
                                        <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">{mod.desc}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Prayer Times */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" /> Today Prayer Times
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-5 divide-x">
                        {[
                            { name: 'Fajr', time: '05:15' },
                            { name: 'Dhuhr', time: '13:00' },
                            { name: 'Asr', time: '16:30' },
                            { name: 'Maghrib', time: '19:45' },
                            { name: 'Isha', time: '21:30' },
                        ].map((p) => (
                            <div key={p.name} className="p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <p className="text-xs text-muted-foreground uppercase">{p.name}</p>
                                <p className="text-xl font-bold mt-1">{p.time}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
