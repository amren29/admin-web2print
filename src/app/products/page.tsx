"use client";

import { Edit2, Plus, Trash2, Search, Filter, X, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

// --- Types ---
interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: "Active" | "Low Stock" | "Out of Stock" | "Archived";
    sku?: string;
    description?: string;
    lastUpdated?: string;
}

const DEFAULT_PRODUCTS: Product[] = [
    { id: "PROD-001", name: "Standard Business Cards", category: "Business Cards", price: 25.0, stock: 5000, status: "Active", sku: "BC-STD-001", description: "Make a lasting first impression with our premium business cards. Available in various finishes and paper weights to suit your brand identity." },
    { id: "PROD-002", name: "Premium Glossy Flyers", category: "Marketing Materials", price: 45.0, stock: 2500, status: "Active", sku: "FL-GLO-002", description: "Promote your events or services with vibrant, high-gloss flyers. Perfect for handouts, inserts, and mailers." },
    { id: "PROD-003", name: "Vinyl Banners (3x6)", category: "Large Format", price: 120.0, stock: 50, status: "Low Stock", sku: "BN-VIN-003", description: "Durable, weather-resistant vinyl banners ideal for outdoor advertising. Comes with hemmed edges and grommets for easy hanging." },
    { id: "PROD-004", name: "Custom Letterhead", category: "Stationery", price: 35.00, stock: 1000, status: "Active", sku: "ST-LET-004", description: "Professional letterheads printed on high-quality paper. Compatible with inkjet and laser printers." },
    { id: "PROD-005", name: "Promotional Mugs", category: "Promotional", price: 15.00, stock: 0, status: "Out of Stock", sku: "PR-MUG-005", description: "Custom ceramic mugs perfect for corporate gifts or merchandise. Microwave and dishwasher safe." }
];

export default function AdminProductsPage() {
    // --- State ---
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // --- Effects ---
    useEffect(() => {
        // Load from LocalStorage
        const saved = localStorage.getItem("web2print_products");
        if (saved) {
            try {
                setProducts(JSON.parse(saved));
            } catch (e) { console.error("Failed to load products", e); setProducts(DEFAULT_PRODUCTS); }
        } else {
            setProducts(DEFAULT_PRODUCTS);
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        // Save to LocalStorage
        if (isLoaded) {
            localStorage.setItem("web2print_products", JSON.stringify(products));
        }
    }, [products, isLoaded]);

    // --- Handlers ---
    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm("Are you sure you want to delete this product?")) {
            setProducts(prev => prev.filter(p => p.id !== id));
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleBulkDelete = () => {
        if (confirm(`Delete ${selectedIds.size} products? This action cannot be undone.`)) {
            setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
            setSelectedIds(new Set());
        }
    };

    const handleSelect = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        else setSelectedIds(new Set());
    };

    // --- Filtering Logic ---
    const filteredProducts = products.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
        const matchesStatus = statusFilter === "All" || p.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Derived Lists for Dropdowns
    const distinctCategories = Array.from(new Set(products.map(p => p.category)));
    const distinctStatuses = ["Active", "Low Stock", "Out of Stock", "Archived"];

    if (!isLoaded) return <div className="p-8">Loading...</div>;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* --- Header --- */}
            <div className="px-6 py-5 border-b flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Products & Pricing</h2>
                        <p className="text-sm text-gray-500">Manage catalog inventory and variants.</p>
                    </div>
                    <Link href="/products/new">
                        <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm">
                            <Plus className="h-4 w-4" /> Add Product
                        </button>
                    </Link>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, SKU, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="pl-3 pr-8 py-2 border rounded-lg text-sm bg-white appearance-none cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-black outline-none min-w-[140px]"
                        >
                            <option value="All">All Categories</option>
                            {distinctCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-3 pr-8 py-2 border rounded-lg text-sm bg-white appearance-none cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-black outline-none min-w-[120px]"
                        >
                            <option value="All">All Status</option>
                            {distinctStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Reset Filters */}
                    {(searchQuery || categoryFilter !== "All" || statusFilter !== "All") && (
                        <button
                            onClick={() => { setSearchQuery(""); setCategoryFilter("All"); setStatusFilter("All"); }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Clear Filters"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* --- Table --- */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 w-10">
                                <input
                                    type="checkbox"
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                                    className="rounded border-gray-300 text-black focus:ring-black"
                                />
                            </th>
                            <th className="px-6 py-3">Product Info</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Price</th>
                            <th className="px-6 py-3">Stock</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProducts.map((product) => (
                            <tr
                                key={product.id}
                                className={`
                                    hover:bg-gray-50 transition-colors cursor-pointer group
                                    ${selectedIds.has(product.id) ? 'bg-blue-50/50' : ''}
                                `}
                                onClick={() => handleSelect(product.id)}
                            >
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(product.id)}
                                        onChange={(e) => { e.stopPropagation(); handleSelect(product.id); }}
                                        className="rounded border-gray-300 text-black focus:ring-black"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{product.name}</div>
                                    <div className="text-xs text-gray-400 font-mono mt-0.5">{product.sku || product.id}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{product.category}</td>
                                <td className="px-6 py-4 font-medium">RM {product.price.toFixed(2)}</td>
                                <td className="px-6 py-4 text-gray-600">{product.stock}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={product.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/products/${product.id}`}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </Link>
                                        <button
                                            onClick={(e) => handleDelete(product.id, e)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Filter className="h-8 w-8 text-gray-300" />
                                        <p>No products found matching your filters.</p>
                                        <button
                                            onClick={() => { setSearchQuery(""); setCategoryFilter("All"); setStatusFilter("All"); }}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Bulk Action Toolbar --- */}
            {selectedIds.size > 0 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
                    <span className="font-medium text-sm">{selectedIds.size} Selected</span>
                    <div className="h-4 w-px bg-gray-700"></div>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                        <Trash2 className="h-4 w-4" /> Delete Selection
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="ml-2 text-gray-400 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        "Active": "bg-green-100 text-green-700 border-green-200",
        "Low Stock": "bg-yellow-100 text-yellow-800 border-yellow-200",
        "Out of Stock": "bg-red-100 text-red-700 border-red-200",
        "Archived": "bg-gray-100 text-gray-600 border-gray-200"
    };
    const style = styles[status as keyof typeof styles] || styles["Archived"];

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
            {status}
        </span>
    );
}
