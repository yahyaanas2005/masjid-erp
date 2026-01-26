"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard, Clock, Bell, CreditCard, Settings, Users, LogOut,
    Megaphone, Heart, Calendar
} from "lucide-react";

const themes = [
    { id: 'default', name: 'Islamic Green', color: '#0d9488' },
    { id: 'gold', name: 'Royal Gold', color: '#d97706' },
    { id: 'royal', name: 'Purple', color: '#7c3aed' },
    { id: 'night', name: 'Night', color: '#1e293b' },
    { id: 'ocean', name: 'Ocean', color: '#0284c7' },
];

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/prayers", label: "Prayer Times", icon: Clock },
    { href: "/dashboard/notices", label: "Announcements", icon: Bell },
    { href: "/dashboard/donations", label: "Donations", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [theme, setTheme] = useState('default');

    useEffect(() => {
        // Check auth
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
        }
        // Load theme
        const savedTheme = localStorage.getItem('theme') || 'default';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme === 'default' ? '' : savedTheme);
    }, [router]);

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme === 'default' ? '' : newTheme);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Header - CloudHQ Style */}
            <header className="cloudhq-header">
                <div className="max-w-7xl mx-auto">
                    {/* Top Row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🕌</span>
                            <div>
                                <h1 className="text-xl font-bold">Masjid ERP</h1>
                                <p className="text-xs text-white/70">Management System</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Theme Switcher */}
                            <div className="theme-switcher">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleThemeChange(t.id)}
                                        className={`theme-btn ${t.id === 'default' ? 'green' : t.id}`}
                                        title={t.name}
                                        style={{
                                            background: t.color,
                                            transform: theme === t.id ? 'scale(1.2)' : 'scale(1)',
                                            boxShadow: theme === t.id ? '0 0 0 2px white' : 'none'
                                        }}
                                    />
                                ))}
                            </div>

                            <button onClick={handleLogout} className="btn-secondary text-white border-white/30 hover:bg-white/20 hover:text-white">
                                <LogOut className="w-4 h-4 mr-2 inline" />
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Navigation Row */}
                    <nav className="cloudhq-nav inline-flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`cloudhq-nav-item flex items-center gap-2 ${pathname === item.href ? 'active' : ''}`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
                {children}
            </main>
        </div>
    );
}
