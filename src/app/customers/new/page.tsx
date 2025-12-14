"use client";

import UserForm from "@/components/users/UserForm";

export default function NewCustomerPage() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Add New Customer</h1>
            <UserForm mode="create" section="customer" />
        </div>
    );
}
