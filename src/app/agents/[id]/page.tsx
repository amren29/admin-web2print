"use client";

import UserForm from "@/components/users/UserForm";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, History, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditAgentPage() {
    const params = useParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Wallet State
    const [walletData, setWalletData] = useState<{ balance: number, history: any[] }>({ balance: 0, history: [] });
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [txType, setTxType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [txLoading, setTxLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch User
                const resAuth = await fetch('/api/auth');
                const users = await resAuth.json();
                const found = users.find((u: any) => u.id === params.id);
                setUser(found);

                // Fetch Wallet
                fetchWallet();
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        load();
    }, [params.id]);

    const fetchWallet = async () => {
        try {
            const res = await fetch(`/api/wallet/${params.id}`);
            const data = await res.json();
            setWalletData(data);
        } catch (e) { console.error("Wallet fetch failed"); }
    };

    const handleTransaction = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return toast.error("Invalid amount");
        if (!description) return toast.error("Description required");

        setTxLoading(true);
        try {
            const res = await fetch('/api/wallet/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: params.id,
                    type: txType,
                    amount: Number(amount),
                    description,
                    createdBy: 'admin' // In real app, get current admin ID
                })
            });
            if (!res.ok) throw new Error("Transaction failed");

            toast.success("Transaction successful");
            setWalletModalOpen(false);
            setAmount("");
            setDescription("");
            fetchWallet(); // Refresh wallet data
        } catch (e) {
            toast.error("Failed to process transaction");
        } finally {
            setTxLoading(false);
        }
    };

    if (loading) return <div className="p-10">Loading...</div>;
    if (!user) return <div className="p-10">Agent not found</div>;

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Manage Agent: {user.name}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Edit Profile */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile & Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <UserForm mode="edit" section="agent" initialData={user} />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Wallet */}
                <div className="space-y-6">
                    {/* Balance Card */}
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-slate-300">Wallet Balance</CardDescription>
                            <CardTitle className="text-3xl font-mono">RM {walletData.balance.toFixed(2)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white border-0"
                                    size="sm"
                                    onClick={() => { setTxType('CREDIT'); setWalletModalOpen(true); }}
                                >
                                    <ArrowUpCircle className="mr-2 h-4 w-4" /> Top Up
                                </Button>
                                <Button
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
                                    size="sm"
                                    onClick={() => { setTxType('DEBIT'); setWalletModalOpen(true); }}
                                >
                                    <ArrowDownCircle className="mr-2 h-4 w-4" /> Deduct
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transaction History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <History size={16} /> Transaction History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[400px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <tbody className="divide-y">
                                        {walletData.history.length === 0 ? (
                                            <tr><td className="p-4 text-center text-muted-foreground text-xs">No transactions yet.</td></tr>
                                        ) : walletData.history.map((tx: any) => (
                                            <tr key={tx.id}>
                                                <td className="p-3">
                                                    <div className="font-medium">{tx.description}</div>
                                                    <div className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</div>
                                                </td>
                                                <td className={`p-3 text-right font-mono ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.type === 'CREDIT' ? '+' : '-'}RM {tx.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Transaction Dialog */}
            <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{txType === 'CREDIT' ? 'Top Up Wallet' : 'Deduct from Wallet'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 rounded bg-slate-50 border text-sm">
                            Current Balance: <span className="font-bold">RM {walletData.balance.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount (RM)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description / Reference</Label>
                            <Input
                                placeholder={txType === 'CREDIT' ? "e.g. Bank Transfer Ref 123" : "e.g. Order Correction"}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWalletModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleTransaction}
                            disabled={txLoading}
                            className={txType === 'CREDIT' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                        >
                            {txLoading ? 'Processing...' : 'Confirm Transaction'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
