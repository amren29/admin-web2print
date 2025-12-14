import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const QUOTES_FILE = path.join(process.cwd(), '../src/data/quotes.json');
const INVOICES_FILE = path.join(process.cwd(), '../src/data/invoices.json');

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 1. Read Quote
        if (!fs.existsSync(QUOTES_FILE)) return NextResponse.json({ error: "Quotes file missing" }, { status: 500 });
        const quotesContent = fs.readFileSync(QUOTES_FILE, 'utf-8');
        let quotes = JSON.parse(quotesContent || '[]');

        const quoteIndex = quotes.findIndex((q: any) => q.id === id);
        if (quoteIndex === -1) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
        const quote = quotes[quoteIndex];

        // 2. Check if already converted? (Optional, but good practice)
        if (quote.status === 'Converted') {
            // Return existing? logic can vary. For now, allow re-creation but warn or just process.
        }

        // 3. Create Invoice Object
        const invoiceId = `INV-${Date.now()}`;
        const newInvoice = {
            id: invoiceId,
            quoteId: quote.id,
            customerName: quote.customerName,
            phone: quote.phone,
            items: quote.items,
            totalAmount: quote.totalAmount,
            status: "Unpaid", // Default status for new invoice
            createdAt: new Date().toISOString(),
            generatedFromQuote: true
        };

        // 4. Save Invoice
        let invoices = [];
        if (fs.existsSync(INVOICES_FILE)) {
            const invoicesContent = fs.readFileSync(INVOICES_FILE, 'utf-8');
            invoices = JSON.parse(invoicesContent || '[]');
        }
        invoices.push(newInvoice);
        fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2));

        // 5. Update Quote Status
        quotes[quoteIndex] = { ...quote, status: "Converted", invoiceId: invoiceId };
        fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2));

        return NextResponse.json({ success: true, invoiceId });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to convert quote" }, { status: 500 });
    }
}
