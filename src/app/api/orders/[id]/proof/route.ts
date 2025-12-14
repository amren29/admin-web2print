import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path toSHARED orders.json (Admin is in /admin, data is in /src/data)
// process.cwd() in Admin app (web2print/admin) -> Need to go up one level then to src/data
const ORDERS_FILE = path.join(process.cwd(), '../src/data/orders.json');

// Next.js 16: params is a Promise
export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    console.log("Admin Proof API Triggered");
    console.log("CWD:", process.cwd());
    console.log("Target Orders File:", ORDERS_FILE);
    console.log("Searching for ID:", params.id);

    try {
        const body = await request.json();
        const { action, imageUrl, comment } = body;

        // Ensure file exists
        if (!fs.existsSync(ORDERS_FILE)) {
            console.error("CRITICAL: Orders file NOT found at:", ORDERS_FILE);
            // Try fallback path
            const fallback = path.join(process.cwd(), 'src/data/orders.json');
            return NextResponse.json({
                error: "Database file not found",
                debug: { cwd: process.cwd(), path: ORDERS_FILE }
            }, { status: 500 });
        }

        // Read Orders
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
        const orderIndex = orders.findIndex((o: any) => o.id === params.id);

        console.log("Available IDs (Sample):", orders.slice(0, 3).map((o: any) => o.id));

        if (orderIndex === -1) {
            return NextResponse.json({ error: "Order not found", debug: { receivedId: params.id, availableIds: orders.map((o: any) => o.id) } }, { status: 404 });
        }

        const order = orders[orderIndex];

        // Initialize proofs array if missing
        if (!order.proofs) order.proofs = [];

        if (action === 'upload') {
            // ADMIN UPLOAD
            const newVersion = order.proofs.length + 1;
            const newProof = {
                id: `PRF-${Date.now()}`,
                version: newVersion,
                imageUrl,
                status: 'pending',
                adminComment: comment || "",
                customerComment: "",
                createdAt: new Date().toISOString()
            };
            order.proofs.push(newProof);
            order.status = "Waiting Customer Confirmation"; // Auto-update status

            // Add history
            if (!order.history) order.history = [];
            order.history.push({
                date: new Date().toISOString(),
                action: "Proof Sent",
                details: `Proof v${newVersion} sent - Waiting confirmation.`,
                user: "Admin"
            });
        }
        // Note: 'approve' and 'reject' actions might be called from Storefront only, 
        // but adding them here doesn't hurt if Admin ever needs to simulate it.
        // For now, focusing on 'upload' which is the Admin's job.

        orders[orderIndex] = order;
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

        return NextResponse.json({ success: true, order });

    } catch (error) {
        console.error("Admin Proof API Error:", error);
        return NextResponse.json({ error: "Failed to process proof action" }, { status: 500 });
    }
}
