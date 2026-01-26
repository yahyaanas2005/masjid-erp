"use client";
import { useEffect, useState } from "react";
import { Users, Shield, Crown, Briefcase, CreditCard, UserCheck, RefreshCw, ChevronDown } from "lucide-react";
import { api } from "../../../api/client";

const roles = ['Chairman', 'General Secretary', 'Treasurer', 'Admin', 'Committee Member', 'Namazi'];
const roleColors: Record<string, string> = {
    'Chairman': 'role-chairman',
    'General Secretary': 'role-secretary',
    'Treasurer': 'role-treasurer',
    'Admin': 'role-admin',
    'Committee Member': 'role-member',
    'Namazi': 'role-namazi',
};

export default function MembersPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        api('/auth/me').then(setUser).catch(console.error);
        api('/members').then(setMembers).catch(console.error).finally(() => setLoading(false));
    }, []);

    const canChangeRoles = user?.role === 'Chairman' || user?.role === 'General Secretary';

    const handleRoleChange = async (memberId: string, newRole: string) => {
        try {
            await api(`/members/${memberId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) });
            setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        } catch (err: any) { alert(err.message); }
    };

    if (loading) return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-7 h-7 text-amber-600" />Committee Members</h1>
                <p className="text-gray-500">Manage masjid committee roles and permissions</p>
            </div>

            {/* Role Legend */}
            <div className="card">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Role Hierarchy</h3>
                <div className="flex flex-wrap gap-2">
                    {roles.map(r => (
                        <span key={r} className={`role-badge ${roleColors[r]}`}>{r}</span>
                    ))}
                </div>
            </div>

            {/* Members Table */}
            <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left font-medium">Member</th>
                            <th className="px-6 py-4 text-left font-medium">Email</th>
                            <th className="px-6 py-4 text-left font-medium">Role</th>
                            <th className="px-6 py-4 text-left font-medium">Joined</th>
                            {canChangeRoles && <th className="px-6 py-4 text-left font-medium">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {members.map(m => (
                            <tr key={m.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{m.full_name || 'Unnamed'}</td>
                                <td className="px-6 py-4 text-gray-500">{m.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`role-badge ${roleColors[m.role] || 'role-namazi'}`}>{m.role}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{new Date(m.created_at).toLocaleDateString()}</td>
                                {canChangeRoles && (
                                    <td className="px-6 py-4">
                                        <select
                                            value={m.role}
                                            onChange={e => handleRoleChange(m.id, e.target.value)}
                                            className="form-input py-1 text-sm"
                                        >
                                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!canChangeRoles && (
                <p className="text-center text-gray-500 text-sm">
                    💡 Only Chairman and General Secretary can change member roles
                </p>
            )}
        </div>
    );
}
