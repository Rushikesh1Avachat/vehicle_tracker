# AutoCare — Vehicle Service & Maintenance Tracker

A full-stack car service and maintenance tracking web application built with **Next.js (App Router)**, **TypeScript**, **MongoDB (Mongoose)**, **Tailwind CSS**, and **Shadcn UI-inspired design**.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20/v26)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/vehicle_tracker`) or MongoDB Atlas.

### 2. Environment Configuration
The application comes preconfigured with `.env.local`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/vehicle_tracker
```

### 3. Install & Run
```bash
# Install dependencies (already installed)
npm install

# Start the Next.js development server
npm run dev

# Or run the production build
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Tip:** Click the **"Seed Demo Data"** button in the top navigation bar to instantly populate realistic sample cars, upcoming appointments, and overdue service records for testing.

---

## 🛠️ Features & Completed Capabilities

### 1. Vehicle Management (Full CRUD)
- **Create Vehicle:** Register cars with registration number, make, model, manufacturing year, fuel type, current odometer reading, and optional nickname.
- **Normalized Registration Number:** Automatically strips whitespace and converts to uppercase (e.g. `mh 12 ab 1234` $\rightarrow$ `MH12AB1234`).
- **Strict Uniqueness:** Guaranteed via MongoDB unique index and server-side validation against duplicate registration numbers (HTTP 409 Conflict).
- **Validation Rules:**
  - Year: Sensible range between `1900` and `Current Year + 1`.
  - Odometer: Non-negative integer. On update, reading cannot be lower than the previously recorded odometer reading.
  - Fuel Type: Supported values: `Petrol`, `Diesel`, `Electric`, `Hybrid`, `CNG`, `LPG`.
- **License Plate Visual Preview:** Live visual feedback styling the registration plate in authentic IND font plate format.
- **Edit & Delete:** Full editing capability with safe confirmation dialog for destructive deletion.

---

### 2. Service Appointments (Full CRUD & Status Lifecycle)
- **Statuses Supported:** `Scheduled`, `Completed`, `Cancelled`.
- **Create / Schedule:** Choose vehicle from dropdown, select or type service category (e.g. Periodic Maintenance, Brake Pad Replacement, Oil Change), scheduled date and time, estimated budget, service workshop/centre, and optional notes.
- **List & Filters:** Filter appointments by status tabs (`All`, `Upcoming`, `Overdue`, `Completed`, `Cancelled`) and by specific vehicle.
- **Edit / Reschedule:** Modify appointment details for scheduled services.
- **Completion Workflow (`/complete`):**
  - Captures: **Actual Cost**, **Completion Date**, and **Service Odometer Reading**.
  - **Business Rules Enforced:**
    1. `actualCost` must be strictly greater than zero ($> 0$).
    2. `serviceOdometer` cannot be negative.
    3. `serviceOdometer` cannot be lower than the vehicle's current recorded odometer reading.
    4. Upon completion, the vehicle's recorded odometer reading automatically updates if the service reading is higher.
    5. **Cancelled appointments cannot be completed.**
    6. Already completed appointments cannot be completed again.
- **Cancellation Workflow (`/cancel`):**
  - Allows marking an appointment as cancelled with an optional cancellation reason.
  - Prevents cancelling already completed services.
- **Destructive Action Confirmation:** Deleting an appointment requires modal confirmation to avoid accidental data loss.

---

### 3. Dynamic Analytics Dashboard
All dashboard statistics and lists are **dynamically computed directly from database records** using MongoDB aggregations and indexes (no hardcoded numbers):

1. **Total Vehicles:** Live count of registered cars (`Vehicle.countDocuments()`).
2. **Upcoming Appointments:** Count and sorted list of scheduled services on or after today's boundary.
3. **Overdue Appointments:** Count and highlighted list of scheduled appointments scheduled before today's boundary.
4. **Total Actual Expenditure:** Aggregated sum of `actualCost` across all completed service records (`$match: { status: 'Completed' }, $group: { _id: null, total: { $sum: '$actualCost' } }`).
5. **Overdue Alert Banner:** Prominently alerts the car owner when maintenance dates have passed without being closed or cancelled.
6. **Quick Actions:** Direct 1-click access to complete or reschedule services directly from the dashboard feed.

---

### 4. Date Boundaries & Overdue Appointment Definition

| Term | Boundary Definition | Logic |
| :--- | :--- | :--- |
| **Start of Today** | `00:00:00.000` of current calendar day | Local time midnight reference |
| **Upcoming** | `status === 'Scheduled'` AND `scheduledDate >= Start of Today` | Appointments scheduled for today or future dates |
| **Overdue** | `status === 'Scheduled'` AND `scheduledDate < Start of Today` | Appointments scheduled in previous days that remain unserviced |

---

### 5. ⛅ Bonus: Public Weather API Integration (Service Centre Location)
- **Dedicated Browser Route (`/weather?location=Pune`):** Users can directly navigate to the dedicated Weather Forecaster page in their browser to inspect real-time weather conditions, road grip, humidity, wind velocity, and vehicle care advisories for any workshop location.
- **Live Workshop Weather Data:** Automatically geocodes the service centre / workshop location and retrieves real-time weather conditions, temperature (°C), wind speed, humidity, and weather description.
- **Car Owner Driving Advisory:** Translates WMO weather codes into context-aware vehicle care advice (e.g. *"Clear skies & dry roads — ideal conditions for drop-off and test drives"* or *"Rain showers expected — allow extra travel time and check windshield wipers"*).
- **Graceful Failure Handling:**
  - Robust timeout protection (`AbortController` with 4.5s threshold).
  - Handles invalid locations, geocoding misses, and network dropouts without blocking or breaking the UI.
  - Returns friendly fallback states with a 1-click **"Retry"** option.
  - 10-minute in-memory caching to avoid hammering upstream APIs.
- **Supported Providers:** Powered by **Open-Meteo** (no API key required, 100% free & reliable) with automated fallback/support for **OpenWeatherMap** if an `OPENWEATHER_API_KEY` is present in `.env.local`.

---

## 📡 API Routes Reference

| HTTP Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/weather?location=...` | Dedicated frontend page for searching and viewing workshop weather |
| `GET` | `/api/dashboard` | Returns calculated metrics (vehicles, upcoming, overdue, expenditure) & lists |
| `GET` | `/api/weather` | Fetches live weather & driving advisory for workshop location (`?location=...`) |
| `GET` | `/api/vehicles` | List all vehicles with appointment summary statistics (optional `?search=`) |
| `POST` | `/api/vehicles` | Register a new vehicle with normalized registration validation |
| `GET` | `/api/vehicles/[id]` | Get single vehicle details along with complete service history |
| `PUT` | `/api/vehicles/[id]` | Update vehicle specifications (prevents odometer regression & reg conflicts) |
| `DELETE` | `/api/vehicles/[id]` | Delete vehicle and associated service records |
| `GET` | `/api/appointments` | List appointments with filters (`?status=`, `?timeframe=upcoming\|overdue`, `?vehicleId=`) |
| `POST` | `/api/appointments` | Schedule a new service appointment |
| `GET` | `/api/appointments/[id]` | Retrieve single appointment details |
| `PUT` | `/api/appointments/[id]` | Update/reschedule scheduled appointment |
| `PATCH` | `/api/appointments/[id]/complete` | Complete appointment (validates cost $>0$, odometer $\ge$ vehicle reading) |
| `PATCH` | `/api/appointments/[id]/cancel` | Cancel appointment (blocks completed appointments) |
| `DELETE` | `/api/appointments/[id]` | Delete appointment record |
| `POST` | `/api/seed` | Seeds realistic sample vehicles and test appointments |

---

## 🎨 UI Architecture & Design System

- **Clean & Modern UI:** Designed following the Shadcn UI design pattern with Tailwind CSS tokens.
- **Component Primitives (`src/components/ui/`):**
  - `Button`: Multiple variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `success`), sizes, and loading state spinner.
  - `Card`: Structured card layout with headers, titles, descriptions, and content sections.
  - `Badge`: Semantic status badges (`scheduled`, `completed`, `cancelled`, and pulsing `overdue`).
  - `Modal`: Accessible dialog with backdrop blur, keyboard escape listener, and smooth animations.
  - `ConfirmDialog`: Reusable confirmation modal for destructive operations.
- **Interactive Forms:** Inline validation messages, field-level error feedback, and loading states.
