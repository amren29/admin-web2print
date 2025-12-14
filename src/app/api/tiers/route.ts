import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to the main app's agent_tiers.json
const TIERS_FILE = path.join(process.cwd(), '../src/data/agent_tiers.json');

export async function GET() {
    try {
        if (!fs.existsSync(TIERS_FILE)) {
            console.error("Tiers file not found at:", TIERS_FILE);
            return NextResponse.json([]);
        }
        const data = fs.readFileSync(TIERS_FILE, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (e) {
        console.error("Failed to load tiers:", e);
        return NextResponse.json([], { status: 500 });
    }
}
