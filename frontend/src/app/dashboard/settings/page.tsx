"use client";

import { Save, MapPin, Globe } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="max-w-2xl space-y-8">
            <div>
                <h2 className="text-xl font-semibold">Mosque Profile</h2>
                <p className="text-sm text-gray-500">Manage your mosque's public details and location.</p>
            </div>

            <div className="space-y-4 rounded-lg border bg-white p-6 dark:bg-gray-950 dark:border-gray-800">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Mosque Name</label>
                    <input type="text" defaultValue="Masjid Al-Noor" className="rounded-md border p-2 text-sm w-full" />
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input type="text" defaultValue="123 Islamic Center Dr, City, State" className="rounded-md border p-2 pl-9 text-sm w-full" />
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium">Website / Social Link</label>
                    <div className="relative">
                        <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input type="text" defaultValue="https://masjidalnoor.com" className="rounded-md border p-2 pl-9 text-sm w-full" />
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea rows={4} className="rounded-md border p-2 text-sm w-full" defaultValue="A community center serving the Muslims of..." />
                </div>

                <div className="pt-4 flex justify-end">
                    <button className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80">
                        <Save className="h-4 w-4" /> Update Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
