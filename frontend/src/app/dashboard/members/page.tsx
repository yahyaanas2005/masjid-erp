"use client";
import { useEffect, useState } from "react";
import { Users, Loader2, Crown, Briefcase, CreditCard, Shield, UserCheck, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "../../../api/client";
import { toast } from "sonner";

const roles = ['Chairman', 'General Secretary', 'Treasurer', 'Admin', 'Committee Member', 'Namazi'];
const roleIcons: Record<string, any> = { 'Chairman': Crown, 'General Secretary': Briefcase, 'Treasurer': CreditCard, 'Admin': Shield, 'Committee Member': UserCheck, 'Namazi': User };
const roleColors: Record<string, string> = { 'Chairman': 'bg-amber-500', 'General Secretary': 'bg-blue-500', 'Treasurer': 'bg-green-500', 'Admin': 'bg-purple-500', 'Committee Member': 'bg-slate-500', 'Namazi': 'bg-teal-500' };

export default function MembersPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        api('/auth/me').then(setUser).catch(console.error);
        api('/members').then(setMembers).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
    }, []);

    const canChangeRoles = user?.role === 'Chairman' || user?.role === 'General Secretary';

    const handleRoleChange = async (memberId: string, newRole: string) => {
        try {
            await api(`/members/${memberId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) });
            toast.success("Role updated!");
            setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        } catch (err: any) { toast.error(err.message); }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-amber-600" />Committee Members</h1>
                <p className="text-muted-foreground">Manage masjid committee roles and permissions</p>
            </div>

            {/* Role Legend */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Role Hierarchy</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {roles.map(r => {
                            const Icon = roleIcons[r];
                            return (
                                <Badge key={r} variant="outline" className="gap-1.5 py-1.5">
                                    <div className={`h-2 w-2 rounded-full ${roleColors[r]}`} />
                                    <Icon className="h-3 w-3" /> {r}
                                </Badge>
                            );
                        })}
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
                                <TableHead>Member</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                {canChangeRoles && <TableHead>Change Role</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map(m => {
                                const RoleIcon = roleIcons[m.role] || User;
                                return (
                                    <TableRow key={m.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className={`${roleColors[m.role]} text-white text-xs`}>
                                                        {m.full_name?.[0] || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{m.full_name || 'Unnamed'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{m.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1.5">
                                                <RoleIcon className="h-3 w-3" /> {m.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                                        {canChangeRoles && (
                                            <TableCell>
                                                <Select value={m.role} onValueChange={v => handleRoleChange(m.id, v)}>
                                                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {!canChangeRoles && (
                <p className="text-center text-muted-foreground text-sm py-4">
                    💡 Only Chairman and General Secretary can change member roles
                </p>
            )}
        </div>
    );
}
