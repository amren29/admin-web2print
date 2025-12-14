import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// POINTING TO THE SHARED FILE IN PARENT DIRECTORY
const DATA_FILE = path.join(process.cwd(), '../src/data/orders.json');

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            const orders = JSON.parse(fileContent || '[]');

            if (id) {
                const order = orders.find((o: any) => o.id === id);
                return order ? NextResponse.json(order) : NextResponse.json({ error: "Order not found" }, { status: 404 });
            }

            return NextResponse.json(orders);
        }
        return NextResponse.json([]);
    } catch (error) {
        console.error("Failed to read orders:", error);
        return NextResponse.json({ error: "Failed to read" }, { status: 500 });
    }
}



export async function POST(request: Request) {
    try {
        const newOrder = await request.json();

        // Read existing
        let orders = [];
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            orders = JSON.parse(fileContent || '[]');
        }

        // Prepend new order
        orders = [newOrder, ...orders];

        // Write back
        fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));

        return NextResponse.json({ success: true, orderId: newOrder.id });
    } catch (error) {
        console.error("Failed to save order:", error);
        return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const updates = await request.json();
        const { id } = updates;

        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            let orders = JSON.parse(fileContent || '[]');

            // Update specific order
            orders = orders.map((o: any) => {
                if (o.id === id) {
                    // Merge existing order with updates
                    const updated = { ...o, ...updates };

                    // Add history if status changed or just a generic update
                    if (!updated.history) updated.history = [];

                    // Only add history if status changed
                    if (o.status !== updated.status) {
                        updated.history.push({
                            date: new Date().toISOString(),
                            action: "Status Change",
                            details: `Moved from ${o.status} to ${updated.status}`,
                            user: "Admin"
                        });
                    }

                    return updated;
                }
                return o;
            });

            fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Database not found" }, { status: 404 });

    } catch (error) {
        console.error("Failed to update order:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
