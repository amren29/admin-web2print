"use client";

import { useEffect, useState } from "react";
import { DollarSign, Trash2, Calendar, FileText, User, Printer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from 'next/link';

import { generateCSV, downloadCSV } from "@/lib/accounting";

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const handleExportCSV = () => {
        const csv = generateCSV(invoices);
        downloadCSV(csv, `invoices_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success("CSV Exported successfully");
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await fetch('/api/invoices');
            if (response.ok) {
                const data = await response.json();
                setInvoices(data);
            }
        } catch (error) {
            toast.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;

        try {
            const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Invoice deleted");
                setInvoices(invoices.filter(i => i.id !== id));
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            toast.error("Failed to delete invoice");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading invoices...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invoices</h1>
                    <p className="text-muted-foreground text-gray-500">Manage customer invoices.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                        <FileText size={16} /> Export CSV
                    </Button>
                    <Link href="/invoices/create">
                        <Button className="bg-purple-600 text-white hover:bg-purple-700 gap-2">
                            <Plus size={16} /> Create Invoice
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Invoice #</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No invoices found. Convert a quote to start.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice: any) => (
                                    <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {invoice.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(invoice.createdAt).toLocaleDateString('en-MY')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{invoice.customerName}</div>
                                            <div className="text-xs text-gray-500">{invoice.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-green-600">
                                            RM{parseFloat(invoice.totalAmount || '0').toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/invoices/${invoice.id}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <FileText className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
