"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, Calculator, FileText, Plus, Save, Search, Settings, ShoppingCart, Trash2, Upload, User, UserPlus } from "lucide-react"
import Link from "next/link"

// --- Configuration & Helpers ---
const PRODUCT_RATES: Record<string, number> = {
    'Banners (PVC)': 2.5,  // RM per sqft
    'Stickers': 5.5,      // RM per sqft
    'Business Cards': 35, // RM per box (fixed)
    'Flyers': 0.8,        // RM per pc
    'Posters': 12         // RM per pc
};

const FINISHING_OPTIONS = [
    "None", "Eyelets", "Pocket", "Lamination (Gloss)", "Lamination (Matte)", "Die Cut"
];

interface CartItem {
    id: string;
    productName: string;
    width?: number;
    height?: number;
    quantity: number;
    material: string;
    finishing: string;
    price: number;
    file?: File | null;
}

export default function NewOrderPage() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [users, setUsers] = useState<any[]>([])

    // --- State: Order Context ---
    const [selectedUserId, setSelectedUserId] = useState<string>("")
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [orderDetails, setOrderDetails] = useState({
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: "Normal",
        paymentStatus: "Unpaid"
    })

    // --- State: Item Builder ---
    const [builder, setBuilder] = useState({
        productName: "Banners (PVC)",
        width: 10,
        height: 5,
        quantity: 1,
        material: "Standard PVC 380gsm",
        finishing: "Eyelets",
        manualPrice: 0,
        isCustomPrice: false
    })
    const [builderFile, setBuilderFile] = useState<File | null>(null)

    // --- State: Cart ---
    const [cart, setCart] = useState<CartItem[]>([])
    const [calculatedPrice, setCalculatedPrice] = useState(0)

    // Load Users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/auth')
                if (res.ok) setUsers(await res.json())
            } catch (e) { console.error("Failed to fetch users", e) }
        }
        fetchUsers()
    }, [])

    // Handle Customer Select
    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId)
        setSelectedUser(users.find(u => u.id === userId))
    }

    // --- Pricing Logic ---
    useEffect(() => {
        if (builder.isCustomPrice) return;

        let price = 0;
        const rate = PRODUCT_RATES[builder.productName] || 0;

        if (builder.productName === 'Banners (PVC)' || builder.productName === 'Stickers') {
            // Area based pricing (sqft)
            const area = (builder.width || 0) * (builder.height || 0);
            price = area * rate * builder.quantity;
        } else {
            // Unit based pricing
            price = rate * builder.quantity;
        }

        setCalculatedPrice(Math.round(price * 100) / 100);
        setBuilder(prev => ({ ...prev, manualPrice: Math.round(price * 100) / 100 }));
    }, [builder.productName, builder.width, builder.height, builder.quantity, builder.isCustomPrice])

    // Add to Cart
    const addToCart = () => {
        const newItem: CartItem = {
            id: Math.random().toString(36).substr(2, 9),
            ...builder,
            price: builder.manualPrice,
            file: builderFile
        };
        setCart([...cart, newItem]);
        toast.success("Item added to order");
        // Reset builder somewhat
        setBuilderFile(null);
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    // --- Submit Order ---
    const handleCreateOrder = async () => {
        if (!selectedUserId) { toast.error("Please select a customer."); return; }
        if (cart.length === 0) { toast.error("Cart is empty."); return; }

        setSubmitting(true);
        try {
            // NOTE: Backend currently supports single item specs structure.
            // We will create the order using the FIRST item's specs, 
            // and combine others into description or create multiple orders?
            // For this 'POS' demo, we will condense multiple items into the 'specs' description if needed,
            // or just take the first item as the main 'product'. 
            // Better strategy: We send the primary item as specs, and full list in a 'notes' field if API allows.

            const mainItem = cart[0];
            const totalAmount = cart.reduce((acc, item) => acc + item.price, 0);

            const payload = {
                id: `POS-${Math.floor(10000 + Math.random() * 90000)}`,
                customer: selectedUser.name,
                email: selectedUser.email,
                phone: selectedUser.phone || "",
                agentId: selectedUser.role === 'agent' ? selectedUser.id : "",
                total: totalAmount,
                status: "New Order",
                priority: orderDetails.priority,
                deadline: orderDetails.deadline,
                paymentStatus: orderDetails.paymentStatus,
                source: "POS System",
                specs: {
                    productName: cart.length > 1 ? `${mainItem.productName} (+${cart.length - 1} more)` : mainItem.productName,
                    quantity: mainItem.quantity,
                    size: mainItem.width ? `${mainItem.width}x${mainItem.height}` : "Standard",
                    material: mainItem.material,
                    finishing: mainItem.finishing,
                    department: "Production"
                },
                // We'd ideally send the full 'cart' array to a 'items' endpoint if it existed.
                // For now, this creates a valid order record compatible with the dashboard.
                createdAt: new Date().toISOString()
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed");

            toast.success("Order Successfully Created!");
            router.push('/orders');

        } catch (error) {
            toast.error("Failed to submit order");
        } finally {
            setSubmitting(false);
        }
    };

    const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

    return (
        <div className="h-[calc(100vh-80px)] overflow-hidden flex flex-col md:flex-row bg-gray-50/50">
            {/* --- LEFT: Item Builder (Scrollable) --- */}
            <div className="flex-1 p-6 overflow-y-auto border-r bg-white/50">
                <div className="max-w-xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                            <Settings className="w-5 h-5 text-blue-600" /> Item Builder
                        </h2>
                    </div>

                    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        {/* Product Select */}
                        <div className="space-y-3">
                            <Label className="uppercase text-xs font-bold text-gray-400">Select Product</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.keys(PRODUCT_RATES).map(prod => (
                                    <button
                                        key={prod}
                                        type="button"
                                        onClick={() => setBuilder(prev => ({ ...prev, productName: prod }))}
                                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${builder.productName === prod
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {prod}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dimensions & Specs */}
                        <div className="grid grid-cols-2 gap-6">
                            {['Banners (PVC)', 'Stickers'].includes(builder.productName) && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Width (ft)</Label>
                                        <Input
                                            type="number"
                                            value={builder.width}
                                            onChange={e => setBuilder({ ...builder, width: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Height (ft)</Label>
                                        <Input
                                            type="number"
                                            value={builder.height}
                                            onChange={e => setBuilder({ ...builder, height: Number(e.target.value) })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={builder.quantity}
                                    onChange={e => setBuilder({ ...builder, quantity: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Material</Label>
                                <Select
                                    value={builder.material}
                                    onValueChange={val => setBuilder({ ...builder, material: val })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard PVC 380gsm">Standard PVC 380gsm</SelectItem>
                                        <SelectItem value="Premium PVC 440gsm">Premium PVC 440gsm</SelectItem>
                                        <SelectItem value="Simili Paper (80gsm)">Simili Paper (80gsm)</SelectItem>
                                        <SelectItem value="Art Card (260gsm)">Art Card (260gsm)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Finishing */}
                        <div className="space-y-2">
                            <Label>Finishing</Label>
                            <Select
                                value={builder.finishing}
                                onValueChange={val => setBuilder({ ...builder, finishing: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {FINISHING_OPTIONS.map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-2">
                            <Label>Artwork File</Label>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={e => setBuilderFile(e.target.files?.[0] || null)}
                                />
                                {builderFile ? (
                                    <div className="text-green-600 font-medium flex flex-col items-center">
                                        <FileText className="w-8 h-8 mb-2" />
                                        {builderFile.name}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center">
                                        <Upload className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm">Click or Drag file here</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Floating Bottom Action for Builder */}
                <div className="p-6">
                    <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-xl">
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Estimated Cost</p>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">RM</span>
                                <Input
                                    className="w-24 bg-slate-800 border-none text-white font-bold text-xl h-8"
                                    value={builder.manualPrice}
                                    onChange={e => setBuilder({ ...builder, manualPrice: Number(e.target.value), isCustomPrice: true })}
                                />
                            </div>
                        </div>
                        <Button onClick={addToCart} className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6">
                            <Plus className="w-4 h-4 mr-2" /> Add Item
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- RIGHT: Cart & Checkout (Fixed Width) --- */}
            <div className="w-full md:w-[400px] lg:w-[450px] bg-white border-l flex flex-col h-full shadow-2xl">
                {/* 1. User Header */}
                <div className="p-6 border-b bg-gray-50 space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <User className="h-4 w-4" /> Customer
                    </h3>
                    <div className="flex gap-2">
                        <Select value={selectedUserId} onValueChange={handleUserSelect}>
                            <SelectTrigger className="bg-white border-gray-300 shadow-sm h-12">
                                <SelectValue placeholder="Search Customer..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-gray-900">{u.name}</span>
                                            <span className="text-xs text-gray-500">{u.email}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="h-12 w-12 p-0 border-dashed">
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </div>
                    {selectedUser && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                            Verified: {selectedUser.phone} {selectedUser.companyName && `• ${selectedUser.companyName}`}
                        </div>
                    )}
                </div>

                {/* 2. Cart List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-2">
                            <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex justify-between items-start group">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-1">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{item.productName}</p>
                                        <p className="text-xs text-gray-500">
                                            {item.width ? `${item.width}x${item.height}'` : 'Standard'} • {item.material}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity} • {item.finishing}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">RM {item.price.toFixed(2)}</p>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-gray-400 hover:text-red-500 mt-2 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 3. Settings & Totals */}
                <div className="p-6 bg-gray-50 border-t space-y-4">
                    {/* Order Settings */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <Label className="text-xs">Priority</Label>
                            <Select
                                value={orderDetails.priority}
                                onValueChange={v => setOrderDetails({ ...orderDetails, priority: v })}
                            >
                                <SelectTrigger className="bg-white h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="Urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs">Deadline</Label>
                            <Input
                                type="date"
                                className="bg-white h-9"
                                value={orderDetails.deadline}
                                onChange={e => setOrderDetails({ ...orderDetails, deadline: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>RM {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-gray-900">
                            <span>Total</span>
                            <span>RM {cartTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleCreateOrder}
                        disabled={submitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg shadow-lg shadow-blue-200"
                    >
                        {submitting ? "Processing..." : `Checkout • RM ${cartTotal.toFixed(2)}`}
                    </Button>
                </div>
            </div>
        </div>
    )
}
