"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserFormProps {
    initialData?: any; // If null, mode is create
    mode: 'create' | 'edit';
    section: 'customer' | 'agent' | 'user'; // Controls default role/fields
}

export default function UserForm({ initialData, mode, section }: UserFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [tiers, setTiers] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: section === 'agent' ? 'agent' : section === 'customer' ? 'customer' : 'admin',
        tierId: "",
        mobile: "",
        companyName: "",
        address1: "",
        address2: "",
        city: "",
        postcode: "",
        postcode: "",
        state: "Sabah",
        creditLimit: 0,
        discountRate: 0,
        brandName: "",
        ...initialData
    });

    useEffect(() => {
        if (section === 'agent' || formData.role === 'agent') {
            fetch('/api/tiers')
                .then(res => res.json())
                .then(data => setTiers(data))
                .catch(err => console.error("Failed to load tiers", err));
        }
    }, [section, formData.role]);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = '/api/auth';
            const method = mode === 'create' ? 'POST' : 'PUT';

            const payload = {
                ...formData,
                action: mode === 'create' ? 'create' : undefined, // Action for POST routing
                id: initialData?.id // Required for PUT
            };

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Operation failed");

            toast.success(`Successfully ${mode === 'create' ? 'created' : 'updated'} user`);

            // Redirect based on section
            if (section === 'agent') router.push('/agents');
            else if (section === 'customer') router.push('/customers');
            else router.push('/users');

            router.refresh();

        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
        setLoading(true);
        try {
            await fetch(`/api/auth?id=${initialData.id}`, { method: 'DELETE' });
            toast.success("User deleted");
            if (section === 'agent') router.push('/agents');
            else if (section === 'customer') router.push('/customers');
            else router.push('/users');
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl bg-white p-6 rounded-lg border shadow-sm">
            <div className="space-y-8">
                {/* BLOCKS A & B: Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Block A: Identity (Left) */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                            Identity & Contact
                        </h3>

                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="mobile">Mobile Phone <span className="text-red-500">*</span></Label>
                            <Input
                                id="mobile"
                                type="tel"
                                placeholder="+60..."
                                value={formData.mobile || ""}
                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Block B: Shipping (Right) */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                            Shipping Details
                        </h3>

                        <div className="grid gap-2">
                            <Label htmlFor="address1">Address Line 1</Label>
                            <Input
                                id="address1"
                                value={formData.address1 || ""}
                                onChange={e => setFormData({ ...formData, address1: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address2">Address Line 2</Label>
                            <Input
                                id="address2"
                                value={formData.address2 || ""}
                                onChange={e => setFormData({ ...formData, address2: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="postcode">Postcode</Label>
                                <Input
                                    id="postcode"
                                    type="number"
                                    value={formData.postcode || ""}
                                    onChange={e => setFormData({ ...formData, postcode: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city || ""}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="state">State</Label>
                            <Select
                                value={formData.state || "Sabah"}
                                onValueChange={val => setFormData({ ...formData, state: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sabah">Sabah</SelectItem>
                                    <SelectItem value="Sarawak">Sarawak</SelectItem>
                                    <SelectItem value="W.P. Labuan">W.P. Labuan</SelectItem>
                                    <SelectItem value="Johor">Johor</SelectItem>
                                    <SelectItem value="Kedah">Kedah</SelectItem>
                                    <SelectItem value="Kelantan">Kelantan</SelectItem>
                                    <SelectItem value="Melaka">Melaka</SelectItem>
                                    <SelectItem value="Negeri Sembilan">Negeri Sembilan</SelectItem>
                                    <SelectItem value="Pahang">Pahang</SelectItem>
                                    <SelectItem value="Perak">Perak</SelectItem>
                                    <SelectItem value="Perlis">Perlis</SelectItem>
                                    <SelectItem value="Pulau Pinang">Pulau Pinang</SelectItem>
                                    <SelectItem value="Selangor">Selangor</SelectItem>
                                    <SelectItem value="Terengganu">Terengganu</SelectItem>
                                    <SelectItem value="W.P. Kuala Lumpur">W.P. Kuala Lumpur</SelectItem>
                                    <SelectItem value="W.P. Putrajaya">W.P. Putrajaya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Block C: Role & Privileges (Bottom) */}
                <div className="space-y-4 pt-6 mt-6 border-t">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
                        Role & Privileges
                    </h3>

                    {/* Role Toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'customer' })}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${formData.role === 'customer'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Customer
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'agent' })}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${formData.role === 'agent'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Agent / Reseller
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Agent Fields */}
                    {formData.role === 'agent' && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 animate-in fade-in slide-in-from-top-2">
                            <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                                Agent Configuration
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="brandName" className="text-purple-900">
                                        Business / Sender Name <span className="text-xs text-purple-600 font-normal">(Used for Dropship Airway Bill)</span>
                                    </Label>
                                    <Input
                                        id="brandName"
                                        placeholder="e.g. Ali Creative Solutions"
                                        value={formData.brandName || ""}
                                        onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                                        className="border-purple-200 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="discountRate" className="text-purple-900">Discount Percentage (%)</Label>
                                    <div className="relative">
                                        <Input
                                            id="discountRate"
                                            type="number"
                                            placeholder="20"
                                            value={formData.discountRate || ""}
                                            onChange={e => setFormData({ ...formData, discountRate: Number(e.target.value) })}
                                            className="border-purple-200 focus:ring-purple-500"
                                        />
                                        <span className="absolute right-3 top-2.5 text-purple-400 font-bold">%</span>
                                    </div>
                                    <p className="text-xs text-purple-600">Auto-calculates agent price (e.g., 20% off).</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="creditLimit" className="text-purple-900">Credit Limit (RM)</Label>
                                    <Input
                                        id="creditLimit"
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.creditLimit || ""}
                                        onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                                        className="border-purple-200 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
                {mode === 'edit' && (
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                        Delete User
                    </Button>
                )}

                <div className="flex gap-2 ml-auto">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
