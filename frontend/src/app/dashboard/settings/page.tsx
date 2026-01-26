"use client";

import { useEffect, useState } from "react";
import { Save, MapPin, Globe, Phone, RefreshCw } from "lucide-react";
import { api } from "../../../api/client";

interface Profile {
    full_name: string;
    masjid_name: string;
    address: string;
    website: string;
    phone: string;
}

export default function SettingsPage() {
    const [profile, setProfile] = useState<Profile>({
        full_name: "", masjid_name: "", address: "", website: "", phone: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api('/profile');
                if (data) setProfile({ ...profile, ...data });
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        try {
            await api('/profile', {
                method: 'PUT',
                body: JSON.stringify(profile)
            });
            setMessage("✅ Profile saved successfully!");
        } catch (err: any) {
            setMessage("❌ " + (err.message || "Failed to save"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin" /></div>;
    }

    return (
        <div className="max-w-2xl space-y-8">
            <div>
                <h2 className="text-xl font-semibold">Mosque Profile</h2>
                <p className="text-sm text-gray-500">Manage your mosque's public details and location.</p>
            </div>

            {message && <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-800">{message}</div>}

            <div className="space-y-4 rounded-lg border bg-white p-6 dark:bg-gray-950 dark:border-gray-800">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Admin Name</label>
                    <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="rounded-md border p-2 text-sm w-full"
                    />
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium">Mosque Name</label>
                    <input
                        type="text"
                        value={profile.masjid_name}
                        onChange={(e) => setProfile({ ...profile, masjid_name: e.target.value })}
                        className="rounded-md border p-2 text-sm w-full"
                    />
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={profile.address}
                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                            className="rounded-md border p-2 pl-9 text-sm w-full"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium">Phone</label>
                    <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="rounded-md border p-2 pl-9 text-sm w-full"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-medium">Website</label>
                    <div className="relative">
                        <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={profile.website}
                            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                            className="rounded-md border p-2 pl-9 text-sm w-full"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Update Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
