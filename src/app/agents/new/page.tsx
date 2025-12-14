"use client";

import UserForm from "@/components/users/UserForm";

export default function NewAgentPage() {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Add New Agent</h1>
            <UserForm mode="create" section="agent" />
        </div>
    );
}
