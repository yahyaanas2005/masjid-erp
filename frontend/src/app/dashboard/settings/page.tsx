"use client";
import { useEffect, useState } from "react";
import { Save, MapPin, Globe, Phone, RefreshCw, Building2 } from "lucide-react";
import { api } from "../../../api/client";

interface Profile { full_name: string; masjid_name: string; address: string; website: string; phone: string; }

export default function SettingsPage() {
    const [profile, setProfile] = useState<Profile>({ full_name: "", masjid_name: "", address: "", website: "", phone: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try { const data = await api('/profile'); if (data) setProfile({ ...profile, ...data }); }
            catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true); setMessage("");
        try { await api('/profile', { method: 'PUT', body: JSON.stringify(profile) }); setMessage("✅ Saved!"); }
        catch (err: any) { setMessage("❌ " + err.message); }
        finally { setSaving(false); }
    };

    if (loading) return <RefreshCw className="w-8 h-8 animate-spin mx-auto mt-20" />;

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-7 h-7 text-amber-600" />Mosque Profile</h1>
                <p className="text-gray-500">Manage your mosque's public details</p>
            </div>

            {message && <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message}</div>}

            <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
                <div>
                    <label className="form-label">Admin Name</label>
                    <input type="text" value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="form-input" />
                </div>
                <div>
                    <label className="form-label">Mosque Name</label>
                    <input type="text" value={profile.masjid_name} onChange={e => setProfile({ ...profile, masjid_name: e.target.value })} className="form-input" />
                </div>
                <div>
                    <label className="form-label">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input type="text" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} className="form-input pl-10" />
                    </div>
                </div>
                <div>
                    <label className="form-label">Phone</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input type="text" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="form-input pl-10" />
                    </div>
                </div>
                <div>
                    <label className="form-label">Website</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input type="text" value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} className="form-input pl-10" />
                    </div>
                </div>
                <div className="pt-4 flex justify-end">
                    <button onClick={handleSave} disabled={saving} className="btn-primary">
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
