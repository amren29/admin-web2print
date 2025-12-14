import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), '../src/data/invoices.json');

export async function GET() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            const data = JSON.parse(fileContent || '[]');
            return NextResponse.json(data);
        }
        return NextResponse.json([]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to read invoices" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        let data: any[] = [];
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            data = JSON.parse(fileContent || '[]');
        }

        const newInvoice = {
            ...body,
            id: body.id || `INV-${Date.now()}`,
            createdAt: body.createdAt || new Date().toISOString()
        };
        data.push(newInvoice);

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        return NextResponse.json(newInvoice);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}
