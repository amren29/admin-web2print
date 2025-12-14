"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    CreditCard, Package, Users, TrendingUp, TrendingDown,
    ArrowUp, ArrowDown, Wallet, Printer, AlertCircle, Clock,
    CheckCircle, ExternalLink, MoreVertical, ChevronRight, BellRing
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface DashboardStats {
    revenue: number;
    pendingPaymentCount: number;
    productionCount: number;
    totalCustomers: number;
    overdueOrders: any[];
    recentOrders: any[];
    topAgents: any[];
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        revenue: 0,
        pendingPaymentCount: 0,
        productionCount: 0,
        totalCustomers: 0,
        overdueOrders: [],
        recentOrders: [],
        topAgents: []
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load data from Storage
        const orders = JSON.parse(localStorage.getItem("web2print_orders") || "[]");
        const customers = JSON.parse(localStorage.getItem("web2print_customers") || "[]");
        const users = JSON.parse(localStorage.getItem("web2print_users") || "[]");
        const agents = users.filter((u: any) => u.role === 'agent') || [];

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // 1. Today's Revenue
        const todayRevenue = orders
            .filter((o: any) => {
                const date = new Date(o.date || o.createdAt).getTime();
                return date >= startOfDay && o.status !== 'Cancelled';
            })
            .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

        // 2. Pending Payments
        const pendingCount = orders.filter((o: any) => o.paymentStatus && o.paymentStatus !== 'Paid').length;

        // 3. Production Count
        const productionStatuses = ['Printing', 'In Production', 'Finishing', 'Processing', 'Artwork Checking', 'Refining', 'Wait', 'Waiting Customer Confirmation', 'Ready to Print', 'Designing'];
        const productionCount = orders.filter((o: any) => productionStatuses.includes(o.status)).length;

        // 4. Overdue Orders
        const overdue = orders
            .filter((o: any) => {
                const deadline = new Date(o.deadline).getTime();
                return deadline < now.getTime() && !['Completed', 'Shipped', 'Cancelled'].includes(o.status);
            })
            .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

        // 5. Recent Orders
        const recent = [...orders]
            .sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
            .slice(0, 5);

        // 6. Top Agents
        const agentSales: Record<string, number> = {};
        orders.forEach((o: any) => {
            if (o.agentId && o.status !== 'Cancelled') {
                agentSales[o.agentId] = (agentSales[o.agentId] || 0) + (o.total || 0);
            } else if (o.customer && !o.agentId && o.status !== 'Cancelled') {
                const matched = agents.find((a: any) => a.name === o.customer);
                if (matched) {
                    agentSales[matched.id] = (agentSales[matched.id] || 0) + (o.total || 0);
                }
            }
        });

        const topAgents = Object.entries(agentSales)
            .map(([id, total]) => {
                const agent = agents.find((a: any) => a.id === id) || { name: 'Unknown', id };
                return { name: agent.name, total };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        setStats({
            revenue: todayRevenue,
            pendingPaymentCount: pendingCount,
            productionCount: productionCount,
            totalCustomers: customers.length,
            overdueOrders: overdue,
            recentOrders: recent,
            topAgents: topAgents
        });
        setMounted(true);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", minimumFractionDigits: 0 }).format(amount);
    };

    const getDaysLate = (deadline: string) => {
        const diff = new Date().getTime() - new Date(deadline).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    // Custom Tooltip for Agent Chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 p-3 shadow-xl rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <p className="text-sm font-bold text-white mb-1">{payload[0].payload.name}</p>
                    <p className="text-xs text-blue-300 font-medium">Sales: {formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    if (!mounted) return <div className="min-h-screen flex items-center justify-center text-slate-400 animate-pulse">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans text-slate-800 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
                    <p className="text-slate-500 mt-1 font-medium text-sm">Real-time overview of your business performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-2 text-xs font-bold bg-white px-3 py-1.5 rounded-full text-slate-500 border border-slate-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                    </span>
                    <span className="text-xs font-medium text-slate-400 px-1">
                        {new Date().toLocaleDateString('en-MY', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Row 1: KPI Cards (4 Cols) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 1. Today's Revenue */}
                <div className="bg-gradient-to-br from-white to-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between h-[160px]">
                    <div className="flex justify-between items-start">
                        <div className="p-3.5 bg-white rounded-2xl text-blue-600 shadow-sm ring-1 ring-slate-100 group-hover:scale-105 transition-transform">
                            <Wallet size={24} strokeWidth={2.5} />
                        </div>
                        {stats.revenue > 0 &&
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-100">
                                <TrendingUp size={12} /> +12%
                            </span>
                        }
                    </div>
                    <div>
                        <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider mb-1">Today's Revenue</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(stats.revenue)}</h3>
                    </div>
                </div>

                {/* 2. Pending Payments (Red Alert) */}
                <Link href="/orders?filter=unpaid" className="block h-full cursor-pointer group">
                    <div className={cn(
                        "p-6 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between h-[160px] transition-all duration-300 hover:shadow-md group-hover:-translate-y-1",
                        stats.pendingPaymentCount > 0
                            ? "bg-gradient-to-br from-white to-red-50 border-red-100 ring-2 ring-red-50"
                            : "bg-gradient-to-br from-white to-slate-50/50 border-slate-100"
                    )}>
                        <div className="flex justify-between items-start">
                            <div className={cn(
                                "p-3.5 rounded-2xl shadow-sm ring-1 ring-inset group-hover:scale-105 transition-transform",
                                stats.pendingPaymentCount > 0 ? "bg-red-100 text-red-600 ring-red-200" : "bg-white text-slate-600 ring-slate-100"
                            )}>
                                <CreditCard size={24} strokeWidth={2.5} />
                            </div>
                            <ExternalLink size={16} className={cn("transition-colors", stats.pendingPaymentCount > 0 ? "text-red-400 group-hover:text-red-600" : "text-slate-300 group-hover:text-blue-500")} />
                        </div>
                        <div>
                            <p className={cn("font-semibold text-xs uppercase tracking-wider mb-1", stats.pendingPaymentCount > 0 ? "text-red-600 font-bold" : "text-slate-500")}>Pending Payments</p>
                            <div className="flex items-center gap-2">
                                <h3 className={cn("text-3xl font-extrabold tracking-tight", stats.pendingPaymentCount > 0 ? "text-red-900" : "text-slate-900")}>{stats.pendingPaymentCount}</h3>
                                {stats.pendingPaymentCount > 0 && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                            </div>
                            {stats.pendingPaymentCount > 0 && <p className="text-[10px] text-red-600 font-bold mt-1">Action Required</p>}
                        </div>
                    </div>
                </Link>

                {/* 3. In Production */}
                <Link href="/orders" className="block h-full cursor-pointer group">
                    <div className="bg-gradient-to-br from-blue-50/80 to-white p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-[160px] transition-all duration-300 hover:shadow-md group-hover:-translate-y-1">
                        <div className="flex justify-between items-start">
                            <div className="p-3.5 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
                                <Printer size={24} strokeWidth={2.5} />
                            </div>
                            <div className="bg-white/50 p-1.5 rounded-full text-blue-400 group-hover:text-blue-600 transition-colors">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                        <div>
                            <p className="text-blue-600/80 font-bold text-xs uppercase tracking-wider mb-1">In Production</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.productionCount}</h3>
                            <p className="text-[10px] font-semibold text-blue-400 mt-1 uppercase tracking-wide">Active Jobs</p>
                        </div>
                    </div>
                </Link>

                {/* 4. Total Customers */}
                <div className="bg-gradient-to-br from-white to-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between h-[160px]">
                    <div className="flex justify-between items-start">
                        <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl text-white shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
                            <Users size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider mb-1">Total Customers</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalCustomers}</h3>
                    </div>
                </div>
            </div>

            {/* Row 2: Urgent Alerts (Overdue & Recent) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Col A: Overdue Jobs */}
                <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden flex flex-col h-[420px] ring-1 ring-red-50">
                    <div className="p-6 border-b border-red-50 bg-gradient-to-r from-red-50/80 to-white flex justify-between items-center backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Overdue Jobs</h3>
                                <p className="text-xs text-red-600 font-medium">Requires immediate attention</p>
                            </div>
                        </div>
                        <span className="bg-white text-red-700 border border-red-100 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                            {stats.overdueOrders.length} Late
                        </span>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {stats.overdueOrders.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase font-bold sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-4">Order Details</th>
                                        <th className="px-6 py-4 text-right">Deadline Status</th>
                                        <th className="px-6 py-4 text-right w-20"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats.overdueOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-red-50/30 cursor-pointer transition-colors group"
                                            onClick={() => router.push(`/orders?id=${order.id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-500 text-xs shadow-inner">
                                                        #{order.id.toString().slice(-3)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">#{order.id}</div>
                                                        <div className="text-xs font-medium text-slate-500">{order.customer}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                    <Clock size={12} />
                                                    {getDaysLate(order.deadline)} Days Late
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="p-2 rounded-full hover:bg-white text-slate-300 group-hover:text-blue-500 transition-all inline-block shadow-sm opacity-0 group-hover:opacity-100">
                                                    <ExternalLink size={16} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/30">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h4 className="font-bold text-slate-700">All Clear!</h4>
                                <p className="text-sm font-medium text-slate-500 mt-1">No overdue orders at the moment.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Col B: Recent Orders */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[420px]">
                    <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Recent Orders</h3>
                                <p className="text-xs text-slate-400 font-medium">Latest incoming requests</p>
                            </div>
                        </div>
                        <Link href="/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
                            View All
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase font-bold sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-6 py-4">Order</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.recentOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/orders?id=${order.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-slate-900">#{order.id}</span>
                                                <span className="text-xs font-medium text-slate-500 truncate max-w-[120px]">{order.customer}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    order.status === 'Completed' ? "bg-emerald-500" :
                                                        order.status === 'New Order' ? "bg-blue-500" :
                                                            "bg-slate-400"
                                                )} />
                                                <span className={cn(
                                                    "text-xs font-bold px-2.5 py-1 rounded-full border",
                                                    order.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                        order.status === 'New Order' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                            "bg-slate-100 text-slate-600 border-slate-200"
                                                )}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(order.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Row 3: Sales Performance (Top Agents) */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5">
                    <TrendingUp size={120} />
                </div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Top Performing Agents</h3>
                        <p className="text-slate-500 text-sm mt-1">Leaderboard based on total revenue generation.</p>
                    </div>
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                        <MoreVertical size={20} />
                    </div>
                </div>
                <div className="h-[320px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={stats.topAgents}
                            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                            barSize={32}
                        >
                            <defs>
                                <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#2563eb" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fill: '#334155', fontSize: 13, fontWeight: 600 }}
                                width={120}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.5 }} />
                            <Bar dataKey="total" fill="url(#blueGradient)" radius={[0, 8, 8, 0]} animationDuration={1000}>
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    {stats.topAgents.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                            <div className="text-center text-slate-400">
                                <Users size={40} className="mx-auto mb-2 opacity-20" />
                                <p>No performance data available yet.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
