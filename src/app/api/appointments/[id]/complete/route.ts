import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Vehicle } from "@/models/Vehicle";
import { appointmentCompleteSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/apiResponse";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/appointments/[id]/complete - Complete a service appointment
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

    // Business Rule 1: Cancelled appointments cannot be completed
    if (appointment.status === "Cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: "Cancelled appointments cannot be completed.",
        },
        { status: 400 }
      );
    }

    // Business Rule 2: Cannot complete an already completed appointment
    if (appointment.status === "Completed") {
      return NextResponse.json(
        {
          success: false,
          error: "This appointment has already been completed.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsedData = appointmentCompleteSchema.parse(body);

    // Business Rule 3: actual cost must be greater than zero
    if (parsedData.actualCost <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Actual cost must be greater than zero.",
        },
        { status: 400 }
      );
    }

    // Fetch associated vehicle to validate and update odometer
    const vehicle = await Vehicle.findById(appointment.vehicle);
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: "Associated vehicle not found." },
        { status: 404 }
      );
    }

    // Business Rule 4: odometer reading cannot be negative or lower than vehicle recording reading
    if (parsedData.serviceOdometer < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Service odometer reading cannot be negative.",
        },
        { status: 400 }
      );
    }

    if (parsedData.serviceOdometer < vehicle.currentOdometer) {
      return NextResponse.json(
        {
          success: false,
          error: `Service odometer reading (${parsedData.serviceOdometer} km) cannot be lower than vehicle's current recorded reading (${vehicle.currentOdometer} km).`,
        },
        { status: 400 }
      );
    }

    // Update appointment
    appointment.status = "Completed";
    appointment.actualCost = parsedData.actualCost;
    appointment.completionDate = new Date(parsedData.completionDate);
    appointment.serviceOdometer = parsedData.serviceOdometer;
    await appointment.save();

    // Automatically update vehicle's current odometer reading if service odometer is higher
    if (parsedData.serviceOdometer > vehicle.currentOdometer) {
      vehicle.currentOdometer = parsedData.serviceOdometer;
      await vehicle.save();
    }

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("vehicle", "registrationNumber make model currentOdometer nickname")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Service appointment marked as completed successfully.",
        data: populatedAppointment,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error, "Failed to complete appointment");
  }
}
