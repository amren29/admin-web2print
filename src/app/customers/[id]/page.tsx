"use client";

import UserForm from "@/components/users/UserForm";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EditCustomerPage() {
    const params = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user by ID (In a real app, we'd have a specific GET /api/users/[id], 
        // but for now we fetch all and find. Optimizable later.)
        fetch('/api/auth')
            .then(res => res.json())
            .then(data => {
                const found = data.find((u: any) => u.id === params.id);
                setUser(found);
            })
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) return <div className="p-10">Loading...</div>;
    if (!user) return <div className="p-10">Customer not found</div>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Edit Customer</h1>
            <UserForm mode="edit" section="customer" initialData={user} />
        </div>
    );
}
