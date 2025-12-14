import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to the main app's users.json
const USERS_FILE = path.join(process.cwd(), '../src/data/users.json');

export async function GET() {
    try {
        if (!fs.existsSync(USERS_FILE)) return NextResponse.json([]);
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (e) {
        console.error("Failed to load users:", e);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (!fs.existsSync(USERS_FILE)) return NextResponse.json({ error: "No users db" }, { status: 500 });
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));

        if (action === 'create') {
            const { name, email, role, tierId } = body;
            const newUser: any = {
                id: `USR-${Date.now()}`,
                name,
                email,
                role,
                tierId,
                agent_discount_percent: 0,
                walletBalance: 0,
                joinedAt: new Date().toISOString()
            };

            // Resolve tier discount if agent
            if (role === 'agent' && tierId) {
                const tiersFile = path.join(process.cwd(), '../src/data/agent_tiers.json');
                if (fs.existsSync(tiersFile)) {
                    const tiers = JSON.parse(fs.readFileSync(tiersFile, 'utf-8'));
                    const tier = tiers.find((t: any) => t.id === tierId);
                    if (tier) newUser.agent_discount_percent = tier.discountPercent;
                }
            }

            users.push(newUser);
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 4));
            return NextResponse.json(newUser);
        }

        // Login Logic fallback
        const { email } = body;
        const user = users.find((u: any) => u.email === email);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        return NextResponse.json(user);

    } catch (error) {
        console.error("Auth POST error:", error);
        return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, email, role, tierId } = body;

        if (!fs.existsSync(USERS_FILE)) return NextResponse.json({ error: "No users db" }, { status: 500 });
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        const userIndex = users.findIndex((u: any) => u.id === id);

        if (userIndex === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

        users[userIndex].name = name;
        users[userIndex].email = email;
        users[userIndex].role = role;

        // Handle Tier Change logic
        if (role === 'agent') {
            users[userIndex].tierId = tierId;
            if (tierId) {
                const tiersFile = path.join(process.cwd(), '../src/data/agent_tiers.json');
                if (fs.existsSync(tiersFile)) {
                    const tiers = JSON.parse(fs.readFileSync(tiersFile, 'utf-8'));
                    const tier = tiers.find((t: any) => t.id === tierId);
                    if (tier) users[userIndex].agent_discount_percent = tier.discountPercent;
                }
            } else {
                users[userIndex].agent_discount_percent = 0;
            }
        } else {
            delete users[userIndex].tierId;
            users[userIndex].agent_discount_percent = 0;
        }

        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 4));
        return NextResponse.json(users[userIndex]);

    } catch (e) {
        console.error("Auth PUT error:", e);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!fs.existsSync(USERS_FILE)) return NextResponse.json({ error: "No users db" }, { status: 500 });
        let users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));

        users = users.filter((u: any) => u.id !== id);

        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 4));
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Auth DELETE error:", e);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
