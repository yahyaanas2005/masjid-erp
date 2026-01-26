"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, Bell, CreditCard, Settings, Users, LogOut } from "lucide-react";

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-white dark:bg-gray-950 dark:border-gray-800">
                <div className="flex h-16 items-center border-b px-6">
                    <span className="text-xl font-bold">🕌 Masjid ERP</span>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                        ? "bg-gray-100 text-black dark:bg-gray-800 dark:text-white"
                                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 md:pl-64">
                {/* Mobile header */}
                <header className="md:hidden sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 dark:bg-gray-950 dark:border-gray-800">
                    <span className="text-lg font-bold">🕌 Masjid ERP</span>
                </header>

                <main className="p-6 md:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
