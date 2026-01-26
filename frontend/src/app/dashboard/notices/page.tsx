"use client";
import { useEffect, useState } from "react";
import { Bell, Plus, Trash2, Loader2, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { api } from "../../../api/client";
import { toast } from "sonner";

interface Notice { id: string; title: string; content: string; priority: string; created_at: string; }

export default function NoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ title: "", content: "", priority: "NORMAL" });

    const fetchNotices = async () => {
        try { setNotices(await api('/notices')); }
        catch (err: any) { toast.error(err.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchNotices(); }, []);

    const handleCreate = async () => {
        if (!form.title) { toast.error("Title is required"); return; }
        try {
            await api('/notices', { method: 'POST', body: JSON.stringify(form) });
            toast.success("Notice published!");
            setForm({ title: "", content: "", priority: "NORMAL" });
            setOpen(false); fetchNotices();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleDelete = async (id: string) => {
        try { await api(`/notices/${id}`, { method: 'DELETE' }); toast.success("Deleted"); fetchNotices(); }
        catch (err: any) { toast.error(err.message); }
    };

    const priorityConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
        HIGH: { variant: "destructive", icon: AlertTriangle },
        NORMAL: { variant: "default", icon: Info },
        LOW: { variant: "secondary", icon: CheckCircle }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-blue-600" />Announcements</h1>
                    <p className="text-muted-foreground">Create and manage mosque notices</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="h-4 w-4" />New Notice</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            <Textarea placeholder="Content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} />
                            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HIGH">🔴 High Priority</SelectItem>
                                    <SelectItem value="NORMAL">🔵 Normal</SelectItem>
                                    <SelectItem value="LOW">⚪ Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Publish</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : notices.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No announcements yet</h3>
                        <p className="text-muted-foreground">Create your first notice to get started</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {notices.map((n) => {
                        const config = priorityConfig[n.priority] || priorityConfig.NORMAL;
                        const Icon = config.icon;
                        return (
                            <Card key={n.id} className="group hover:shadow-lg transition-all">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant={config.variant} className="gap-1"><Icon className="h-3 w-3" />{n.priority}</Badge>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-lg">{n.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3">{n.content}</p>
                                    <p className="text-xs text-muted-foreground mt-4">{new Date(n.created_at).toLocaleDateString()}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
