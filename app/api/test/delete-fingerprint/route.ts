import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convex } from "@/lib/convex/convex";

export async function GET() {
  try {
    const result = await convex.mutation(
      api.deviceCommands.mutations.startFingerprintDeletion,
      {
        esp32Id: "ESP32-001",
        fingerprintId: 1,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create deletion command",
      },
      { status: 500 }
    );
  }
}