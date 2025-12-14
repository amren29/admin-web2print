import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to SHARED bundles.json
const BUNDLES_FILE = path.join(process.cwd(), '../src/data/bundles.json');

export async function GET() {
    try {
        if (!fs.existsSync(BUNDLES_FILE)) {
            return NextResponse.json([], { status: 200 });
        }
        const data = fs.readFileSync(BUNDLES_FILE, 'utf-8');
        const bundles = JSON.parse(data);
        return NextResponse.json(bundles);
    } catch (error) {
        console.error("Failed to fetch bundles:", error);
        return NextResponse.json({ error: "Failed to fetch bundles" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        let bundles = [];
        if (fs.existsSync(BUNDLES_FILE)) {
            const data = fs.readFileSync(BUNDLES_FILE, 'utf-8');
            bundles = JSON.parse(data);
        }

        const newBundle = {
            id: `BND-${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...body
        };

        bundles.push(newBundle);

        fs.writeFileSync(BUNDLES_FILE, JSON.stringify(bundles, null, 2));

        return NextResponse.json(newBundle);
    } catch (error) {
        console.error("Failed to create bundle:", error);
        return NextResponse.json({ error: "Failed to create bundle" }, { status: 500 });
    }
}
