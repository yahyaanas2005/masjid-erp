"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Clock, Bell, CreditCard, Settings, Users, LogOut, Palette, Shield, Crown, Briefcase, UserCheck } from "lucide-react";
import { api } from "../../api/client";

const themes = [
    { id: 'islamic', name: 'Islamic Green', emoji: '🕌', bg: '#15803d' },
    { id: 'glass', name: 'Glassmorphism', emoji: '✨', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { id: 'neu', name: 'Neumorphism', emoji: '🔘', bg: '#e0e5ec' },
    { id: 'dark', name: 'Night Mode', emoji: '🌙', bg: '#0f172a' },
    { id: 'bloomberg', name: 'Bloomberg', emoji: '📊', bg: '#000' },
    { id: 'sap', name: 'SAP Fiori', emoji: '🏢', bg: '#0a6ed1' },
    { id: 'gmail', name: 'Gmail', emoji: '📧', bg: '#1a73e8' },
    { id: 'gold', name: 'Royal Gold', emoji: '👑', bg: '#ffd700' },
    { id: 'ocean', name: 'Ocean', emoji: '🌊', bg: '#0077b6' },
    { id: 'outlook', name: 'Outlook', emoji: '📬', bg: '#0078d4' },
];

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/prayers", label: "Prayer Times", icon: Clock },
    { href: "/dashboard/notices", label: "Announcements", icon: Bell, permission: 'view_notices' },
    { href: "/dashboard/donations", label: "Donations", icon: CreditCard, permission: 'view_donations' },
    { href: "/dashboard/members", label: "Members", icon: Users, permission: 'view_members' },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const roleIcons: Record<string, any> = {
    'Chairman': Crown,
    'General Secretary': Briefcase,
    'Treasurer': CreditCard,
    'Admin': Shield,
    'Committee Member': UserCheck,
    'Namazi': Users,
};

const roleColors: Record<string, string> = {
    'Chairman': 'role-chairman',
    'General Secretary': 'role-secretary',
    'Treasurer': 'role-treasurer',
    'Admin': 'role-admin',
    'Committee Member': 'role-member',
    'Namazi': 'role-namazi',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [theme, setTheme] = useState('islamic');
    const [showThemes, setShowThemes] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/'); return; }

        const savedTheme = localStorage.getItem('theme') || 'islamic';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Fetch user info
        api('/auth/me').then(setUser).catch(() => router.push('/'));
    }, [router]);

    const handleTheme = (t: string) => {
        setTheme(t);
        localStorage.setItem('theme', t);
        document.documentElement.setAttribute('data-theme', t);
        setShowThemes(false);
    };

    const handleLogout = () => { localStorage.removeItem('token'); router.push('/'); };

    const RoleIcon = user?.role ? roleIcons[user.role] || Users : Users;

    const hasPermission = (perm?: string) => {
        if (!perm) return true;
        if (!user?.permissions) return false;
        return user.permissions.includes('all') || user.permissions.includes(perm);
    };

    return (
        <div className="min-h-screen islamic-pattern">
            {/* Header */}
            <header className="header" style={{ background: 'var(--primary)' }}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl">🕌</span>
                        <div>
                            <h1 className="text-xl font-bold">Masjid ERP</h1>
                            <p className="text-xs opacity-80">Management System v3.0</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Role Badge */}
                        {user && (
                            <div className={`role-badge ${roleColors[user.role] || 'role-namazi'}`}>
                                <RoleIcon className="w-3 h-3" />
                                {user.role}
                            </div>
                        )}

                        {/* Theme Button */}
                        <button onClick={() => setShowThemes(!showThemes)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                            <Palette className="w-5 h-5" />
                        </button>

                        {/* Logout */}
                        <button onClick={handleLogout} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="max-w-7xl mx-auto mt-4 flex gap-1 overflow-x-auto pb-2">
                    {navItems.filter(item => hasPermission(item.permission)).map((item) => (
                        <Link key={item.href} href={item.href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                ${pathname === item.href ? 'bg-white/20' : 'hover:bg-white/10'}`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </header>

            {/* Theme Picker Modal */}
            {showThemes && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowThemes(false)}>
                    <div className="card max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Palette className="w-5 h-5" /> Choose Theme</h3>
                        <div className="theme-grid">
                            {themes.map(t => (
                                <button key={t.id} onClick={() => handleTheme(t.id)}
                                    className={`theme-btn flex flex-col items-center justify-center ${theme === t.id ? 'active' : ''}`}
                                    style={{ background: t.bg }}
                                >
                                    <span className="text-2xl">{t.emoji}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-4">
                            Current: <strong>{themes.find(t => t.id === theme)?.name}</strong>
                        </p>
                    </div>
                </div>
            )}

            {/* Main */}
            <main className="max-w-7xl mx-auto p-6">{children}</main>
        </div>
    );
}
