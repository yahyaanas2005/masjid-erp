import { Users, CreditCard, Bell, Clock } from "lucide-react";

const stats = [
    {
        name: "Total Donations",
        value: "$45,231.89",
        change: "+20.1% from last month",
        icon: CreditCard,
    },
    {
        name: "Active Notices",
        value: "3",
        change: "1 High Priority",
        icon: Bell,
    },
    {
        name: "Next Prayer",
        value: "Asr 4:45 PM",
        change: "Iqamah in 20 mins",
        icon: Clock,
    },
    {
        name: "Registered Members",
        value: "256",
        change: "+12 new this week",
        icon: Users,
    },
];

export default function DashboardPage() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <div
                    key={stat.name}
                    className="rounded-xl border bg-white p-6 text-card-foreground shadow-sm dark:bg-gray-950 dark:border-gray-800"
                >
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">{stat.name}</h3>
                        <stat.icon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="pt-4">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground text-gray-400 mt-1">{stat.change}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
