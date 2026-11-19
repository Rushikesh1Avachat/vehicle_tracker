import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vehicle, normalizeRegistrationNumber } from "@/models/Vehicle";
import { Appointment } from "@/models/Appointment";
import { vehicleCreateSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/apiResponse";

// GET /api/vehicles - List all vehicles
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");

    let query = {};
    if (search) {
      const normalizedSearch = search.trim();
      query = {
        $or: [
          { registrationNumber: { $regex: normalizedSearch.replace(/\s+/g, ""), $options: "i" } },
          { make: { $regex: normalizedSearch, $options: "i" } },
          { model: { $regex: normalizedSearch, $options: "i" } },
          { nickname: { $regex: normalizedSearch, $options: "i" } },
        ],
      };
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 }).lean();

    // Attach appointment counts for each vehicle
    const vehicleIds = vehicles.map((v) => v._id);
    const appointmentCounts = await Appointment.aggregate([
      { $match: { vehicle: { $in: vehicleIds } } },
      {
        $group: {
          _id: "$vehicle",
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          scheduledAppointments: {
            $sum: { $cond: [{ $eq: ["$status", "Scheduled"] }, 1, 0] },
          },
        },
      },
    ]);

    const countMap = new Map();
    appointmentCounts.forEach((c) => {
      countMap.set(c._id.toString(), c);
    });

    const enrichedVehicles = vehicles.map((v) => {
      const counts = countMap.get(v._id.toString()) || {
        totalAppointments: 0,
        completedAppointments: 0,
        scheduledAppointments: 0,
      };
      return {
        ...v,
        stats: counts,
      };
    });

    return NextResponse.json({ success: true, data: enrichedVehicles }, { status: 200 });
  } catch (error: any) {
    return handleApiError(error, "Failed to fetch vehicles");
  }
}

// POST /api/vehicles - Create a vehicle
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Server-side Zod validation
    const parsedData = vehicleCreateSchema.parse(body);

    // Check unique normalized registration number
    const normalizedReg = normalizeRegistrationNumber(parsedData.registrationNumber);
    const existingVehicle = await Vehicle.findOne({ registrationNumber: normalizedReg });
    if (existingVehicle) {
      return NextResponse.json(
        {
          success: false,
          error: `Vehicle with registration number "${normalizedReg}" already exists.`,
        },
        { status: 409 }
      );
    }

    const newVehicle = await Vehicle.create({
      ...parsedData,
      registrationNumber: normalizedReg,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vehicle registered successfully",
        data: newVehicle,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return handleApiError(error, "Failed to create vehicle");
  }
}
