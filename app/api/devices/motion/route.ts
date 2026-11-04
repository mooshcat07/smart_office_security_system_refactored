import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convex } from "@/lib/convex/convex";

/**
 * ESP32 posts here when the PIR sensor detects motion.
 * Body: { esp32Id: string }
 *
 * Server creates a motionEvent and, if outside working hours (07:00–18:00 CAT),
 * also creates a HIGH alarm. Response tells the ESP32 whether to sound the buzzer.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { esp32Id } = body;

    if (!esp32Id || typeof esp32Id !== "string") {
      return NextResponse.json(
        { error: "esp32Id is required" },
        { status: 400 },
      );
    }

    const result = await convex.mutation(
      api.motionEvents.mutations.recordMotion,
      { esp32Id },
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Motion API error:", error);

    return NextResponse.json(
      { error: "Failed to record motion event" },
      { status: 500 },
    );
  }
}
