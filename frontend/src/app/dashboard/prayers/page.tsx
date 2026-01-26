"use client";

import { useState } from "react";
import { Save, Calendar } from "lucide-react";

const initialSchedule = [
    { day: "Monday", fajr: "05:00", dhuhr: "13:00", asr: "16:30", maghrib: "19:45", isha: "21:30" },
    { day: "Tuesday", fajr: "05:01", dhuhr: "13:00", asr: "16:31", maghrib: "19:43", isha: "21:29" },
    { day: "Wednesday", fajr: "05:02", dhuhr: "13:00", asr: "16:32", maghrib: "19:41", isha: "21:28" },
    { day: "Thursday", fajr: "05:03", dhuhr: "13:00", asr: "16:33", maghrib: "19:39", isha: "21:27" },
    { day: "Friday", fajr: "05:04", dhuhr: "13:30", asr: "16:34", maghrib: "19:38", isha: "21:26" }, // Jumuah special
    { day: "Saturday", fajr: "05:05", dhuhr: "13:00", asr: "16:35", maghrib: "19:36", isha: "21:25" },
    { day: "Sunday", fajr: "05:06", dhuhr: "13:00", asr: "16:36", maghrib: "19:35", isha: "21:24" },
];

export default function PrayerTimesPage() {
    const [schedule, setSchedule] = useState(initialSchedule);

    const handleTimeChange = (index: number, field: string, value: string) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Weekly Prayer Schedule</h2>
                <button className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80">
                    <Save className="h-4 w-4" />
                    Save Changes
                </button>
            </div>

            <div className="rounded-md border bg-white dark:bg-gray-950 dark:border-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium">Day</th>
                                <th className="px-6 py-3 font-medium">Fajr</th>
                                <th className="px-6 py-3 font-medium">Dhuhr/Jumuah</th>
                                <th className="px-6 py-3 font-medium">Asr</th>
                                <th className="px-6 py-3 font-medium">Maghrib</th>
                                <th className="px-6 py-3 font-medium">Isha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {schedule.map((row, idx) => (
                                <tr key={row.day}>
                                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {row.day}
                                    </td>
                                    {["fajr", "dhuhr", "asr", "maghrib", "isha"].map((prayer) => (
                                        <td key={prayer} className="px-4 py-2">
                                            <input
                                                type="time"
                                                value={(row as any)[prayer]}
                                                onChange={(e) => handleTimeChange(idx, prayer, e.target.value)}
                                                className="w-full rounded border px-2 py-1 text-center bg-transparent focus:ring-1 focus:ring-black"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
