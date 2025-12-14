import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Adjust path to reach the root web2print/src/config/site-settings.json
// content is in /admin/src/app/api/settings/route.ts
// We need to go up: api -> app -> src -> admin -> web2print -> src -> config
const CONFIG_PATH = path.join(process.cwd(), '../src/config/site-settings.json');

export async function GET() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            return NextResponse.json({ error: "Config file not found" }, { status: 404 });
        }
        const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        return NextResponse.json({ error: "Failed to read config" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Ensure directory exists
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(body, null, 2));
        return NextResponse.json({ success: true, message: "Settings saved" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
    }
}
