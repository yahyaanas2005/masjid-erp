"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Clock, Bell, CreditCard, Settings, Users, LogOut, Palette, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { api } from "../../api/client";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/prayers", label: "Prayers", icon: Clock },
    { href: "/dashboard/notices", label: "Notices", icon: Bell },
    { href: "/dashboard/donations", label: "Donations", icon: CreditCard },
    { href: "/dashboard/members", label: "Members", icon: Users },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const roleVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'Chairman': 'default',
    'General Secretary': 'secondary',
    'Treasurer': 'outline',
    'Admin': 'secondary',
    'Committee Member': 'outline',
    'Namazi': 'outline',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/'); return; }
        api('/auth/me').then(setUser).catch(() => router.push('/'));

        // Check dark mode
        if (localStorage.getItem('darkMode') === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, [router]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        localStorage.setItem('darkMode', (!darkMode).toString());
        document.documentElement.classList.toggle('dark');
    };

    const handleLogout = () => { localStorage.removeItem('token'); router.push('/'); };

    return (
        <div className="min-h-screen bg-background">
            <Toaster richColors position="top-right" />

            {/* Premium Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                            <span className="text-xl">🕌</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold tracking-tight">Masjid ERP</h1>
                            <p className="text-xs text-muted-foreground">Management System</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={pathname === item.href ? "default" : "ghost"}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                    </nav>

                    {/* Right Side */}
                    <div className="flex items-center gap-2">
                        {/* Dark Mode Toggle */}
                        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>

                        {/* User Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2 px-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                                            {user?.full_name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-medium">{user?.full_name || 'Loading...'}</p>
                                        <Badge variant={roleVariants[user?.role] || 'outline'} className="text-xs">
                                            {user?.role || '...'}
                                        </Badge>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings" className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" /> Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" /> Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Mobile Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {navItems.map((item) => (
                                    <DropdownMenuItem key={item.href} asChild>
                                        <Link href={item.href} className="cursor-pointer">
                                            <item.icon className="mr-2 h-4 w-4" /> {item.label}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container p-6">{children}</main>
        </div>
    );
}
