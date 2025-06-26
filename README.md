# Doctor Patient Calendar Appointment Management System - NextJS

A modern, full-featured calendar and appointment management web application built with Next.js, React, Supabase, and Tailwind CSS. Designed for healthcare, clinics, or any organization needing robust scheduling, filtering, and client management, it features multiple calendar views, instant search, advanced filtering, and a clean, responsive UI.

**Live-Demo:** <https://doctor-patient-calendar-appointment.vercel.app/>

---

## Table of Contents

- [Project Summary](#project-summary)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Mathematical & Logical Calculations](#mathematical--logical-calculations)
- [Supabase Database Schema & Relationships](#supabase-database-schema--relationships)
- [Supabase Storage & Policies](#supabase-storage--policies)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Application Walkthrough](#application-walkthrough)
- [API & Routing](#api--routing)
- [Customization & Extensibility](#customization--extensibility)
- [Future Roadmap](#future-roadmap)
- [Keywords](#keywords)
- [Conclusion](#conclusion)

---

## Project Summary

**Doctor Patient Calendar Appointment Management System** is a Next.js-based calendar and appointment management system. It supports multiple calendar views (list, week, month), instant search and filtering, appointment creation/editing, and client/patient management. The app is optimized for performance and usability, with a focus on healthcare and service-based businesses.

---

## Features

- **Multiple Calendar Views:** Switch between List, Week, and Month views.
- **Instant Search:** Search appointments by any field (name, title, notes, etc.) with real-time filtering.
- **Advanced Filtering:** Filter by category, client/patient, date, and status.
- **Responsive UI:** Clean, modern design using Tailwind CSS and shadcn/ui, fully responsive for desktop and mobile.
- **Appointment Management:** Create, edit, and delete appointments with support for notes, attachments, activities, and assignees.
- **Client/Patient Management:** Manage patients and relatives, with detailed info and filtering.
- **Supabase Integration:** Uses Supabase for authentication, data storage, and real-time updates.
- **Accessibility:** Built with accessibility in mind using Radix UI primitives.
- **TypeScript:** Fully typed for safety and maintainability.

---

## Tech Stack

- **Framework:** Next.js (App Router, React 19)
- **UI:** Tailwind CSS, shadcn/ui, Radix UI, React Icons
- **Database:** Supabase (PostgreSQL, Storage, Auth)
- **State Management:** React Context API
- **Date Handling:** date-fns
- **Type Safety:** TypeScript
- **Other:** ESLint, Prettier, Vercel (for deployment)

---

## Project Structure

```bash
doctor-patient-calendar-appointment/
├── public/                # Static assets (SVGs, icons)
├── src/
│   ├── app/               # Next.js app directory (routing, layout, entry)
│   │   ├── page.tsx       # Main page with calendar view switcher
│   │   └── api/           # API routes (appointments)
│   ├── components/
│   │   ├── calendar/      # Calendar UI components (List, Week, Month, Filters, Dialogs, etc.)
│   │   └── ui/            # Reusable UI primitives (button, input, label, etc.)
│   ├── context/           # React Contexts (DateContext)
│   ├── lib/               # Utility libraries (Supabase client, helpers)
│   ├── styles/            # Global styles (Tailwind)
│   └── types/             # TypeScript types
├── package.json           # Project dependencies and scripts
├── tailwind.config.ts     # Tailwind CSS configuration
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

---

## Mathematical & Logical Calculations

- **Date Grouping:** Appointments are grouped by date using JavaScript date-fns utilities, allowing for efficient rendering and logical separation in List view.
- **Filtering & Search:** All filtering and search logic is performed in-memory for instant feedback. Search matches across multiple fields (title, notes, patient name, etc.), and filters are combined using logical AND.
- **Color Assignment:** Categories and avatars use a deterministic color assignment based on a hash of the string, ensuring consistent color-coding across sessions.
- **Responsive Layout:** Uses flexbox and Tailwind utilities for dynamic, mathematical layout calculations (e.g., min/max widths, gap, flex-basis) to ensure a seamless experience on all devices.
- **Status Calculation:** Appointment status (done, pending, alert) is calculated and displayed based on the current date and appointment data.

---

## Supabase Database Schema & Relationships

The project uses a normalized relational schema in Supabase PostgreSQL. Below are the main tables and their relationships:

### Tables & Types

- **categories**: Appointment categories (label, description, color, icon)
- **patients**: Patient records (name, birth date, care level, pronoun, email, etc.)
- **appointments**: Main appointment table (title, notes, start/end, location, patient, category, attachments, status)
- **relatives**: Relatives of patients
- **appointment_assignee**: Links appointments to users (patients or relatives)
- **activities**: Activity log for appointments (type, content)

### TypeScript Types

```ts
export type UUID = string;

// Patient
export interface Patient {
  id: UUID;
  firstname: string;
  lastname: string;
  birth_date: string;
  care_level: number;
  pronoun: string;
  email: string;
  active: boolean;
  active_since: string;
  created_at: string;
}

// Relative
export interface Relative {
  id: UUID;
  created_at: string;
  firstname: string;
  lastname: string;
  pronoun: string;
  notes: string;
}

// Category
export interface Category {
  id: UUID;
  created_at: string;
  updated_at: string | null;
  label: string;
  description: string;
  color: string;
  icon: string;
}

// Appointment
export interface Appointment {
  id: UUID;
  created_at: string;
  updated_at: string | null;
  start: string;
  end: string;
  location: string;
  patient: UUID;
  attachements: string[]; // Assuming array of URLs or filenames
  category: UUID;
  notes: string;
  title: string;
  status?: "done" | "pending" | "alert"; // Optional status field added
}

// Appointment Assignee
export interface AppointmentAssignee {
  id: UUID;
  created_at: string;
  appointment: UUID;
  user: UUID;
  user_type: "relatives" | "patients";
}

// Activity
export interface Activity {
  id: UUID;
  created_at: string;
  created_by: UUID;
  appointment: UUID;
  type: string;
  content: string;
}
```

### SQL Schema Snippets

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone,
  label text,
  description text,
  color text DEFAULT '#00ff00',
  icon text
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  firstname text,
  lastname text,
  birth_date timestamp with time zone,
  care_level numeric,
  pronoun text,
  email text,
  active boolean,
  active_since timestamp with time zone
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone,
  start timestamp with time zone,
  "end" timestamp with time zone,
  location text,
  patient uuid REFERENCES patients(id),
  attachements text[], -- keep typo for compatibility
  category uuid REFERENCES categories(id),
  notes text,
  title text,
  status text DEFAULT 'pending'
);

-- Relatives
CREATE TABLE IF NOT EXISTS relatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  pronoun text,
  firstname text,
  lastname text,
  notes text
);

-- Appointment Assignee
CREATE TABLE IF NOT EXISTS appointment_assignee (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  appointment uuid REFERENCES appointments(id),
  "user" uuid,
  user_type text DEFAULT 'relatives'
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid,
  appointment uuid REFERENCES appointments(id),
  type text,
  content text
);

-- Add status column
ALTER TABLE appointments ADD COLUMN status text DEFAULT 'pending';

-- Drop and recreate foreign keys with ON DELETE CASCADE
ALTER TABLE appointment_assignee
  DROP CONSTRAINT IF EXISTS appointment_assignee_appointment_fkey,
  ADD CONSTRAINT appointment_assignee_appointment_fkey
    FOREIGN KEY (appointment) REFERENCES appointments(id) ON DELETE CASCADE;
ALTER TABLE activities
  DROP CONSTRAINT IF EXISTS activities_appointment_fkey,
  ADD CONSTRAINT activities_appointment_fkey
    FOREIGN KEY (appointment) REFERENCES appointments(id) ON DELETE CASCADE;
```

### Example Data

```sql
-- Sample Category
INSERT INTO categories (label, description, color, icon)
VALUES
('Arzttermin', 'Arztbesuche und medizinische Termine', '#3498db', 'stethoscope'),
('Pflegeeinsatz', 'Pflegeeinsatz durch Pflegekraft', '#2ecc71', 'user-nurse');

-- Sample Patient
INSERT INTO patients (firstname, lastname, birth_date, care_level, pronoun, email, active, active_since)
VALUES
('Max', 'Mustermann', '1950-05-20T00:00:00+00:00', 3, 'Herr', 'max@example.com', true, '2020-01-01T00:00:00+00:00');

-- Sample Appointment (linked to Max + category)
INSERT INTO appointments (title, notes, start, "end", location, patient, category)
SELECT
'Arztbesuch bei Dr. Meier',
'Routineuntersuchung & Bluttest',
'2025-06-24T10:00:00+02:00',
'2025-06-24T11:00:00+02:00',
'Praxis Dr. Meier',
(SELECT id FROM patients LIMIT 1),
(SELECT id FROM categories WHERE label = 'Arzttermin' LIMIT 1);

-- Another Appointment
INSERT INTO appointments (title, notes, start, "end", location, patient, category)
SELECT
'Morgendliche Pflege',
'Waschen und Medikamente verabreichen',
'2025-06-25T08:00:00+02:00',
'2025-06-25T08:30:00+02:00',
'Zuhause bei Max',
(SELECT id FROM patients LIMIT 1),
(SELECT id FROM categories WHERE label = 'Pflegeeinsatz' LIMIT 1);

-- Add a new patient
INSERT INTO patients (firstname, lastname, birth_date, care_level, pronoun, email, active, active_since)
VALUES
('Erika', 'Musterfrau', '1960-07-15T00:00:00+00:00', 2, 'Frau', 'erika@example.com', true, '2021-03-01T00:00:00+00:00');

-- Add a new appointment for Erika
INSERT INTO appointments (title, notes, start, "end", location, patient, attachements, category, status)
SELECT
'Pflegebesuch bei Erika',
'Medikamente und Frühstück',
'2025-06-26T09:00:00+02:00',
'2025-06-26T09:30:00+02:00',
'Zuhause bei Erika',
(SELECT id FROM patients WHERE firstname = 'Erika' AND lastname = 'Musterfrau' LIMIT 1),
ARRAY['beispiel1.pdf', 'beispiel2.jpg'],
(SELECT id FROM categories WHERE label = 'Pflegeeinsatz' LIMIT 1),
'pending';
```

### Query Example

```sql
SELECT
  a.*,
  c.label AS category_label,
  p.firstname AS patient_firstname,
  p.lastname AS patient_lastname,
  aa.user AS assignee_user,
  act.type AS activity_type,
  act.content AS activity_content
FROM appointments a
LEFT JOIN categories c ON a.category = c.id
LEFT JOIN patients p ON a.patient = p.id
LEFT JOIN appointment_assignee aa ON aa.appointment = a.id
LEFT JOIN activities act ON act.appointment = a.id;
```

### Attachments & Storage

- **Public Bucket:** All appointment attachments (PDFs, images, etc.) are stored in a Supabase public bucket named `attachments`.
- **Attachment Field:** The `attachements` field in the `appointments` table is an array of filenames/URLs referencing files in the bucket.
- **Migration Utility:**

```sql
UPDATE appointments
SET attachements = ARRAY(
  SELECT regexp_replace(f, '^attachments/', '') FROM unnest(attachements) AS f
)
WHERE attachements IS NOT NULL;
```

### Storage Policies

- **Policy 1:** Allow read access to all users for public files in the `attachments` bucket.
- **Policy 2:** Allow write access only to authenticated users (future-proof for JWT auth).

---

## Environment Variables

Create a `.env.local` file in the project root with the following:

```sh
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Get these values from your Supabase project dashboard.

---

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up environment variables:**  
   See [Environment Variables](#environment-variables).

3. **Run the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open the app:**  
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage Guide

- **Switch Views:** Use the header to toggle between List, Week, and Month views.
- **Search Appointments:** Use the search bar to instantly filter appointments by any field (name, title, notes, etc.).
- **Filter Appointments:** Use the filter controls to narrow results by category, client, date, or status. The Reset button clears all filters and search.
- **Create/Edit Appointments:** Click on a date or appointment to open the dialog for editing or creating.
- **Responsive Design:** The UI adapts for mobile and desktop.
- **No Results Handling:** If no appointments match your filters, a clear message is shown.

---

## Application Walkthrough

- **Home Page (`/`):**  
  Displays the calendar with view switcher (List, Week, Month).

- **List View:**

  - Shows all appointments grouped by date.
  - Search and filter controls in a single responsive row.
  - Edit or delete appointments directly from the list.

- **Week/Month View:**

  - Visual calendar grid.
  - Click on a day to view or add appointments.

- **Appointment Dialog:**

  - Create or edit appointments.
  - Fields: title, notes, location, category, patient, status, attachments, activities, assignees.

- **API:**
  - `/api/appointments/route.ts` handles appointment CRUD via Supabase.

---

## API & Routing

- **API Route:**

  - `/api/appointments/route.ts` (RESTful endpoints for appointments)

- **App Routes:**
  - `/` (main calendar)
  - All routing handled by Next.js App Router.

---

## Customization & Extensibility

- **Add More Fields:** Extend types in `src/types/types.ts` and update forms/components.
- **Add More Filters:** Update `Filters.tsx` and filtering logic in `AppointmentList.tsx`.
- **Change Theme:** Edit `tailwind.config.ts` and global styles.
- **Switch Database:** Swap out Supabase in `lib/supabaseClient.ts` for another backend.

---

## Future Roadmap

- **Authentication & Authorization:**
  - Add JWT-based authentication (Supabase Auth or custom) so only authenticated users can access their own calendar and appointments.
  - Restrict all routes and API endpoints to authorized users only.
  - Each user will only see and manage their own appointments, patients, and related data.
- **User Roles:**
  - Add support for doctors, nurses, and other staff, with role-based access control.
- **Patient/Doctor Management:**
  - Add dedicated pages for managing patients, doctors, and relatives, based on the current schema.
- **Real-Time Updates:**
  - Enable real-time updates for appointments and notifications.
- **More Integrations:**
  - Add calendar export, reminders, and more.

---

## Keywords

Next.js, Calendar, Appointment, Scheduling, Supabase, React, Tailwind CSS, shadcn/ui, Healthcare, TypeScript, Fullstack, CRUD, Responsive, Filtering, Search, Radix UI, Modern UI, Vercel

---

## Conclusion

Doctor Patient Calendar Appointment Management System is a robust, extensible, and modern calendar/appointment management solution. It’s ideal for healthcare, clinics, and service businesses needing advanced scheduling, filtering, and client management. Built with the latest web technologies, it’s easy to run, customize, and deploy.

If you have questions or want to contribute, feel free to open an issue or pull request!
