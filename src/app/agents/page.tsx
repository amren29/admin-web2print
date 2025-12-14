"use client";

import { Search, Award } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminAgentsPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [tiers, setTiers] = useState<any[]>([]);

    useEffect(() => {
        fetchUsers();
        fetchTiers();
    }, []);

    const fetchTiers = async () => {
        try {
            const res = await fetch('/api/tiers');
            const data = await res.json();
            setTiers(data);
        } catch (e) { console.error("Failed to load tiers"); }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/auth');
            const data = await res.json();
            setUsers(data);
        } catch (e) {
            console.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete agent ${name}?`)) return;
        try {
            await fetch(`/api/auth?id=${id}`, { method: 'DELETE' });
            toast.success("Agent deleted");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    // Filter: ONLY show AGENTS
    const filtered = users.filter(user =>
        user.role === 'agent' &&
        (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div className="p-10">Loading agents...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Agents</h1>
                    <p className="text-sm text-muted-foreground">Manage Resellers and Tiers.</p>
                </div>
                <Link href="/agents/new">
                    <Button>Add Agent</Button>
                </Link>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b bg-gray-50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search agents..."
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Tier</th>
                            <th className="px-6 py-3">Wallet</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No agents found.</td></tr>
                        ) : filtered.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4">
                                    <div className="font-bold flex items-center gap-2">
                                        <Award size={14} className="text-orange-500" />
                                        {user.name}
                                    </div>
                                    <div className="text-gray-500 text-xs">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    {user.tierId ? (
                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                            {tiers.find(t => t.id === user.tierId)?.name || user.tierId}
                                            <span className="ml-1 text-[10px] opacity-70">({user.agent_discount_percent}%)</span>
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-gray-500">{user.agent_discount_percent}% (Legacy)</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-mono font-medium text-blue-600">
                                    RM {(user.walletBalance || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/agents/${user.id}`}>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(user.id, user.name)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
