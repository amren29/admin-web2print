"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Edit, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from 'next/link';

export default function InvoiceDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/invoices/${id}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) setInvoice(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const [converting, setConverting] = useState(false);

    const handleConvertToOrder = async () => {
        if (!confirm("Convert this invoice to Production Orders? This will generate separate orders for each line item.")) return;
        setConverting(true);
        try {
            const res = await fetch(`/api/invoices/${id}/convert-to-order`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Generated ${data.ordersCreated} production orders!`);
                // Reload to show updated status
                window.location.reload();
            } else {
                toast.error("Failed: " + data.error);
            }
        } catch (e) {
            toast.error("Error converting invoice");
        } finally {
            setConverting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading invoice...</div>;
    if (!invoice) return <div className="p-10 text-center text-red-500">Invoice not found.</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Invoice Details</h1>
                <div className="flex gap-2">
                    {!invoice.convertedToOrders && (
                        <Button onClick={handleConvertToOrder} disabled={converting} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {converting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                            Convert to Order
                        </Button>
                    )}
                    {invoice.convertedToOrders && (
                        <Link href="/orders">
                            <Button variant="secondary" className="border-2 border-orange-500 text-orange-700 bg-orange-50">
                                View Orders
                            </Button>
                        </Link>
                    )}

                    <Link href={`/invoices/${id}/edit`}>
                        <Button variant="outline">
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Invoice
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" /> Print Invoice
                    </Button>
                </div>
            </div>

            <Card className="print:shadow-none">
                <CardHeader className="bg-gray-50 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">INVOICE</CardTitle>
                            <p className="font-mono text-sm text-gray-500 mt-1">#{invoice.id}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-gray-900">RM{invoice.totalAmount?.toFixed(2)}</h2>
                            <p className="text-xs text-gray-500">Total Due</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {/* Bill To */}
                    <div className="grid grid-cols-2">
                        <div>
                            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Bill To</h3>
                            <p className="font-bold text-lg">{invoice.customerName}</p>
                            <p className="text-gray-600">{invoice.phone}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Status</h3>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {invoice.status}
                            </span>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <table className="w-full text-sm">
                            <thead className="border-b-2 border-gray-100 text-left">
                                <tr>
                                    <th className="py-2 font-bold text-gray-500">Description</th>
                                    <th className="py-2 font-bold text-gray-500 text-center">Qty</th>
                                    <th className="py-2 font-bold text-gray-500 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {invoice.items?.map((item: any, i: number) => (
                                    <tr key={i}>
                                        <td className="py-4">
                                            <p className="font-bold text-gray-900">{item.productName}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.summary}</p>
                                        </td>
                                        <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                                        <td className="py-4 text-right font-bold text-gray-900">RM{item.totalPrice.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-gray-100">
                                <tr>
                                    <td colSpan={2} className="py-4 text-right text-gray-500">Subtotal</td>
                                    <td className="py-4 text-right font-bold text-gray-900">
                                        RM{invoice.items?.reduce((sum: number, item: any) => sum + item.totalPrice, 0).toFixed(2)}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={2} className="py-2 text-right text-gray-500">SST (6%)</td>
                                    <td className="py-2 text-right font-bold text-gray-900">
                                        RM{(invoice.items?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) * 0.06).toFixed(2)}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={2} className="py-4 text-right font-bold text-2xl text-blue-600">Total</td>
                                    <td className="py-4 text-right font-bold text-2xl text-blue-600">
                                        RM{(invoice.items?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) * 1.06).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
