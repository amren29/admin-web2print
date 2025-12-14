"use client";

import UserForm from "@/components/users/UserForm";

export default function NewUserPage() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Add New Admin/Staff</h1>
            <UserForm mode="create" section="user" />
        </div>
    );
}
