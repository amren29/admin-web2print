import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const COUPONS_FILE = path.join(process.cwd(), '../src/data/coupons.json');

export async function POST(request: Request) {
    try {
        const { code, cartTotal } = await request.json();
        if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

        if (!fs.existsSync(COUPONS_FILE)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

        const coupons = JSON.parse(fs.readFileSync(COUPONS_FILE, 'utf-8'));
        const coupon = coupons.find((c: any) => c.code === code.toUpperCase() && c.status === 'active');

        if (!coupon) {
            return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 400 });
        }

        if (coupon.minSpend > 0 && cartTotal < coupon.minSpend) {
            return NextResponse.json({ error: `Minimum spend of RM${coupon.minSpend} required` }, { status: 400 });
        }

        // Calculate Discount
        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = (cartTotal * coupon.value) / 100;
        } else {
            discountAmount = coupon.value;
        }

        // Ensure discount doesn't exceed total
        if (discountAmount > cartTotal) discountAmount = cartTotal;

        return NextResponse.json({
            success: true,
            discountAmount,
            couponCode: coupon.code,
            couponType: coupon.type,
            couponValue: coupon.value
        });

    } catch (error) {
        return NextResponse.json({ error: "Validation failed" }, { status: 500 });
    }
}
