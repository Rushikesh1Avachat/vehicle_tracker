import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Appointment } from "@/models/Appointment";
import { Vehicle } from "@/models/Vehicle";
import { appointmentCreateSchema } from "@/lib/validations";
import { getStartOfToday } from "@/lib/dateUtils";
import { handleApiError } from "@/lib/apiResponse";
import mongoose from "mongoose";

// GET /api/appointments - List appointments with filters
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const vehicleId = searchParams.get("vehicleId");
    const timeframe = searchParams.get("timeframe"); // 'upcoming' | 'overdue' | 'all'
    const serviceType = searchParams.get("serviceType");

    const query: any = {};

    if (status && ["Scheduled", "Completed", "Cancelled"].includes(status)) {
      query.status = status;
    }

    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
      query.vehicle = vehicleId;
    }

    if (serviceType) {
      query.serviceType = { $regex: serviceType.trim(), $options: "i" };
    }

    const startOfToday = getStartOfToday();

    if (timeframe === "upcoming") {
      // Scheduled appointments today or in the future
      query.status = "Scheduled";
      query.scheduledDate = { $gte: startOfToday };
    } else if (timeframe === "overdue") {
      // Scheduled appointments in the past
      query.status = "Scheduled";
      query.scheduledDate = { $lt: startOfToday };
    }

    // Sort order: for upcoming sort ascending by scheduledDate; for history sort descending
    const sortField = timeframe === "upcoming" ? { scheduledDate: 1 } : { scheduledDate: -1 };

    const appointments = await Appointment.find(query)
      .populate("vehicle", "registrationNumber make model manufacturingYear fuelType currentOdometer nickname")
      .sort(sortField as any)
      .lean();

    return NextResponse.json({ success: true, data: appointments }, { status: 200 });
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch appointments");
  }
}

// POST /api/appointments - Create an appointment
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const parsedData = appointmentCreateSchema.parse(body);

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(parsedData.vehicle);
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: "The selected vehicle does not exist." },
        { status: 404 }
      );
    }

    const appointment = await Appointment.create({
      vehicle: parsedData.vehicle,
      serviceType: parsedData.serviceType,
      scheduledDate: new Date(parsedData.scheduledDate),
      estimatedCost: parsedData.estimatedCost,
      serviceCentre: parsedData.serviceCentre,
      notes: parsedData.notes || "",
      status: "Scheduled",
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("vehicle", "registrationNumber make model nickname currentOdometer")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Service appointment scheduled successfully",
        data: populatedAppointment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return handleApiError(error, "Failed to schedule appointment");
  }
}
