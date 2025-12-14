"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";

export default function ProofPage() {
    const params = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        fetch(`/api/orders?id=${params.id}`)
            .then(res => {
                if (!res.ok) throw new Error("Order not found");
                return res.json();
            })
            .then(data => setOrder(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [params.id]);

    const handleApprove = async () => {
        if (!confirm("Are you sure you want to approve this artwork? This will send the order to production.")) return;

        setActionLoading(true);
        try {
            await updateStatus("Ready to Print", "Approved by Customer");
            setSuccessMsg("Thank you! Your artwork has been approved. We will proceed with printing.");
        } catch (err) {
            alert("Failed to approve. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert("Please provide a reason for the changes.");
            return;
        }

        setActionLoading(true);
        try {
            await updateStatus("Refining", `Changes Requested: ${rejectReason}`);
            setSuccessMsg("Your feedback has been sent. Our team will contact you shortly.");
            setShowRejectInput(false);
        } catch (err) {
            alert("Failed to submit feedback.");
        } finally {
            setActionLoading(false);
        }
    };

    const updateStatus = async (status: string, note: string) => {
        const res = await fetch('/api/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: order.id,
                status,
                history: [
                    ...(order.history || []),
                    {
                        date: new Date().toISOString(),
                        action: "Customer Proof Response",
                        details: note,
                        user: "Customer"
                    }
                ]
            })
        });
        if (!res.ok) throw new Error("Update failed");
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-gray-500" /></div>;
    if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
    if (successMsg) return (
        <div className="flex flex-col h-screen items-center justify-center p-4 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800">Response Received</h1>
            <p className="text-gray-600">{successMsg}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">Artwork Proof</h1>
                        <p className="text-blue-100 text-sm">Order #{order.id}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">Please review your artwork below carefully. Check for spelling, layout, and colors.</p>

                        {order.fileUrl ? (
                            <div className="border rounded-lg p-2 bg-gray-100">
                                {/* Use iframe for PDF support or Img for images */}
                                {order.fileUrl.endsWith('.pdf') ? (
                                    <iframe src={order.fileUrl} className="w-full h-[500px]" />
                                ) : (
                                    <img src={order.fileUrl} alt="Proof" className="max-w-full max-h-[600px] mx-auto rounded shadow-sm" />
                                )}
                            </div>
                        ) : (
                            <div className="p-10 border-2 border-dashed rounded-lg bg-gray-50 text-gray-400">
                                <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                                No artwork file attached.
                            </div>
                        )}
                    </div>

                    {/* Specifications Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg text-sm grid grid-cols-2 gap-4">
                        <div><span className="font-bold text-gray-500">Product:</span> {order.specs?.productName}</div>
                        <div><span className="font-bold text-gray-500">Size:</span> {order.specs?.size}</div>
                        <div><span className="font-bold text-gray-500">Material:</span> {order.specs?.material}</div>
                        <div><span className="font-bold text-gray-500">Total:</span> RM {order.total?.toFixed(2)}</div>
                    </div>

                    <hr />

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                        {!showRejectInput ? (
                            <>
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50 h-12 px-8 text-lg"
                                    onClick={() => setShowRejectInput(true)}
                                    disabled={actionLoading}
                                >
                                    <XCircle className="mr-2 h-5 w-5" /> Request Changes
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 h-12 px-8 text-lg shadow-md hover:shadow-lg transition-all"
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                >
                                    <CheckCircle className="mr-2 h-5 w-5" /> Approve Artwork
                                </Button>
                            </>
                        ) : (
                            <div className="w-full max-w-md space-y-3 animation-fade-in">
                                <label className="font-bold text-gray-700">What changes are needed?</label>
                                <textarea
                                    className="w-full border rounded-md p-3 h-24 focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Please describe the changes clearly..."
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => setShowRejectInput(false)} className="flex-1">Cancel</Button>
                                    <Button variant="destructive" onClick={handleReject} disabled={actionLoading} className="flex-1">Submit Feedback</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
