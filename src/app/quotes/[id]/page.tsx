"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, CheckCircle, FileText } from "lucide-react";
import Link from 'next/link';

export default function QuoteDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/quotes/${id}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) setQuote(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const [converting, setConverting] = useState(false);

    const handleConvertToInvoice = async () => {
        if (!confirm("Generate Invoice for this Quote?")) return;
        setConverting(true);
        try {
            const res = await fetch(`/api/quotes/${id}/convert`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                // Refresh or redirect
                alert("Invoice Generated!");
                window.location.href = `/invoices/${data.invoiceId}`;
            } else {
                alert("Failed: " + data.error);
            }
        } catch (e) {
            alert("Error converting quote");
        } finally {
            setConverting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading quote...</div>;
    if (!quote) return <div className="p-10 text-center text-red-500">Quote not found.</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Quote Details</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Share2 className="mr-2 h-4 w-4" /> Share / Print
                    </Button>
                    {quote.status !== 'Converted' && (
                        <Button onClick={handleConvertToInvoice} disabled={converting} className="bg-purple-600 hover:bg-purple-700">
                            {converting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                            Convert to Invoice
                        </Button>
                    )}
                    {quote.status === 'Converted' && quote.invoiceId && (
                        <Link href={`/invoices/${quote.invoiceId}`}>
                            <Button variant="secondary" className="border-2 border-green-500 text-green-700 bg-green-50">
                                View Invoice
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader className="bg-gray-50 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Quote #{quote.id}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">Generated on {new Date(quote.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-blue-600">RM{quote.totalAmount?.toFixed(2)}</h2>
                            <p className="text-xs text-gray-500">Total Estimate</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-xs font-bold uppercase text-gray-500">Customer</h3>
                            <p className="font-medium text-lg">{quote.customerName}</p>
                            <p className="text-sm text-gray-600">{quote.phone}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs font-bold uppercase text-gray-500">Status</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {quote.status}
                            </span>
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Line Items</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b text-xs font-bold uppercase text-gray-500 text-left">
                                    <tr>
                                        <th className="px-4 py-2">Item</th>
                                        <th className="px-4 py-2 text-center">Qty</th>
                                        <th className="px-4 py-2 text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {quote.items?.map((item: any, i: number) => (
                                        <tr key={i}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{item.productName}</div>
                                                <div className="text-xs text-gray-500">{item.summary}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right">RM{item.totalPrice.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t p-4 flex justify-between">
                    <Button variant="ghost" size="sm">
                        <FileText className="mr-2 h-4 w-4" /> Download PDF (Mock)
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 h-4 w-4" /> Approve & Pay
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
