import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { Appointment } from "@/models/Appointment";

export async function POST() {
  try {
    await connectToDatabase();

    // Clear existing data
    await Appointment.deleteMany({});
    await Vehicle.deleteMany({});

    // Create Vehicles
    const honda = await Vehicle.create({
      registrationNumber: "MH12AB1234",
      make: "Honda",
      model: "City ZX",
      manufacturingYear: 2021,
      fuelType: "Petrol",
      currentOdometer: 34500,
      nickname: "City Cruiser",
    });

    const nexon = await Vehicle.create({
      registrationNumber: "DL04XY9876",
      make: "Tata",
      model: "Nexon EV Max",
      manufacturingYear: 2023,
      fuelType: "Electric",
      currentOdometer: 18400,
      nickname: "Blue Spark",
    });

    const innova = await Vehicle.create({
      registrationNumber: "KA01CD5678",
      make: "Toyota",
      model: "Innova Crysta 2.4",
      manufacturingYear: 2019,
      fuelType: "Diesel",
      currentOdometer: 76000,
      nickname: "Family Roadie",
    });

    const i10 = await Vehicle.create({
      registrationNumber: "MH14EF4321",
      make: "Hyundai",
      model: "Grand i10 Nios",
      manufacturingYear: 2020,
      fuelType: "CNG",
      currentOdometer: 42100,
      nickname: "Daily Commute",
    });

    const today = new Date();

    // Helper to get relative date
    const getOffsetDate = (days: number, hours: number = 10) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      d.setHours(hours, 0, 0, 0);
      return d;
    };

    // Appointments:
    // 1. Completed appointment on Honda (Past)
    await Appointment.create({
      vehicle: honda._id,
      serviceType: "Periodic Maintenance 30,000km",
      scheduledDate: getOffsetDate(-45),
      estimatedCost: 6500,
      actualCost: 6850,
      serviceCentre: "Apex Honda Care, Pune",
      notes: "Engine oil synthetic replacement, cabin filter change, brake pad cleaning.",
      status: "Completed",
      completionDate: getOffsetDate(-44),
      serviceOdometer: 31200,
    });

    // 2. Completed appointment on Innova (Past)
    await Appointment.create({
      vehicle: innova._id,
      serviceType: "Brake Disc & Fluid Overhaul",
      scheduledDate: getOffsetDate(-20),
      estimatedCost: 12000,
      actualCost: 11500,
      serviceCentre: "Toyota Platinum Workshop, Bengaluru",
      notes: "Replaced front brake discs and brake oil flushed.",
      status: "Completed",
      completionDate: getOffsetDate(-19),
      serviceOdometer: 74500,
    });

    // 3. Upcoming appointment on Honda (Tomorrow)
    await Appointment.create({
      vehicle: honda._id,
      serviceType: "Wheel Alignment & Tire Balancing",
      scheduledDate: getOffsetDate(1, 11),
      estimatedCost: 1800,
      serviceCentre: "Speedy Wheels Tyre Zone",
      notes: "Slight left pulling at highway speeds.",
      status: "Scheduled",
    });

    // 4. Upcoming appointment on Nexon EV (In 4 days)
    await Appointment.create({
      vehicle: nexon._id,
      serviceType: "Annual EV High Voltage Checkup",
      scheduledDate: getOffsetDate(4, 14),
      estimatedCost: 3500,
      serviceCentre: "Tata Motors EV Tech Lab, Delhi",
      notes: "Routine battery health diagnostics and software firmware update.",
      status: "Scheduled",
    });

    // 5. Overdue appointment on i10 (Scheduled 3 days ago, but owner hasn't marked complete or cancelled)
    await Appointment.create({
      vehicle: i10._id,
      serviceType: "CNG Kit Inspection & Filter Service",
      scheduledDate: getOffsetDate(-3, 9),
      estimatedCost: 2400,
      serviceCentre: "GreenFuel Motors, Pune",
      notes: "Mandatory CNG cylinder compliance check.",
      status: "Scheduled",
    });

    // 6. Cancelled appointment on Innova
    await Appointment.create({
      vehicle: innova._id,
      serviceType: "Full Body Detailing & Ceramic Coating",
      scheduledDate: getOffsetDate(-10),
      estimatedCost: 18000,
      serviceCentre: "Detailers Hub Studio",
      notes: "Customer rescheduled due to business travel.",
      status: "Cancelled",
    });

    return NextResponse.json({
      success: true,
      message: "Sample vehicles and appointments seeded successfully!",
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

