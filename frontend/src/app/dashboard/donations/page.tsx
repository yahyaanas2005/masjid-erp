"use client";
import { useEffect, useState } from "react";
import { CreditCard, Plus, Trash2, Loader2, TrendingUp, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "../../../api/client";
import { toast } from "sonner";

interface Donation { id: string; donor_name: string; amount: number; type: string; date: string; status: string; }

export default function DonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ donor_name: "", amount: "", type: "Sadaqah" });

    const fetchDonations = async () => {
        try { setDonations(await api('/donations')); }
        catch (err: any) { toast.error(err.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchDonations(); }, []);

    const handleCreate = async () => {
        if (!form.amount) { toast.error("Amount is required"); return; }
        try {
            await api('/donations', { method: 'POST', body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
            toast.success("Donation recorded!");
            setForm({ donor_name: "", amount: "", type: "Sadaqah" });
            setOpen(false); fetchDonations();
        } catch (err: any) { toast.error(err.message); }
    };

    const handleDelete = async (id: string) => {
        try { await api(`/donations/${id}`, { method: 'DELETE' }); toast.success("Deleted"); fetchDonations(); }
        catch (err: any) { toast.error(err.message); }
    };

    const total = donations.reduce((s, d) => s + Number(d.amount), 0);
    const typeVariants: Record<string, "default" | "secondary" | "outline"> = { Zakat: "default", Sadaqah: "secondary", Fitra: "outline", Waqf: "default" };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-green-600" />Donations</h1>
                    <p className="text-muted-foreground">Financial records and contributions</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Export</Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2"><Plus className="h-4 w-4" />Record</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Record Donation</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input placeholder="Donor Name (or leave empty for Anonymous)" value={form.donor_name} onChange={e => setForm({ ...form, donor_name: e.target.value })} />
                                <Input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                                    <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Zakat">Zakat</SelectItem>
                                        <SelectItem value="Sadaqah">Sadaqah</SelectItem>
                                        <SelectItem value="Fitra">Fitra</SelectItem>
                                        <SelectItem value="Waqf">Waqf</SelectItem>
                                        <SelectItem value="General">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm">Total Collected</p>
                            <p className="text-4xl font-bold">${total.toLocaleString()}</p>
                        </div>
                        <CreditCard className="h-12 w-12 opacity-30" />
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Donor</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {donations.map(d => (
                                <TableRow key={d.id}>
                                    <TableCell>{new Date(d.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{d.donor_name || "Anonymous"}</TableCell>
                                    <TableCell><Badge variant={typeVariants[d.type] || "outline"}>{d.type}</Badge></TableCell>
                                    <TableCell className="font-bold text-green-600">${Number(d.amount).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}
