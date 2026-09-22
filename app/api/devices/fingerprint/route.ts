
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convex } from "@/lib/convex/convex";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      esp32Id,
      fingerprintId,
      result,
    } = body;

    // Validate required fields
    if (!esp32Id) {
      return NextResponse.json(
        { error: "esp32Id is required" },
        { status: 400 }
      );
    }

    if (typeof fingerprintId !== "number") {
      return NextResponse.json(
        { error: "fingerprintId must be a number" },
        { status: 400 }
      );
    }

    if (result !== "GRANTED" && result !== "DENIED") {
      return NextResponse.json(
        { error: "result must be GRANTED or DENIED" },
        { status: 400 }
      );
    }

    // Send fingerprint event to Convex
    const response = await convex.mutation(
      api.accessLogs.mutations.recordFingerprintAccess,
      {
        esp32Id,
        fingerprintId,
        result,
      }
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Fingerprint API error:", error);

    return NextResponse.json(
      {
        error: "Failed to record fingerprint access",
      },
      { status: 500 }
    );
  }
}