import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const COUPONS_FILE = path.join(process.cwd(), '../src/data/coupons.json');

export async function GET() {
    try {
        if (!fs.existsSync(COUPONS_FILE)) {
            return NextResponse.json([]);
        }
        const data = fs.readFileSync(COUPONS_FILE, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        let coupons = [];
        if (fs.existsSync(COUPONS_FILE)) {
            coupons = JSON.parse(fs.readFileSync(COUPONS_FILE, 'utf-8'));
        }

        // Check duplicates if creating new
        if (body.code && coupons.some((c: any) => c.code === body.code && c.id !== body.id)) {
            return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
        }

        // Determine if Update or Create
        const existingIndex = coupons.findIndex((c: any) => c.id === body.id);

        if (existingIndex > -1) {
            coupons[existingIndex] = { ...coupons[existingIndex], ...body };
        } else {
            coupons.push({
                ...body,
                id: body.id || `CPN-${Date.now()}`,
                usageCount: 0
            });
        }

        fs.writeFileSync(COUPONS_FILE, JSON.stringify(coupons, null, 2));
        return NextResponse.json({ success: true, coupon: body });

    } catch (error) {
        return NextResponse.json({ error: "Failed to save coupon" }, { status: 500 });
    }
}
