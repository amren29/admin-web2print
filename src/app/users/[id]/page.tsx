"use client";

import UserForm from "@/components/users/UserForm";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EditUserPage() {
    const params = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth')
            .then(res => res.json())
            .then(data => {
                const found = data.find((u: any) => u.id === params.id);
                setUser(found);
            })
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) return <div className="p-10">Loading...</div>;
    if (!user) return <div className="p-10">User not found</div>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Edit User</h1>
            <UserForm mode="edit" section="user" initialData={user} />
        </div>
    );
}
