import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), '../src/data/quotes.json');

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            const data = JSON.parse(fileContent || '[]');
            const quote = data.find((q: any) => q.id === id);

            if (quote) {
                return NextResponse.json(quote);
            }
        }
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to read quote" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const updates = await request.json();

        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            let data = JSON.parse(fileContent || '[]');

            let found = false;
            data = data.map((q: any) => {
                if (q.id === id) {
                    found = true;
                    return { ...q, ...updates, id }; // Ensure ID doesn't change
                }
                return q;
            });

            if (!found) {
                return NextResponse.json({ error: "Quote not found" }, { status: 404 });
            }

            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Data file not found" }, { status: 500 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            let data = JSON.parse(fileContent || '[]');

            const initialLength = data.length;
            data = data.filter((q: any) => q.id !== id);

            if (data.length === initialLength) {
                return NextResponse.json({ error: "Quote not found" }, { status: 404 });
            }

            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Data file not found" }, { status: 500 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete quote" }, { status: 500 });
    }
}
