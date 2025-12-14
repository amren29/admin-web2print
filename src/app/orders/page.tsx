"use client"

import { useState, useEffect, DragEvent } from "react";
import { Search, Filter, MoreVertical, Plus, Truck, CheckCircle, Clock, AlertCircle, X, ChevronRight, Calculator, FileText, Printer, MoreHorizontal, ArrowRight, Settings, LayoutGrid, List as ListIcon, ChevronDown, ChevronUp, Calendar, AlertTriangle, Smartphone, Trash2, Megaphone, Wallet, CreditCard, Upload, Link as LinkIcon, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// --- Types ---
interface WorkflowColumn {
    id: string;
    title: string;
    color: string;
    subtitle?: string;
}

interface Order {
    id: string;
    customer: string;
    phone: string;
    email?: string;
    total: number;
    status: string; // Dynamic status
    deadline: string;
    source: string;
    invoiceNo?: string;
    priority: string;
    specs: {
        productName: string;
        size: string;
        material: string;
        quantity: number;
        department: string;
        printSide?: string;
        finishing?: string;
    };
    date?: string;
    history?: {
        date: string;
        action: string;
        details?: string;
        user?: string;
    }[];
    issue?: {
        type: "Misprint" | "Machine" | "Material" | "Artwork" | "Other";
        description: string;
        reportedAt: string;
        active: boolean;
    };
    fileStatus?: "pending" | "received" | "issue" | "ok";
    fileUrl?: string; // Legacy
    proofs?: Array<{
        id: string;
        version: number;
        imageUrl: string;
        status: 'pending' | 'approved' | 'rejected';
        adminComment: string;
        customerComment: string;
        createdAt: string;
        respondedAt?: string;
    }>;
    paymentStatus?: 'Unpaid' | 'Paid' | 'Partial';
    paymentMethod?: string;
    agentId?: string;
}

const DEFAULT_COLUMNS: WorkflowColumn[] = [
    { id: "col-1", title: "New Order", color: "bg-gray-500", subtitle: "Web & Manual Orders" },
    { id: "col-2", title: "Artwork Checking", color: "bg-red-400", subtitle: "DPI / Bleed Check" },
    { id: "col-3", title: "Designing", color: "bg-pink-400", subtitle: "Design Proofing" },
    { id: "col-wait", title: "Waiting Customer Confirmation", color: "bg-amber-400", subtitle: "Proof Sent" },
    { id: "col-4", title: "Ready to Print", color: "bg-blue-500", subtitle: "Handover Zone" },
    { id: "col-5", title: "Production", color: "bg-indigo-500", subtitle: "Printing & RIP" },
    { id: "col-6", title: "Finishing", color: "bg-purple-500", subtitle: "Cutting, Lamination" },
    { id: "col-7", title: "Completed / Ready", color: "bg-green-500", subtitle: "QC Passed, Cleanup" },
    { id: "col-8", title: "Issue / On Hold", color: "bg-red-600", subtitle: "Production Issues" },
];

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [columns, setColumns] = useState<WorkflowColumn[]>(DEFAULT_COLUMNS);
    const [isLoaded, setIsLoaded] = useState(false);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // For Modal
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [agents, setAgents] = useState<any[]>([]);

    // URL Param Handling for Deep Linking
    const searchParams = useSearchParams();
    const urlId = searchParams.get('id');
    const urlFilter = searchParams.get('filter');

    useEffect(() => {
        if (isLoaded && urlId) {
            const target = orders.find(o => o.id === urlId);
            if (target) setSelectedOrder(target);
        }
    }, [isLoaded, urlId, orders]);

    const toggleCollapse = (id: string) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Load Data & Migrate to V2
    useEffect(() => {
        // Load Orders from API
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/orders');
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                }
            } catch (e) { console.error("Failed to fetch orders", e); }
        };
        fetchOrders();

        // Load Workflow
        const savedWorkflow = localStorage.getItem("web2print_workflow_v2");
        if (savedWorkflow) {
            try {
                let loadedCols = JSON.parse(savedWorkflow);

                // MIGRATION HELPER: Ensure columns exist in correct order if missing
                const ensureColumn = (id: string, title: string, color: string, subtitle: string, afterTitle?: string) => {
                    if (!loadedCols.find((c: any) => c.title === title)) {
                        const newCol = { id, title, color, subtitle };
                        if (afterTitle) {
                            const index = loadedCols.findIndex((c: any) => c.title === afterTitle);
                            if (index !== -1) loadedCols.splice(index + 1, 0, newCol);
                        } else {
                            loadedCols.push(newCol);
                        }
                    }
                };

                ensureColumn("col-issue", "Issue / On Hold", "bg-red-600", "Production Issues");
                ensureColumn("col-revise", "Refining", "bg-orange-500", "Artwork Changes", "Designing");
                ensureColumn("col-wait", "Waiting Customer Confirmation", "bg-amber-400", "Proof Sent", "Refining");

                setColumns(loadedCols);
                setIsLoaded(true);
            } catch (e) {
                console.error("Failed to parse workflow", e);
                setColumns(DEFAULT_COLUMNS);
                setIsLoaded(true);
            }
        } else {
            setColumns(DEFAULT_COLUMNS);
            setIsLoaded(true);
        }

        const savedCollapsed = localStorage.getItem("web2print_collapsed_cards");
        if (savedCollapsed) try { setCollapsedIds(new Set(JSON.parse(savedCollapsed))); } catch (e) { console.error(e); }

        const fetchAgents = async () => {
            try {
                const res = await fetch('/api/auth');
                const data = await res.json();
                setAgents(data.filter((u: any) => u.role === 'agent'));
            } catch (e) { console.error("Failed to fetch agents"); }
        };
        fetchAgents();

        setIsLoaded(true);
    }, []);

    // Persist Data (V2)
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("web2print_workflow_v2", JSON.stringify(columns));
            localStorage.setItem("web2print_collapsed_cards", JSON.stringify(Array.from(collapsedIds)));
        }
    }, [columns, collapsedIds, isLoaded]);

    const updateStatus = (id: string, newStatus: string) => {
        setOrders(prev => prev.map(o => {
            if (o.id === id) return { ...o, status: newStatus };
            return o;
        }));

        fetch('/api/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
        }).catch(err => console.error("Failed to update status", err));
    };

    // Add generic update function for issues
    const updateOrder = (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

        fetch('/api/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedOrder)
        }).catch(err => console.error("Failed to update order", err));
    };

    const addColumn = () => {
        const name = prompt("Enter new stage name:");
        if (name) setColumns([...columns, { id: "col-" + Date.now(), title: name, color: "bg-gray-400", subtitle: "Custom Stage" }]);
    };

    // --- Drag and Drop ---
    const onDragStart = (e: DragEvent, id: string) => e.dataTransfer.setData("orderId", id);
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent, newStatus: string) => {
        const id = e.dataTransfer.getData("orderId");
        if (id) {
            if (selectedIds.has(id)) {
                selectedIds.forEach(selectedId => updateStatus(selectedId, newStatus));
                setSelectedIds(new Set());
            } else {
                updateStatus(id, newStatus);
            }
        }
    };

    const handleHighlight = (id: string) => {
        setHighlightedId(id);
        if (viewMode === 'board') {
            document.getElementById("card-" + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => setHighlightedId(null), 3000);
    };

    if (!isLoaded) return <div className="p-8">Loading...</div>;

    // Filter Orders by Date Range & Search
    const filteredOrders = orders.filter(o => {
        if (dateRange.from && new Date(o.deadline) < new Date(dateRange.from)) return false;
        if (dateRange.to && new Date(o.deadline) > new Date(dateRange.to)) return false;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const searchString = `
                ${o.id} 
                ${o.customer} 
                ${o.phone} 
                ${o.specs?.productName || ''} 
                ${o.invoiceNo || ''}
            `.toLowerCase();
            if (!searchString.includes(q)) return false;
        }
        return true;
    });

    const overdueOrders = filteredOrders.filter(o => new Date(o.deadline) < new Date() && o.status !== 'Completed');
    const issueOrders = filteredOrders.filter(o => o.fileStatus === 'issue' || (o.issue?.active)); // Updated logic
    const urgentOrders = filteredOrders.filter(o => o.priority === 'Urgent' && o.status !== 'Completed');

    // Bulk Actions
    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedIds(new Set(filteredOrders.map(o => o.id)));
        else setSelectedIds(new Set());
    };

    const handleSelect = (id: string, e?: React.MouseEvent) => {
        setSelectedIds(prev => {
            const next = new Set(e?.ctrlKey || e?.metaKey ? prev : []);
            if (e?.ctrlKey || e?.metaKey) {
                if (next.has(id)) next.delete(id);
                else next.add(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleBulkAction = (action: string) => {
        if (confirm(`Are you sure you want to ${action} ${selectedIds.size} orders?`)) {
            if (action === 'delete') {
                setOrders(prev => prev.filter(o => !selectedIds.has(o.id)));
            } else {
                selectedIds.forEach(id => updateStatus(id, action));
            }
            setSelectedIds(new Set());
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Top Bar */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Production Board</h2>
                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 border rounded-md text-sm bg-gray-50 focus:bg-white transition-colors w-48"
                        />
                    </div>

                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-md border">
                        <span className="text-xs font-semibold text-gray-500 pl-2">Due:</span>
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="text-xs border-none bg-transparent p-1 focus:ring-0 text-gray-700 w-24"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="text-xs border-none bg-transparent p-1 focus:ring-0 text-gray-700 w-24"
                        />
                        {(dateRange.from || dateRange.to) && (
                            <button onClick={() => setDateRange({ from: '', to: '' })} className="hover:text-red-500 pr-2">
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    <div className="h-6 w-px bg-gray-200"></div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-2 ${isSidebarOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <AlertCircle className="h-4 w-4" /> Reminders
                    </button>

                    {/* View Switcher */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            title="Board View"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            title="List View"
                        >
                            <ListIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <Link href="/orders/new">
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm">
                        <Plus className="h-4 w-4" /> New Order
                    </button>
                </Link>
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden bg-gray-50/50 flex flex-col">

                    {viewMode === 'board' ? (
                        // --- BOARD VIEW ---
                        <div className="flex-1 overflow-x-auto overflow-y-hidden">
                            <div className="flex h-full p-6 gap-6 min-w-max">
                                {columns.map(col => (
                                    <div
                                        key={col.id}
                                        onDragOver={onDragOver}
                                        onDrop={(e) => onDrop(e, col.title)}
                                        className="flex flex-col w-[280px] min-w-[280px]"
                                    >
                                        <div className="flex flex-col mb-3 px-1 group">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-slate-900 text-[15px]">{col.title}</h3>
                                                <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </div>
                                            {col.subtitle && <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{col.subtitle}</div>}
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-3">
                                            {filteredOrders.filter(o => o.status === col.title).map(order => (
                                                <OrderCard
                                                    key={order.id}
                                                    order={order}
                                                    onDragStart={onDragStart}
                                                    onClick={(e: React.MouseEvent) => handleSelect(order.id, e)}
                                                    onDoubleClick={() => setSelectedOrder(order)}
                                                    isHighlighted={highlightedId === order.id}
                                                    isCollapsed={collapsedIds.has(order.id)}
                                                    onToggleCollapse={() => toggleCollapse(order.id)}
                                                    isSelected={selectedIds.has(order.id)}
                                                    onSelect={(e: React.MouseEvent) => handleSelect(order.id, e)}
                                                />
                                            ))}
                                            <Link href="/orders/new" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 px-3 py-2 text-sm transition-colors w-full text-left rounded-lg hover:bg-blue-50/50 group mt-2 border border-transparent hover:border-blue-100 border-dashed">
                                                <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" /> <span className="font-medium">New Order</span>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                                <div className="w-[50px] pt-8">
                                    <button onClick={addColumn} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm"><Plus className="h-6 w-6" /></button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // --- LIST VIEW ---
                        <div className="flex-1 overflow-auto p-6">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 w-4">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                            <th className="px-6 py-4">Order ID</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Job Specs</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Deadline</th>
                                            <th className="px-6 py-4">File</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredOrders.map(order => {
                                            const isOverdue = new Date(order.deadline) < new Date() && order.status !== 'Completed';
                                            return (
                                                <tr key={order.id} className={`hover:bg-slate-50 cursor-pointer ${highlightedId === order.id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedOrder(order)}>
                                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(order.id)}
                                                            onChange={() => handleSelect(order.id)}
                                                            className="rounded border-gray-300 text-black focus:ring-black"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-medium text-gray-900">
                                                        #{order.id}
                                                        {order.priority === 'Urgent' && <span className="ml-2 bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold">URGENT</span>}
                                                        {order.issue?.active && <span className="ml-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">ISSUE</span>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">{order.customer}</div>
                                                        <div className="text-xs text-gray-500">{order.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium">{order.specs?.quantity || 1}x {order.specs?.productName || 'Custom Order'}</div>
                                                        <div className="text-xs text-gray-500">{order.specs?.size || '-'} • {order.specs?.material || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={order.status}
                                                            onClick={(e) => e.stopPropagation()} // Prevent modal open
                                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                                            className="text-xs border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-1 pl-2 pr-6"
                                                        >
                                                            {columns.map(col => (
                                                                <option key={col.id} value={col.title}>{col.title}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {order.deadline}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${order.fileStatus === 'ok' ? 'bg-green-100 text-green-700' :
                                                            order.fileStatus === 'issue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {order.fileStatus === 'ok' ? <CheckCircle className="h-3 w-3" /> :
                                                                order.fileStatus === 'issue' ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                            <span className="capitalize">{order.fileStatus}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-gray-400 hover:text-gray-900">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {/* Bulk Action Toolbar */}
                    {selectedIds.size > 0 && (
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-40">
                            <span className="font-medium text-sm">{selectedIds.size} Selected</span>
                            <div className="h-4 w-px bg-gray-700"></div>
                            <select
                                onChange={(e) => {
                                    if (e.target.value) handleBulkAction(e.target.value);
                                    e.target.value = "";
                                }}
                                className="bg-gray-800 border-none text-xs rounded text-white focus:ring-0 cursor-pointer"
                            >
                                <option value="">Move to...</option>
                                <option value="Completed">Completed</option>
                                {columns.map(col => <option key={col.id} value={col.title}>{col.title}</option>)}
                            </select>
                            <button onClick={() => handleBulkAction('delete')} className="text-red-400 hover:text-red-300 text-sm font-medium">Delete</button>
                            <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Works for both views */}
                <div
                    className={`
                        bg-white border-l z-30 flex flex-col
                        fixed inset-y-0 right-0 h-full shadow-2xl transition-all duration-300 ease-in-out
                        md:relative md:shadow-none md:h-auto md:translate-x-0
                        ${isSidebarOpen ? 'w-[320px] translate-x-0' : 'w-0 translate-x-full md:w-0 md:translate-x-0 overflow-hidden opacity-0 md:opacity-100'}
                    `}
                    style={{ visibility: isSidebarOpen ? 'visible' : 'hidden' }}
                >
                    <div className="p-4 border-b flex items-center justify-between min-w-[320px]">
                        <h3 className="font-bold text-sm text-gray-900">Action Required</h3>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 hover:bg-gray-100 rounded">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 min-w-[320px]">
                        {issueOrders.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Issues & Holds</h4>
                                {issueOrders.map(o => <SidebarItem key={o.id} order={o} onClick={() => handleHighlight(o.id)} type="issue" />)}
                            </div>
                        )}
                        {/* ... overdue/urgent ... */}
                        {overdueOrders.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">Overdue</h4>
                                {overdueOrders.map(o => <SidebarItem key={o.id} order={o} onClick={() => handleHighlight(o.id)} type="overdue" />)}
                            </div>
                        )}
                        {urgentOrders.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Urgent</h4>
                                {urgentOrders.map(o => <SidebarItem key={o.id} order={o} onClick={() => handleHighlight(o.id)} type="urgent" />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal - Works for both views */}
            {selectedOrder && (
                <OrderModal
                    order={selectedOrder}
                    agents={agents}
                    onClose={() => setSelectedOrder(null)}
                    onDelete={() => {
                        setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
                        setSelectedOrder(null);
                    }}
                    onUpdate={(updated) => {
                        updateOrder(updated); // Use API generic update
                        setSelectedOrder(updated); // Keep modal open and refresh data
                    }}
                    columns={columns}
                />
            )}
        </div>
    );
}

// --- Components ---

function SidebarItem({ order, onClick, type }: { order: Order, onClick: () => void, type: 'issue' | 'overdue' | 'urgent' }) {
    const borderClass = type === 'issue' ? 'border-red-200 bg-red-50/50' : type === 'overdue' ? 'border-orange-200 bg-orange-50/50' : 'border-purple-200 bg-purple-50/50';
    return (
        <div onClick={onClick} className={`p-3 border rounded-xl cursor-pointer hover:shadow-md transition-all text-sm ${borderClass}`}>
            <div className="flex justify-between items-start mb-1">
                <span className="font-mono font-bold text-slate-600 text-xs">#{order.id}</span>
                {order.issue?.active && <AlertTriangle className="h-3 w-3 text-red-500" />}
            </div>
            <p className="font-medium text-slate-800 truncate">{order.customer}</p>
            {order.issue?.active && type === 'issue' && (
                <p className="text-xs text-red-600 mt-1">{order.issue.type}: {order.issue.description}</p>
            )}
        </div>
    )
}

function OrderCard({ order, onDragStart, isHighlighted, onClick, onDoubleClick, isSelected, onSelect }: any) {
    const isOverdue = new Date(order.deadline) < new Date();
    const hasIssue = order.issue?.active;

    // Tag Color Logic
    const getTagStyle = (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes('website') || lower === 'new order') return "bg-indigo-100 text-indigo-700";
        if (lower.includes('marketing')) return "bg-rose-100 text-rose-700";
        if (lower.includes('management') || lower.includes('admin')) return "bg-amber-100 text-amber-700";
        if (lower.includes('system') || lower === 'reorder') return "bg-slate-100 text-slate-700";
        if (lower.includes('product') || lower === 'printing') return "bg-purple-100 text-purple-700";
        return "bg-blue-50 text-blue-600";
    }

    return (
        <div
            id={`card-${order.id}`}
            draggable
            onDragStart={(e) => onDragStart(e, order.id)}
            onClick={(e) => onSelect(e)}
            onDoubleClick={onDoubleClick}
            className={`
                bg-white p-5 rounded-3xl border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative select-none
                ${isHighlighted ? 'ring-2 ring-blue-500 shadow-lg scale-[1.02] z-10' : ''}
                ${isSelected ? 'ring-2 ring-blue-600 bg-blue-50/10' : ''}
                ${hasIssue ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100'}
            `}
        >
            {/* Top: Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
                {order.priority === 'Urgent' && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">Urgent</span>
                )}
                {/* Dynamically Generate Tags from Specs or Status */}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getTagStyle(order.specs?.department || 'Website')}`}>
                    {order.specs?.department || 'Website'}
                </span>
                {order.specs?.productName && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getTagStyle('Product')}`}>
                        Product
                    </span>
                )}
            </div>

            {/* Content: Title */}
            <div className="mb-4">
                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                    {order.specs?.productName || `Order #${order.id}`}
                </h4>
                {order.issue?.active && (
                    <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> {order.issue.type}
                    </p>
                )}
            </div>

            {/* Bottom: Avatar, Date, Check */}
            <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-1">
                <div className="flex items-center gap-2">
                    {/* Avatar Circle */}
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                        {order.customer ? (
                            <span className="text-[9px] font-bold text-slate-500">{order.customer.charAt(0)}</span>
                        ) : (
                            <User size={12} className="text-slate-400" />
                        )}
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                        {new Date(order.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400 font-bold text-xs">
                    {/* Mock Checklist: If paid + file ok = 2/2 */}
                    <CheckCircle size={14} className={order.fileStatus === 'ok' && order.paymentStatus === 'Paid' ? "text-emerald-500" : "text-slate-300"} />
                    <span>
                        {(order.fileStatus === 'ok' ? 1 : 0) + (order.paymentStatus === 'Paid' ? 1 : 0)}/2
                    </span>
                </div>
            </div>
        </div>
    );
}

function OrderModal({ order, onClose, onDelete, onUpdate, columns, agents }: { order: Order, onClose: () => void, onDelete: () => void, onUpdate: (o: Order) => void, columns: WorkflowColumn[], agents: any[] }) {
    const [status, setStatus] = useState(order.status);
    const [isIssuing, setIsIssuing] = useState(false);
    const [issueType, setIssueType] = useState<string>('Misprint');
    const [issueDesc, setIssueDesc] = useState("");
    const [isPaying, setIsPaying] = useState(false);

    // Find Agent
    const [linkedAgentId, setLinkedAgentId] = useState(order.agentId || "");

    useEffect(() => {
        if (!linkedAgentId && agents) {
            const autoMatch = agents.find(a =>
                a.name.toLowerCase() === order.customer.toLowerCase() ||
                a.email === order.email
            );
            if (autoMatch) setLinkedAgentId(autoMatch.id);
        }
    }, [agents, order, linkedAgentId]);

    const matchedAgent = agents?.find(a => a.id === linkedAgentId);

    // Customer/Agent Selection State
    const [selectedUserId, setSelectedUserId] = useState(order.agentId || "");
    const selectedUser = agents?.find(a => a.id === selectedUserId);

    const handleCustomerChange = (userId: string) => {
        setSelectedUserId(userId);
        const user = agents?.find(a => a.id === userId);
        if (user) {
            // Update order with new customer details
            const updated = {
                ...order,
                customer: user.name,
                email: user.email,
                phone: user.phone || order.phone,
                agentId: user.role === 'agent' ? user.id : undefined
            };
            onUpdate(updated);
        }
    };

    const handleSave = () => {
        if (status !== order.status) {
            const historyEntry = {
                date: new Date().toISOString(),
                action: "Status Update",
                details: `Changed status from '${order.status}' to '${status}'`,
                user: "Admin" // TODO: Use real user context
            };
            onUpdate({
                ...order,
                status,
                history: [...(order.history || []), historyEntry]
            });
        } else {
            onUpdate({ ...order, status });
        }
        onClose();
    };

    const handleReportIssue = () => {
        const updatedOrder: Order = {
            ...order,
            status: "Issue / On Hold", // Move to Issue column
            issue: {
                type: issueType as any,
                description: issueDesc,
                reportedAt: new Date().toISOString(),
                active: true
            }
        };
        onUpdate(updatedOrder);
        setIsIssuing(false); // Close internal dialog
    };

    const handleResolveIssue = () => {
        if (!confirm("Are you sure you want to mark this issue as resolved?")) return;
        const updatedOrder: Order = {
            ...order,
            // Keep status or move to Production? Let's keep status manual but remove flag
            issue: { ...order.issue!, active: false }
        };
        onUpdate(updatedOrder);
    };

    const handleWalletPayment = async () => {
        if (!matchedAgent) return;
        if (!confirm(`Deduct RM ${order.total} from ${matchedAgent.name}'s wallet?`)) return;

        setIsPaying(true);
        try {
            const res = await fetch('/api/orders/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    agentId: matchedAgent.id,
                    amount: order.total
                })
            });
            const data = await res.json();

            if (res.ok) {
                // toast.success("Payment successful"); // Assuming toast library is available
                console.log("Payment successful");
                onUpdate(data.order); // Update listing with new status
            } else {
                // toast.error(data.error || "Payment failed"); // Assuming toast library is available
                console.error("Payment failed:", data.error);
            }
        } catch (e) {
            // toast.error("Payment error"); // Assuming toast library is available
            console.error("Payment error:", e);
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm print-modal">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Order #{order.id}
                            {order.priority === 'Urgent' && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Urgent</span>}
                            {order.issue?.active && <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">ISSUE</span>}
                            {order.paymentStatus === 'Paid' && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CreditCard size={10} /> PAID</span>}
                        </h2>
                        <p className="text-sm text-gray-500">{new Date(order.date || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8 flex-1">

                    {/* ISSUE ALERT */}
                    {order.issue?.active && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-red-800">Production Issue Reported</h3>
                                <p className="text-sm text-red-700 mt-1">Reason: <span className="font-semibold">{order.issue.type}</span></p>
                                <p className="text-sm text-red-600 mt-1">{order.issue.description}</p>
                                <p className="text-xs text-red-400 mt-2">Reported: {new Date(order.issue.reportedAt).toLocaleString()}</p>
                                <Button variant="outline" size="sm" className="mt-3 border-red-300 text-red-700 hover:bg-red-100" onClick={handleResolveIssue}>
                                    Mark Resolved
                                </Button>
                            </div>
                        </div>
                    )}


                    {/* 1. Customer Order Details */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">Customer Order Details</h3>
                        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Customer</label>
                                    <p className="font-medium text-gray-900">{order.customer}</p>
                                    <p className="text-sm text-gray-500 text-xs">{order.phone}</p>
                                    {order.email && <p className="text-sm text-gray-500 text-xs">{order.email}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Product</label>
                                    <p className="font-medium text-gray-900">{order.specs?.productName || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Quantity</label>
                                    <p className="font-medium text-gray-900">{order.specs?.quantity || 1}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Deadline</label>
                                    <p className="font-medium text-gray-900">{new Date(order.deadline).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Size & Material</label>
                                    <p className="font-medium text-gray-900">{order.specs?.size || 'Standard'} • {order.specs?.material || 'Standard'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Total</label>
                                    <p className="font-bold text-xl text-gray-900">RM {order.total?.toFixed(2) || '0.00'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Current Status */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">Current Status</h3>
                        <div className="flex gap-2">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 h-10"
                            >
                                {columns.map(col => (
                                    <option key={col.id} value={col.title}>{col.title}</option>
                                ))}
                            </select>
                            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium h-10 hover:bg-blue-700 transition-colors shadow-sm">Update Status</button>
                        </div>
                    </div>


                    {/* 3. Artwork Proofing */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Artwork Proofing
                            </h3>
                            {order.fileStatus === 'received' && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold">Files Uploaded</span>}
                        </div>

                        <div className="p-4 space-y-4 bg-white">

                            {/* Refining Feedback Alert */}
                            {order.status === 'Refining' && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                                    <p className="font-bold flex items-center gap-2 mb-1">
                                        <AlertTriangle className="h-4 w-4" /> Customer Requested Changes/Refining
                                    </p>
                                    <p className="italic pl-6">
                                        "{order.history?.slice().reverse().find(h => h.action === 'Customer Proof Response')?.details?.replace('Changes Requested: ', '') || 'No details provided'}"
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        disabled={order.status !== 'Artwork Checking'}
                                        onChange={async (e) => { /* Reuse existing upload logic */
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            if (file.size > 10 * 1024 * 1024) {
                                                alert("File size too large (Max 10MB)");
                                                return;
                                            }

                                            const formData = new FormData();
                                            formData.append('file', file);

                                            try {
                                                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                const data = await res.json();

                                                if (res.ok) {
                                                    const updatedOrder = {
                                                        ...order,
                                                        fileUrl: data.url,
                                                        fileStatus: 'received' as const,
                                                        status: 'Waiting Customer Confirmation',
                                                        history: [...(order.history || []), { date: new Date().toISOString(), action: "Artwork Uploaded", details: "Waiting for customer approval", user: "Designer" }]
                                                    };
                                                    onUpdate(updatedOrder);
                                                    alert("File uploaded! Status moved to 'Waiting Customer Confirmation'.");
                                                } else { alert("Upload failed: " + data.error); }
                                            } catch (err) { console.error(err); alert("Upload error"); }
                                        }}
                                    />
                                    {order.status === 'Artwork Checking' ? (
                                        <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                                            <Upload className="h-4 w-4 mr-2" /> Upload New Proof
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" disabled title="Move status to 'Artwork Checking' to upload">
                                            <Upload className="h-4 w-4 mr-2" /> Upload Locked
                                        </Button>
                                    )}
                                </div>

                                {order.fileUrl && (
                                    <>
                                        <Link href={order.fileUrl} target="_blank">
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                View File
                                            </Button>
                                        </Link>

                                        <div className="h-4 w-px bg-gray-300 mx-1"></div>

                                        <Button variant="secondary" size="sm" className="ml-auto" onClick={() => {
                                            const url = `${window.location.origin}/proof/${order.id}`;
                                            navigator.clipboard.writeText(url);
                                            alert("Proof Link Copied!\n" + url);
                                        }}>
                                            <LinkIcon className="h-4 w-4 mr-2" /> Share Proof Link
                                        </Button>
                                    </>
                                )}
                            </div>

                            {order.fileUrl ? (
                                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-dashed flex gap-3">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-700 mb-1">Status Message:</p>
                                        <p>{order.status === 'Waiting Customer Confirmation' ? "Waiting for customer to review." : order.status === 'Ready to Print' ? "Customer approved artwork." : "Proof uploaded."}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic text-center py-2">No artwork uploaded yet.</p>
                            )}
                        </div>
                    </div>


                    {/* 4. Actions Toolbar (Jobsheet & Issues) */}
                    <div className="pt-4 border-t flex items-center justify-between">
                        <Link href={`/orders/${order.id}/print`} target="_blank">
                            <Button variant="outline" className="flex items-center gap-2 border-gray-300">
                                <Printer className="h-4 w-4" /> Print Jobsheet
                            </Button>
                        </Link>

                        <div className="ml-auto">
                            <Dialog open={isIssuing} onOpenChange={setIsIssuing}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-2">
                                        <Megaphone className="h-4 w-4" /> Report Issue
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Report Production Issue</DialogTitle>
                                        <DialogDescription>Flag this order to halt production and notify the team.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>Issue Type</Label>
                                            <Select value={issueType} onValueChange={setIssueType}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Misprint">Misprint / Quality Fail</SelectItem>
                                                    <SelectItem value="Machine">Machine Breakdown</SelectItem>
                                                    <SelectItem value="Material">Out of Stock / Material Issue</SelectItem>
                                                    <SelectItem value="Artwork">Artwork Error</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                placeholder="Describe the problem..."
                                                value={issueDesc}
                                                onChange={(e) => setIssueDesc(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsIssuing(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={handleReportIssue}>Confirm Issue</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                </div>

                {/* 5. Activity Log (Timeline) */}
                <div className="bg-gray-50 border-t p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Activity Log
                    </h3>
                    <div className="space-y-6 pl-2">
                        {/* Order Created (Implicit Start) */}
                        <div className="relative pl-6 border-l-2 border-gray-200 pb-1">
                            <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-gray-300 ring-4 ring-gray-50"></div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Order Created</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Order received via {order.source || 'Manual Entry'}</p>
                                </div>
                                <span className="text-xs font-mono text-gray-400 mt-1 sm:mt-0">
                                    {new Date(order.date || Date.now()).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* History Entries */}
                        {order.history?.map((entry, i) => (
                            <div key={i} className="relative pl-6 border-l-2 border-gray-200 last:border-transparent pb-1">
                                <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-gray-50"></div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{entry.action}</p>
                                        {entry.details && <p className="text-xs text-gray-600 mt-0.5">{entry.details}</p>}
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mt-1 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> {entry.user || 'System'}
                                        </p>
                                    </div>
                                    <span className="text-xs font-mono text-gray-400 mt-1 sm:mt-0">
                                        {new Date(entry.date).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
