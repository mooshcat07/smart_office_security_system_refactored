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

    if (!commandId) {
      return NextResponse.json(
        { error: "commandId is required" },
        { status: 400 }
      );
    }

    if (typeof success !== "boolean") {
      return NextResponse.json(
        { error: "success must be a boolean" },
        { status: 400 }
      );
    }

    const result = await convex.mutation(
      api.deviceCommands.mutations.completeFingerprintEnrollment,
      {
        commandId,
        success,
        failureReason,
      }
    );

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {

    console.error(
      "Device command result error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to process device command result",
      },
      { status: 500 }
    );
  }
}
