import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convex } from "@/lib/convex/convex";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      esp32Id,
      firmware,
      fingerprintConnected,
      fingerprintTemplateCount,
    } = body;

    // Validate ESP32 ID
    if (!esp32Id) {
      return NextResponse.json(
        { error: "esp32Id is required" },
        { status: 400 }
      );
    }

    // Validate fingerprint status
    if (typeof fingerprintConnected !== "boolean") {
      return NextResponse.json(
        {
          error:
            "fingerprintConnected must be a boolean",
        },
        { status: 400 }
      );
    }

    // Validate fingerprint template count
    if (
      typeof fingerprintTemplateCount !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "fingerprintTemplateCount must be a number",
        },
        { status: 400 }
      );
    }

    // Send heartbeat to Convex
    const result = await convex.mutation(
      api.devices.mutation.updateDeviceStatus,
      {
        esp32Id,
        firmware,
        fingerprintConnected,
        fingerprintTemplateCount,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Device status error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to update device status",
      },
      { status: 500 }
    );
  }
}