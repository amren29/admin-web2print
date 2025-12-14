"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Package, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";

interface Bundle {
    id: string;
    title: string;
    slug: string;
    price: number;
    image_url: string;
    is_featured: boolean;
    items: any[];
}

export default function BundlesPage() {
    const [bundles, setBundles] = useState<Bundle[]>([]);

    useEffect(() => {
        fetch('/api/bundles')
            .then(res => res.json())
            .then(data => setBundles(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Packages & Campaigns</h1>
                    <p className="text-muted-foreground">Manage combo packs and marketing bundles.</p>
                </div>
                <Link href="/marketing/bundles/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Bundle
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundles.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-lg border border-dashed">
                        <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No bundles created yet</h3>
                        <p className="text-gray-500 mb-6">Create your first marketing package to get started.</p>
                        <Link href="/marketing/bundles/create">
                            <Button variant="outline">Create Bundle</Button>
                        </Link>
                    </div>
                ) : (
                    bundles.map((bundle) => (
                        <Card key={bundle.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                            <div className="aspect-video relative bg-gray-100">
                                {bundle.image_url ? (
                                    <img src={bundle.image_url} alt={bundle.title} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <Package size={48} opacity={0.2} />
                                    </div>
                                )}
                                {bundle.is_featured && (
                                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                        Featured
                                    </div>
                                )}
                            </div>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{bundle.title}</CardTitle>
                                    <span className="font-bold text-blue-600">RM{bundle.price}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">/{bundle.slug}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-gray-500 mb-4">
                                    {bundle.items.length} items included
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="w-full">
                                        <Edit className="mr-2 h-3 w-3" /> Edit
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-8 w-8">
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
