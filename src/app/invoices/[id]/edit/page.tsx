"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Search, Loader2, Save, ShoppingCart, User, Phone, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AdminProductCalculator } from "@/components/calculator/AdminProductCalculator";
import { Switch } from "@/components/ui/switch";

// --- TYPES ---
interface Product {
    id: string
    name: string
    category: string
    price: number
    image?: string
    description?: string
    sizes?: any[]
    materials?: any[]
    finishings?: any[]
    customSections?: any[]
    allowCustomSize?: boolean
}

interface CartItem {
    id: string
    productId: string
    productName: string
    specs: any
    quantity: number
    unitPrice: number
    totalPrice: number
    summary: string
    isOverridden?: boolean
}

// Reuse mock products for now (In real app, fetch from generic API)
const MOCK_PRODUCTS: Product[] = [
    {
        id: "PROD-001",
        name: "Standard Business Cards",
        category: "Business Cards",
        price: 25.0,
        image: "/images/products/business-card.jpg",
        description: "High quality matte business cards.",
        sizes: [{ id: "std", label: "Standard (90x54mm)", priceAdjustment: 0 }],
        materials: [{ id: "matte", label: "Matte 260gsm", priceAdjustment: 0 }, { id: "gloss", label: "Gloss 260gsm", priceAdjustment: 0 }],
        finishings: [{ id: "none", label: "None", priceAdjustment: 0 }, { id: "lamination", label: "Matt Lamination", priceAdjustment: 5 }]
    },
    {
        id: "PROD-006",
        name: "Sublimation Jersey",
        category: "Apparel",
        price: 35.0,
        image: "/images/products/jersey.jpg",
        description: "Full dye sublimation jersey.",
        sizes: [
            { id: "xs", label: "XS", priceAdjustment: 0 },
            { id: "s", label: "S", priceAdjustment: 0 },
            { id: "m", label: "M", priceAdjustment: 0 },
            { id: "l", label: "L", priceAdjustment: 0 },
            { id: "xl", label: "XL", priceAdjustment: 0 },
            { id: "xxl", label: "2XL", priceAdjustment: 2 },
            { id: "custom", label: "Custom Size", priceAdjustment: 5 }
        ],
        allowCustomSize: false,
        materials: [{ id: "microfiber", label: "Microfiber", priceAdjustment: 0 }],
        finishings: [],
        customSections: [
            {
                id: "collar",
                title: "Collar Type",
                inputType: "select",
                options: [
                    { id: "round", label: "Round Neck", priceAdjustment: 0 },
                    { id: "vneck", label: "V-Neck", priceAdjustment: 0 },
                    { id: "collar", label: "Polo Collar", priceAdjustment: 5 }
                ]
            },
            {
                id: "sleeve",
                title: "Sleeve Type",
                inputType: "select",
                options: [
                    { id: "short", label: "Short Sleeve", priceAdjustment: 0 },
                    { id: "long", label: "Long Sleeve", priceAdjustment: 5 }
                ]
            }
        ]
    },
    {
        id: "PROD-DTF",
        name: "DTF Printing (Meter)",
        category: "Sticker / Heat Press",
        price: 45.0,
        image: "/images/products/dtf.jpg",
        description: "Direct to Film printing per meter.",
        sizes: [
            { id: "meter", label: "Per Meter (58cm width)", priceAdjustment: 0 },
            { id: "a3", label: "A3 Sheet", priceAdjustment: -25 }
        ],
        allowCustomSize: false,
        materials: [{ id: "pet", label: "PET Film", priceAdjustment: 0 }],
        customSections: [
            {
                id: "cut",
                title: "Cutting",
                inputType: "select",
                options: [
                    { id: "no-cut", label: "No Cutting (Roll)", priceAdjustment: 0 },
                    { id: "cut", label: "Cut to Size", priceAdjustment: 10 }
                ]
            }
        ]
    },
    {
        id: "PROD-003",
        name: "Marketing Buntings",
        category: "Large Format",
        price: 45.0,
        image: "/images/products/bunting.jpg",
        description: "Outdoor durable buntings.",
        sizes: [
            { id: "2x5", label: "2ft x 5ft", priceAdjustment: 0 },
            { id: "2x6", label: "2ft x 6ft", priceAdjustment: 10 }
        ],
        materials: [{ id: "tarpaulin", label: "Tarpaulin 380gsm", priceAdjustment: 0 }],
        finishings: [{ id: "pvc-pipe", label: "PVC Pipe + String", priceAdjustment: 0 }, { id: "wood", label: "Wood", priceAdjustment: 2 }]
    }
];

export default function EditInvoicePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    // Loading State
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);

    // Config Modal State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Finalize Modal State
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Invoice Handler
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetch(`/api/invoices/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    toast.error("Invoice not found");
                    router.push('/invoices');
                } else {
                    setCustomerName(data.customerName);
                    setCustomerPhone(data.phone);
                    setCart(data.items || []);
                }
            })
            .catch(() => toast.error("Failed to load invoice"))
            .finally(() => setLoading(false));
    }, [id, router]);

    // Filter Products
    const filteredProducts = MOCK_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- CART ACTIONS ---
    const addToCart = (item: CartItem) => {
        setCart(prev => [...prev, item]);
        setIsModalOpen(false);
        setSelectedProduct(null);
        toast.success("Added to invoice cart!");
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
    };

    const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    // --- UPDATE INVOICE ---
    const handleUpdateInvoice = async () => {
        if (!customerName || !customerPhone) {
            toast.error("Please enter Customer Name and Phone.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                customerName,
                phone: customerPhone,
                items: cart,
                totalAmount: cartSubtotal,
                // status: "Unpaid", // Don't reset status on edit
                // createdAt: ... // Don't change created date
            };

            const res = await fetch(`/api/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Invoice updated successfully!");
                router.push(`/invoices/${id}`);
            } else {
                throw new Error("Failed to update invoice");
            }
        } catch (error) {
            toast.error("Failed to update invoice.");
        } finally {
            setIsSaving(false);
            setIsFinalizeOpen(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading invoice...</div>;

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] gap-6 p-6">

            {/* --- LEFT COLUMN: CATALOG (66%) --- */}
            <div className="flex-1 w-2/3 flex flex-col space-y-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded">Edit Invoice #{id}</h1>
                    <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm flex-1">
                        <Search className="text-gray-400" />
                        <Input
                            placeholder="Search products..."
                            className="flex-1 border-none shadow-none focus-visible:ring-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-10">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                            onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                        >
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                {product.image ? (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                        <span className="text-xs">Image</span>
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                        <span className="text-xs">No Image</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="secondary" size="sm" className="font-bold">Add Item</Button>
                                </div>
                            </div>

                            <div className="p-3 flex flex-col flex-1">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{product.category}</div>
                                <h3 className="font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">{product.name}</h3>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="font-bold text-purple-600">RM{product.price.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RIGHT COLUMN: INVOICE CART (33%) --- */}
            <div className="w-1/3 min-w-[350px] bg-white border rounded-xl shadow-lg flex flex-col overflow-hidden h-full">
                <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-700">
                        <ShoppingCart size={18} />
                        <h2>Invoice Items</h2>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">{cart.length} items</Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                            <ShoppingCart size={40} className="opacity-20" />
                            <p className="text-sm">No items added.</p>
                            <p className="text-xs text-muted-foreground">Add products from catalog.</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={item.id} className="group relative border rounded-lg p-3 hover:border-amber-300 transition-colors bg-white">
                                <Button
                                    variant="ghost" size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                >
                                    <X size={14} />
                                </Button>

                                <div className="flex justify-between items-start mb-1 pr-6">
                                    <h4 className="font-bold text-sm line-clamp-1">{item.productName}</h4>
                                </div>
                                <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">{item.summary}</p>

                                <div className="flex justify-between items-center text-sm">
                                    <div className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono text-gray-600">
                                        Qty: {item.quantity}
                                    </div>
                                    <div className="font-bold text-gray-900">
                                        RM{item.totalPrice.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                        <span>Total Due</span>
                        <span>RM{cartSubtotal.toFixed(2)}</span>
                    </div>
                    <Button
                        size="lg"
                        className="w-full font-bold shadow-md bg-amber-600 hover:bg-amber-700"
                        disabled={cart.length === 0}
                        onClick={() => setIsFinalizeOpen(true)}
                    >
                        Update Invoice
                    </Button>
                </div>
            </div>

            {/* --- CONFIG MODAL (Reused) --- */}
            {selectedProduct && (
                <ConfigModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    product={selectedProduct}
                    onAddToCart={addToCart}
                />
            )}

            {/* --- FINALIZE MODAL --- */}
            <Dialog open={isFinalizeOpen} onOpenChange={setIsFinalizeOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Details</DialogTitle>
                        <DialogDescription>Review customer details.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="c-name">Customer Name</Label>
                            <Input id="c-name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Ali Baba" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="c-phone">WhatsApp / Phone</Label>
                            <Input id="c-phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+601..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFinalizeOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateInvoice} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

// Reuse ConfigModal Logic
function ConfigModal({ isOpen, onClose, product, onAddToCart }: { isOpen: boolean, onClose: () => void, product: any, onAddToCart: (item: CartItem) => void }) {
    const [overrideMode, setOverrideMode] = useState(false);
    const [manualPrice, setManualPrice] = useState(0);
    const [calcOutput, setCalcOutput] = useState<any>(null);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="flex h-full">
                    {/* Left Panel */}
                    <div className="w-1/3 bg-gray-50 border-r p-6 overflow-y-auto">
                        <h2 className="text-xl font-bold mb-2">{product.name}</h2>
                        <p className="text-sm text-gray-500 mb-6">{product.description}</p>
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="override" className="cursor-pointer">Override Price?</Label>
                                <Switch id="override" checked={overrideMode} onCheckedChange={(c) => { setOverrideMode(c); if (c) setManualPrice(calcOutput?.totalPrice || product.price); }} />
                            </div>
                            {overrideMode && (
                                <div className="space-y-2">
                                    <Input type="number" value={manualPrice} onChange={(e) => setManualPrice(parseFloat(e.target.value))} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calculator */}
                    <div className="w-2/3 flex flex-col bg-white">
                        <div className="flex-1 overflow-y-auto p-6">
                            <AdminProductCalculator product={product} hideFooter={true} onChange={setCalcOutput} />
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button onClick={() => {
                                if (!calcOutput && !overrideMode) { toast.error("Configure product first"); return; }
                                const finalPrice = overrideMode ? manualPrice : (calcOutput?.totalPrice || 0);
                                const quantity = calcOutput?.quantity || 1;
                                onAddToCart({
                                    id: Math.random().toString(36), productId: product.id, productName: product.name,
                                    specs: calcOutput?.specs || {}, quantity, unitPrice: finalPrice / quantity, totalPrice: finalPrice,
                                    summary: calcOutput?.breakdown || product.name, isOverridden: overrideMode
                                });
                            }}>
                                Add to Invoice
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
