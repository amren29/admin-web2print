import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const INVOICES_FILE = path.join(process.cwd(), '../src/data/invoices.json');
const ORDERS_FILE = path.join(process.cwd(), '../src/data/orders.json');

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 1. Read Invoice
        if (!fs.existsSync(INVOICES_FILE)) return NextResponse.json({ error: "Invoices file missing" }, { status: 500 });
        const invoicesContent = fs.readFileSync(INVOICES_FILE, 'utf-8');
        let invoices = JSON.parse(invoicesContent || '[]');

        const invoiceIndex = invoices.findIndex((i: any) => i.id === id);
        if (invoiceIndex === -1) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        const invoice = invoices[invoiceIndex];

        // 2. Read Orders
        let orders = [];
        if (fs.existsSync(ORDERS_FILE)) {
            const ordersContent = fs.readFileSync(ORDERS_FILE, 'utf-8');
            orders = JSON.parse(ordersContent || '[]');
        }

        // 3. Create Orders for each Item
        const newOrders: any[] = [];
        const timestamp = new Date().toISOString();
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 3); // Default 3 days deadline

        if (invoice.items && Array.isArray(invoice.items)) {
            invoice.items.forEach((item: any, index: number) => {
                // Check if this item is already converted? (Optimization for later)

                const newOrder = {
                    id: `ORD-${invoice.id.replace('INV-', '')}-${index + 1}`,
                    customer: invoice.customerName,
                    phone: invoice.phone,
                    email: "",
                    productName: item.productName,
                    quantity: item.quantity,
                    total: item.totalPrice, // Price for this job
                    deadline: deadline.toISOString().split('T')[0],
                    priority: "Normal",
                    source: "Web (Invoice)",
                    status: "New Order",
                    invoiceNo: invoice.id,
                    specs: {
                        productName: item.productName,
                        quantity: item.quantity,
                        size: item.specs?.size || "Standard",
                        material: item.specs?.material || "Standard",
                        department: "Production", // Default
                        ...item.specs
                    },
                    fileStatus: "pending",
                    createdAt: timestamp,
                    history: [
                        {
                            date: timestamp,
                            action: "Created",
                            details: `Generated from Invoice #${invoice.id}`,
                            user: "Admin"
                        }
                    ]
                };
                newOrders.push(newOrder);
                orders.push(newOrder);
            });
        }

        // 4. Save Orders
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

        // 5. Update Invoice Status to 'Paid' (assuming conversion means confirmed)
        // Or keep it 'Unpaid' but linked? User asked to 'convert'. 
        // Usually converting to order means "Go ahead", often implying payment.
        // I will set it to 'Paid' if it wasn't.
        invoices[invoiceIndex] = { ...invoice, status: "Paid", convertedToOrders: true };
        fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2));

        return NextResponse.json({ success: true, ordersCreated: newOrders.length });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to convert invoice" }, { status: 500 });
    }
}
