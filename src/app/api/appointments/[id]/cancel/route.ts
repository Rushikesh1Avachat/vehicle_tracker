import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { appointmentCancelSchema } from "@/lib/validations";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/appointments/[id]/cancel - Cancel an appointment
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    await connectToDatabase();
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    // Business rule: Completed appointments cannot be cancelled
    if (appointment.status === "Completed") {
      return NextResponse.json(
        {
          success: false,
          error: "Completed appointments cannot be cancelled.",
        },
        { status: 400 }
      );
    }

    if (appointment.status === "Cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: "This appointment is already cancelled.",
        },
        { status: 400 }
      );
    }

    let notesAppend = "";
    try {
      const body = await req.json();
      const parsed = appointmentCancelSchema.parse(body);
      if (parsed.notes) {
        notesAppend = parsed.notes;
      }
    } catch {
      // Body is optional
    }

    appointment.status = "Cancelled";
    if (notesAppend) {
      appointment.notes = appointment.notes
        ? `${appointment.notes} | Cancellation Reason: ${notesAppend}`
        : `Cancellation Reason: ${notesAppend}`;
    }

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("vehicle", "registrationNumber make model currentOdometer nickname")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Appointment cancelled successfully.",
        data: populatedAppointment,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PATCH /api/appointments/[id]/cancel error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}

