"use client";
import { useEffect, useState } from "react";
import { Clock, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "../../../api/client";
import { toast } from "sonner";

const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(); date.setDate(date.getDate() + i);
        days.push({ date: date.toISOString().split('T')[0], day: date.toLocaleDateString('en-US', { weekday: 'short' }), fajr: "05:15", dhuhr: "13:00", asr: "16:30", maghrib: "19:45", isha: "21:30", jumuah: "13:30" });
    }
    return days;
};

export default function PrayerTimesPage() {
    const [schedule, setSchedule] = useState(getNext7Days());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api('/prayers').then((data) => {
            if (data?.length > 0) {
                const merged = getNext7Days().map(day => {
                    const found = data.find((p: any) => p.date === day.date);
                    return found ? { ...day, ...found } : day;
                });
                setSchedule(merged);
            }
        }).catch(console.error);
    }, []);

    const handleTimeChange = (idx: number, field: string, value: string) => {
        const newSchedule = [...schedule];
        newSchedule[idx] = { ...newSchedule[idx], [field]: value };
        setSchedule(newSchedule);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const prayer of schedule) {
                await api('/prayers', { method: 'POST', body: JSON.stringify(prayer) });
            }
            toast.success("Prayer times saved!");
        } catch (err: any) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="h-6 w-6 text-teal-600" />Prayer Times</h1>
                    <p className="text-muted-foreground">Manage weekly prayer schedule</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">Day</TableHead>
                            <TableHead>Fajr</TableHead>
                            <TableHead>Dhuhr</TableHead>
                            <TableHead>Asr</TableHead>
                            <TableHead>Maghrib</TableHead>
                            <TableHead>Isha</TableHead>
                            <TableHead>Jumuah</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedule.map((row, idx) => (
                            <TableRow key={row.date}>
                                <TableCell>
                                    <div className="font-medium">{row.day}</div>
                                    <div className="text-xs text-muted-foreground">{row.date}</div>
                                </TableCell>
                                {["fajr", "dhuhr", "asr", "maghrib", "isha", "jumuah"].map((field) => (
                                    <TableCell key={field}>
                                        <Input type="time" value={(row as any)[field] || ""} onChange={(e) => handleTimeChange(idx, field, e.target.value)} className="w-28" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Preview */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <CardTitle>Public Display Preview</CardTitle>
                    <CardDescription className="text-slate-300">How it appears on the masjid display</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-5 divide-x">
                        {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((name) => {
                            const time = (schedule[0] as any)[name.toLowerCase()];
                            return (
                                <div key={name} className="p-6 text-center bg-slate-50 dark:bg-slate-900">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{name}</p>
                                    <p className="text-2xl font-bold mt-1">{time || '--:--'}</p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
