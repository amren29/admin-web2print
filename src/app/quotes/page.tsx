"use client";

import { useState, useEffect } from 'react';
import { User, Calendar, Trash2, Edit, Building, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            const response = await fetch('/api/quotes');
            if (response.ok) {
                const data = await response.json();
                setQuotes(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load quotes");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this quote?")) return;

        try {
            const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Quote deleted");
                setQuotes(quotes.filter(q => q.id !== id));
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            toast.error("Failed to delete quote");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading quotes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quotes & Leads</h1>
                    <p className="text-muted-foreground text-gray-500">Manage quote requests and potential leads.</p>
                </div>
                <Link href="/quotes/create">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 gap-2">
                        <Plus size={16} /> Create Quote (POS)
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700">Recent Requests</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Lead Details</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3">Value</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No quotes found yet.
                                    </td>
                                </tr>
                            ) : (
                                quotes.map((quote: any) => (
                                    <tr key={quote.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-900">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(quote.createdAt).toLocaleDateString('en-MY')}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(quote.createdAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 flex items-center gap-2">
                                                <User size={14} className="text-blue-500" /> {quote.customerName}
                                            </div>
                                            {quote.phone && (
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {quote.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{quote.items?.length || 0} Items</div>
                                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                                                {quote.items?.[0]?.productName} {quote.items?.length > 1 ? `+${quote.items.length - 1} more` : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-blue-600">
                                            RM{parseFloat(quote.totalAmount || '0').toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                {quote.status || 'New'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/quotes/${quote.id}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </Link>

                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(quote.id)}>
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
