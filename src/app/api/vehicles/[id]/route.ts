import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vehicle, normalizeRegistrationNumber } from "@/models/Vehicle";
import { Appointment } from "@/models/Appointment";
import { vehicleUpdateSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/apiResponse";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vehicles/[id] - Get vehicle details & service history
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid vehicle ID format" }, { status: 400 });
    }

    await connectToDatabase();
    const vehicle = await Vehicle.findById(id).lean();
    if (!vehicle) {
      return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
    }

    // Fetch full appointment history for this vehicle
    const appointments = await Appointment.find({ vehicle: id })
      .sort({ scheduledDate: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          ...vehicle,
          appointments,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch vehicle");
  }
}

// PUT /api/vehicles/[id] - Update vehicle
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid vehicle ID format" }, { status: 400 });
    }

    await connectToDatabase();
    const existingVehicle = await Vehicle.findById(id);
    if (!existingVehicle) {
      return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsedData = vehicleUpdateSchema.parse(body);

    const normalizedReg = normalizeRegistrationNumber(parsedData.registrationNumber);

    // Check if another vehicle has this registration number
    const duplicate = await Vehicle.findOne({
      registrationNumber: normalizedReg,
      _id: { $ne: id },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `Another vehicle with registration number "${normalizedReg}" already exists.`,
        },
        { status: 409 }
      );
    }

    // Ensure odometer cannot be reduced below current recorded odometer (business sense)
    if (parsedData.currentOdometer < existingVehicle.currentOdometer) {
      return NextResponse.json(
        {
          success: false,
          error: `Current odometer reading (${parsedData.currentOdometer} km) cannot be lower than the recorded reading (${existingVehicle.currentOdometer} km).`,
        },
        { status: 400 }
      );
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      {
        ...parsedData,
        registrationNumber: normalizedReg,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Vehicle updated successfully",
        data: updatedVehicle,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error, "Failed to update vehicle");
  }
}

// DELETE /api/vehicles/[id] - Delete vehicle and its associated appointments
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid vehicle ID format" }, { status: 400 });
    }

    await connectToDatabase();
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
    }

    // Delete associated appointments
    await Appointment.deleteMany({ vehicle: id });
    await Vehicle.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: `Vehicle ${vehicle.registrationNumber} and its associated service records deleted.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error, "Failed to delete vehicle");
  }
}
