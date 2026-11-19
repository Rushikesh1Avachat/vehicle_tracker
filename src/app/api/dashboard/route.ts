import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { Appointment } from "@/models/Appointment";
import { getStartOfToday } from "@/lib/dateUtils";

// GET /api/dashboard - Aggregated stats & upcoming appointments
export async function GET() {
  try {
    await connectToDatabase();

    const startOfToday = getStartOfToday();

    // 1. Total vehicles in system
    const totalVehiclesPromise = Vehicle.countDocuments();

    // 2. Upcoming appointments: Scheduled with scheduledDate >= startOfToday (today or future)
    const upcomingAppointmentsCountPromise = Appointment.countDocuments({
      status: "Scheduled",
      scheduledDate: { $gte: startOfToday },
    });

    // 3. Overdue appointments: Scheduled with scheduledDate < startOfToday (past days)
    const overdueAppointmentsCountPromise = Appointment.countDocuments({
      status: "Scheduled",
      scheduledDate: { $lt: startOfToday },
    });

    // 4. Total actual expenditure on completed services (sum of actualCost)
    const expenditureAggregatePromise = Appointment.aggregate([
      { $match: { status: "Completed" } },
      {
        $group: {
          _id: null,
          totalExpenditure: { $sum: "$actualCost" },
          averageCost: { $avg: "$actualCost" },
          completedCount: { $sum: 1 },
        },
      },
    ]);

    // 5. Total counts for other statuses
    const cancelledCountPromise = Appointment.countDocuments({ status: "Cancelled" });

    // 6. Upcoming appointments list (sorted earliest to latest, populated with vehicle info)
    const upcomingListPromise = Appointment.find({
      status: "Scheduled",
      scheduledDate: { $gte: startOfToday },
    })
      .populate("vehicle", "registrationNumber make model nickname currentOdometer fuelType")
      .sort({ scheduledDate: 1 })
      .limit(10)
      .lean();

    // 7. Overdue appointments list (sorted earliest first so the longest overdue is top)
    const overdueListPromise = Appointment.find({
      status: "Scheduled",
      scheduledDate: { $lt: startOfToday },
    })
      .populate("vehicle", "registrationNumber make model nickname currentOdometer fuelType")
      .sort({ scheduledDate: 1 })
      .limit(10)
      .lean();

    // 8. Recent completed services
    const recentCompletedPromise = Appointment.find({ status: "Completed" })
      .populate("vehicle", "registrationNumber make model nickname")
      .sort({ completionDate: -1, updatedAt: -1 })
      .limit(5)
      .lean();

    const [
      totalVehicles,
      upcomingCount,
      overdueCount,
      expenditureResult,
      cancelledCount,
      upcomingAppointments,
      overdueAppointments,
      recentCompleted,
    ] = await Promise.all([
      totalVehiclesPromise,
      upcomingAppointmentsCountPromise,
      overdueAppointmentsCountPromise,
      expenditureAggregatePromise,
      cancelledCountPromise,
      upcomingListPromise,
      overdueListPromise,
      recentCompletedPromise,
    ]);

    const totalExpenditure = expenditureResult[0]?.totalExpenditure || 0;
    const completedCount = expenditureResult[0]?.completedCount || 0;
    const averageCost = expenditureResult[0]?.averageCost || 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          metrics: {
            totalVehicles,
            upcomingAppointments: upcomingCount,
            overdueAppointments: overdueCount,
            totalExpenditure,
            completedAppointments: completedCount,
            cancelledAppointments: cancelledCount,
            averageCostPerCompletedService: Math.round(averageCost * 100) / 100,
          },
          dateBoundary: {
            definition: "An appointment is 'Upcoming' if status is Scheduled and scheduledDate is on or after 00:00:00 of the current day. It is 'Overdue' if status is Scheduled and scheduledDate is prior to today.",
            startOfToday: startOfToday.toISOString(),
          },
          upcomingAppointments,
          overdueAppointments,
          recentCompleted,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

