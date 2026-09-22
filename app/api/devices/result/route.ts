import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convex } from "@/lib/convex/convex";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      commandId,
      success,
      failureReason,
    } = body;

    // -------------------------------------------------
    // Validate command ID
    // -------------------------------------------------

    if (!commandId) {
      return NextResponse.json(
        {
          error: "commandId is required",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // Validate success
    // -------------------------------------------------

    if (typeof success !== "boolean") {
      return NextResponse.json(
        {
          error: "success must be a boolean",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // Send result to Convex
    // -------------------------------------------------

    const result = await convex.mutation(
      api.deviceCommands.mutations.completeFingerprintEnrollment,
      {
        commandId,
        success,
        failureReason,
      }
    );

    return NextResponse.json(result);

  } catch (error) {

    console.error(
      "Command result API error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to process command result",
      },
      { status: 500 }
    );
  }
}