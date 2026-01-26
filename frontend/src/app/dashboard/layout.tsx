export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Welcome, Imam</span>
                </div>
            </div>
            {children}
        </div>
    );
}
