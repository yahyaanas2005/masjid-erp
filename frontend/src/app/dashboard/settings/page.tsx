"use client";
import { useEffect, useState } from "react";
import { Save, Loader2, Building2, MapPin, Globe, Phone, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "../../../api/client";
import { toast } from "sonner";

export default function SettingsPage() {
    const [profile, setProfile] = useState({ full_name: "", masjid_name: "", address: "", website: "", phone: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api('/profile').then((data) => { if (data) setProfile({ ...profile, ...data }); })
            .catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try { await api('/profile', { method: 'PUT', body: JSON.stringify(profile) }); toast.success("Profile saved!"); }
        catch (err: any) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="max-w-2xl space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6 text-amber-600" />Settings</h1>
                <p className="text-muted-foreground">Manage your mosque profile and preferences</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mosque Profile</CardTitle>
                    <CardDescription>Public information about your mosque</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2"><User className="h-4 w-4" />Admin Name</label>
                        <Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} placeholder="Your name" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2"><Building2 className="h-4 w-4" />Mosque Name</label>
                        <Input value={profile.masjid_name} onChange={e => setProfile({ ...profile, masjid_name: e.target.value })} placeholder="e.g. Masjid Al-Noor" />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4" />Address</label>
                        <Input value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} placeholder="123 Main Street, City" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2"><Phone className="h-4 w-4" />Phone</label>
                            <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 (555) 123-4567" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2"><Globe className="h-4 w-4" />Website</label>
                            <Input value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} placeholder="https://yourmasjid.org" />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
