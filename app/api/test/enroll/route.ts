import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { convex } from "@/lib/convex/convex";

export async function GET() {
  try {
    const result = await convex.mutation(
      api.fingerprintUsers.mutation.startFingerprintEnrollment,
      {
        esp32Id: "ESP32-001",
        fullName: "Test User",
        employeeNumber: "TEST-001",
        department: "IT",
        role: "Test Staff",
        fingerprintId: 19,
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
            : "Failed to create enrollment",
      },
      { status: 500 }
    );
  }
}