import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Point to shared data in parent src/data
const DATA_FILE = path.join(process.cwd(), '../src/data/quotes.json');

export async function GET() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            const data = JSON.parse(fileContent || '[]');
            return NextResponse.json(data);
        }
        return NextResponse.json([]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to read quotes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Load existing
        let data: any[] = [];
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            data = JSON.parse(fileContent || '[]');
        }

        // Add new quote
        const newQuote = {
            id: body.id || `QT-${Date.now()}`,
            ...body,
            createdAt: body.createdAt || new Date().toISOString()
        };
        data.push(newQuote);

        // Save
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        return NextResponse.json(newQuote);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
    }
}
