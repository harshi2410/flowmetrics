import { NextResponse } from "next/server";
import { checkDbConnection } from "@/lib/db";

export async function GET() {
  const isConnected = await checkDbConnection();

  if (!isConnected) {
    return NextResponse.json(
      {
        status: "degraded",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
