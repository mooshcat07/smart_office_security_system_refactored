import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convex } from "@/lib/convex/convex";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const esp32Id = searchParams.get("esp32Id");

    if (!esp32Id) {
      return NextResponse.json(
        { error: "esp32Id is required" },
        { status: 400 }
      );
    }

    const command = await convex.query(
      api.deviceCommands.queries.getPendingCommand,
      {
        esp32Id,
      }
    );

    return NextResponse.json({
      success: true,
      command,
    });
  } catch (error) {
    console.error("Device command error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch device command",
      },
      { status: 500 }
    );
  }
}