"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, Calendar, User, Phone, MapPin } from "lucide-react";

export default function PrintOrderPage() {
    const params = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch from API to get the latest order data (including those created via API)
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => {
                // Ensure data is an array
                const orders = Array.isArray(data) ? data : [];
                const found = orders.find((o: any) => o.id === params.id);
                setOrder(found);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load order for printing", err);
                setLoading(false);
            });
    }, [params.id]);

    if (loading) return <div className="p-8 text-center">Loading Job Sheet...</div>;
    if (!order) return <div className="p-8 text-center text-red-600">Order not found</div>;

    return (
        <div className="max-w-[210mm] mx-auto bg-white p-8 min-h-screen print:p-0">
            {/* Print Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Job Sheet</h1>
                    <div className="text-sm space-y-1">
                        <p className="font-bold">Web2Print Production</p>
                        <p>Production Facility 1</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold font-mono">{order.id}</h2>
                    <div className="flex items-center justify-end gap-2 text-sm mt-1">
                        <Calendar size={14} />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4 px-3 py-1 bg-black text-white font-bold inline-block text-sm uppercase">
                        {order.status}
                    </div>
                </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="border border-gray-300 p-4 rounded-lg">
                    <h3 className="font-bold uppercase text-xs text-gray-500 mb-3 border-b pb-1">Customer Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <User size={14} />
                            <span className="font-bold">{order.customer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone size={14} />
                            <span>{order.phone}</span>
                        </div>
                        {order.email && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 ml-6">{order.email}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="border border-gray-300 p-4 rounded-lg">
                    <h3 className="font-bold uppercase text-xs text-gray-500 mb-3 border-b pb-1">Delivery / Notes</h3>
                    <div className="space-y-2 text-sm">
                        {order.deliveryAddress ? (
                            <div className="flex items-start gap-2">
                                <MapPin size={14} className="mt-0.5" />
                                <span className="whitespace-pre-line">{order.deliveryAddress}</span>
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">No address provided (Self Pickup?)</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="mb-8">
                <h3 className="font-bold uppercase text-sm mb-4">Production Items</h3>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-2 font-black w-12">#</th>
                            <th className="text-left py-2 font-black">Item & Specifications</th>
                            <th className="text-right py-2 font-black w-24">y</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                        {order.items?.map((item: any, index: number) => (
                            <tr key={index}>
                                <td className="py-4 align-top font-bold">{index + 1}</td>
                                <td className="py-4 align-top">
                                    <div className="font-bold text-lg mb-1">{item.name}</div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-600">
                                        {item.size && <div><span className="font-semibold text-black">Size:</span> {item.size}</div>}
                                        {item.material && <div><span className="font-semibold text-black">Material:</span> {item.material}</div>}
                                        {item.finishing && <div><span className="font-semibold text-black">Finishing:</span> {item.finishing}</div>}
                                        {item.printSide && <div><span className="font-semibold text-black">Side:</span> {item.printSide}</div>}
                                        {item.specs?.map((spec: any, i: number) => (
                                            <div key={i}><span className="font-semibold text-black">{spec.label}:</span> {spec.value}</div>
                                        ))}
                                    </div>
                                    {item.notes && (
                                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 text-xs italic">
                                            <span className="font-bold not-italic">Note:</span> {item.notes}
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 align-top text-right">
                                    <div className="text-xl font-bold">{item.quantity}</div>
                                    <div className="text-xs text-gray-500 uppercase">Unit(s)</div>
                                </td>
                            </tr>
                        ))}
                        {!order.items?.length && (
                            <tr>
                                <td colSpan={3} className="py-4 text-center text-gray-500 italic">
                                    Single item order (Legacy format): {order.itemsCount}x {order.product}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Checkboxes */}
            <div className="border-t-2 border-black pt-6">
                <div className="grid grid-cols-3 gap-8">
                    <div className="text-center p-4 border border-gray-300 rounded-lg">
                        <div className="w-4 h-4 border-2 border-black mx-auto mb-2"></div>
                        <p className="text-xs uppercase font-bold">Printed</p>
                    </div>
                    <div className="text-center p-4 border border-gray-300 rounded-lg">
                        <div className="w-4 h-4 border-2 border-black mx-auto mb-2"></div>
                        <p className="text-xs uppercase font-bold">Finished / Cut</p>
                    </div>
                    <div className="text-center p-4 border border-gray-300 rounded-lg">
                        <div className="w-4 h-4 border-2 border-black mx-auto mb-2"></div>
                        <p className="text-xs uppercase font-bold">Q.C. Passed</p>
                    </div>
                </div>
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Generated on {new Date().toLocaleString()} • Web2Print Admin</p>
                </div>
            </div>

            {/* No-Print UI */}
            <div className="fixed bottom-8 right-8 print:hidden flex gap-4">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 font-bold transition-all hover:scale-105"
                >
                    <Printer size={20} />
                    <span>Print Now</span>
                </button>
            </div>
        </div>
    );
}
