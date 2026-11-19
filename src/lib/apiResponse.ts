import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleApiError(error: any, fallbackMessage: string = "Internal server error") {
  if (error instanceof ZodError) {
    const issues = error.issues || (error as any).errors || [];
    const details = issues.map((issue: any) => ({
      field: issue.path?.join(".") || "unknown",
      message: issue.message,
    }));
    return NextResponse.json(
      {
        success: false,
        error: "Validation error: " + (details[0]?.message || "Invalid input data"),
        details,
      },
      { status: 400 }
    );
  }

  if (error?.code === 11000) {
    return NextResponse.json(
      {
        success: false,
        error: "A record with this unique value already exists.",
      },
      { status: 409 }
    );
  }

  console.error("API Error:", error);
  return NextResponse.json(
    {
      success: false,
      error: error?.message || fallbackMessage,
    },
    { status: 500 }
  );
}

