"use client";

import { Bell, Plus, Trash2 } from "lucide-react";

export default function NoticesPage() {
    return (
        <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Announcements</h2>
                <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Create Notice
                </button>
            </div>

            {/* Grid of Notices */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Demo Card 1 */}
                <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-950 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">High Priority</span>
                        <button className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <h3 className="font-bold text-lg">Eid-ul-Adha Prayers</h3>
                    <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">
                        Eid prayers will be held at 7:30 AM and 9:00 AM. Please bring your prayer mats.
                    </p>
                    <div className="mt-4 flex items-center text-xs text-gray-400">
                        <Bell className="mr-1 h-3 w-3" /> Posted 2 days ago
                    </div>
                </div>

                {/* Demo Card 2 */}
                <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-950 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Community</span>
                        <button className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <h3 className="font-bold text-lg">Weekly Halaqa</h3>
                    <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">
                        Join us every Friday after Maghrib for Tafseer session with Imam Ahmed.
                    </p>
                    <div className="mt-4 flex items-center text-xs text-gray-400">
                        <Bell className="mr-1 h-3 w-3" /> Posted 5 days ago
                    </div>
                </div>
            </div>
        </div>
    );
}
