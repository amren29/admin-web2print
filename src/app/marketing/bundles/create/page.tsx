"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// Mock Products Source (Replicated from products.ts for reliability in Admin context)
const AVAILABLE_PRODUCTS = [
    { id: "1", name: "Business Cards (Standard)", material: "Art Card 260gsm" },
    { id: "2", name: "A5 Flyers", material: "Simili 80gsm" },
    { id: "3", name: "Luxury Business Cards", material: "Matte Art Card 310gsm" },
    { id: "4", name: "Vinyl Stickers", material: "White Vinyl 100mic" },
    { id: "5", name: "Round Stickers", material: "Mirrorkote Sticker" },
    { id: "6", name: "Pull Up Banners", material: "Synthetic Paper" }
];

export default function CreateBundlePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Bundle Info
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [price, setPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [status, setStatus] = useState<"active" | "draft">("draft");
    const [description, setDescription] = useState("");

    // Items
    const [items, setItems] = useState<any[]>([]);

    const handleAddItem = (productId: string) => {
        const product = AVAILABLE_PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        setItems([...items, {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            options: product.material // Default options
        }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!title || !slug || !price) {
            toast.error("Please fill in required fields");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                title,
                slug,
                price: parseFloat(price),
                image_url: imageUrl,
                is_featured: isFeatured,
                status,
                description,
                items
            };

            const res = await fetch('/api/bundles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Bundle created!");
                router.push('/marketing/bundles');
            } else {
                throw new Error("Failed to create");
            }
        } catch (error) {
            toast.error("Error creating bundle");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/marketing/bundles">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft size={18} />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Create New Bundle</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Bundle Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Bundle Title</Label>
                                    <Input value={title} onChange={e => {
                                        setTitle(e.target.value);
                                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                                    }} placeholder="e.g. New Biz Starter Kit" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Slug (URL)</Label>
                                    <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="new-biz-kit" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Marketing description..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Bundle Price (RM)</Label>
                                    <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="150.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Image URL</Label>
                                    <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                                <Label htmlFor="featured">Feature on Homepage</Label>
                            </div>

                            <div className="flex items-center space-x-2 pt-4 border-t">
                                <Switch
                                    id="status"
                                    checked={status === 'active'}
                                    onCheckedChange={(checked) => setStatus(checked ? 'active' : 'draft')}
                                />
                                <Label htmlFor="status">
                                    Status: <span className={status === 'active' ? "text-green-600 font-bold" : "text-gray-500"}>{status === 'active' ? 'Active (Visible)' : 'Draft (Hidden)'}</span>
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Bundle Items</h2>
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <Card key={idx}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="flex-1">
                                            <h4 className="font-bold">{item.productName}</h4>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => handleUpdateItem(idx, 'quantity', parseInt(e.target.value))}
                                                    className="h-8 text-sm"
                                                    placeholder="Qty"
                                                />
                                                <Input
                                                    value={item.options}
                                                    onChange={e => handleUpdateItem(idx, 'options', e.target.value)}
                                                    className="h-8 text-sm"
                                                    placeholder="Options (e.g. Size)"
                                                />
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                                            <Trash2 size={18} />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {items.length === 0 && (
                                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded border border-dashed text-sm">
                                    No items added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Product Selector */}
                <div>
                    <Card className="sticky top-6">
                        <CardContent className="pt-6">
                            <h3 className="font-bold mb-4">Add Products</h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                {AVAILABLE_PRODUCTS.map(product => (
                                    <div key={product.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => handleAddItem(product.id)}>
                                        <div>
                                            <div className="text-sm font-medium">{product.name}</div>
                                            <div className="text-xs text-gray-400">{product.material}</div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-6 w-6">
                                            <Plus size={14} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Button size="lg" className="w-full mt-6" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Bundle"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
