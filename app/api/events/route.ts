import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRecentEvents, logEvent } from "@/lib/services/analytics.service";

const LogEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  meta: z.string().min(1, "Event metadata is required"),
  tone: z.enum(["signal", "muted"]).optional().default("signal"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 5)));
    const events = await getRecentEvents(limit);
    return NextResponse.json({ events }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch events:", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LogEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid event data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, meta, tone } = parsed.data;
    const event = await logEvent(name, meta, tone);

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (err) {
    console.error("Failed to log event:", err);
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}
