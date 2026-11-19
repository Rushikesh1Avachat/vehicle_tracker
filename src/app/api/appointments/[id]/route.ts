import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Vehicle } from "@/models/Vehicle";
import { appointmentUpdateSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/apiResponse";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/appointments/[id] - Single appointment
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    await connectToDatabase();
    const appointment = await Appointment.findById(id)
      .populate("vehicle", "registrationNumber make model manufacturingYear fuelType currentOdometer nickname")
      .lean();

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: appointment }, { status: 200 });
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch appointment");
  }
}

// PUT /api/appointments/[id] - Update scheduled appointment details
export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    if (appointment.status === "Cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: "Cancelled appointments cannot be edited. Please create a new appointment instead.",
        },
        { status: 400 }
      );
    }

    if (appointment.status === "Completed") {
      return NextResponse.json(
        {
          success: false,
          error: "Completed appointments cannot be edited.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsedData = appointmentUpdateSchema.parse(body);

    if (parsedData.vehicle) {
      const vehicleExists = await Vehicle.findById(parsedData.vehicle);
      if (!vehicleExists) {
        return NextResponse.json(
          { success: false, error: "Selected vehicle does not exist" },
          { status: 404 }
        );
      }
    }

    const updatePayload: any = { ...parsedData };
    if (parsedData.scheduledDate) {
      updatePayload.scheduledDate = new Date(parsedData.scheduledDate);
    }

    const updated = await Appointment.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    }).populate("vehicle", "registrationNumber make model nickname currentOdometer");

    return NextResponse.json(
      {
        success: true,
        message: "Appointment updated successfully",
        data: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error, "Failed to update appointment");
  }
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    await Appointment.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Appointment deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error, "Failed to delete appointment");
  }
}
