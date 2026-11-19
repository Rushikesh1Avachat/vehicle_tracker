/**
 * Date boundary helpers for Vehicle Service & Maintenance Tracker
 * 
 * Treatment of Overdue & Upcoming Appointments:
 * - Start of Day Boundary: midnight (00:00:00.000) of the current day in local time.
 * - An appointment is 'Upcoming' if status is 'Scheduled' AND scheduledDate >= Start of Today.
 * - An appointment is 'Overdue' if status is 'Scheduled' AND scheduledDate < Start of Today.
 * This guarantees that appointments scheduled for today remain 'Upcoming' until the calendar day passes,
 * and any unserviced appointment from previous calendar days is prominently flagged as 'Overdue'.
 */

export function getStartOfToday(refDate: Date = new Date()): Date {
  const start = new Date(refDate);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getEndOfToday(refDate: Date = new Date()): Date {
  const end = new Date(refDate);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isDateOverdue(date: string | Date): boolean {
  const d = new Date(date);
  return d < getStartOfToday();
}

