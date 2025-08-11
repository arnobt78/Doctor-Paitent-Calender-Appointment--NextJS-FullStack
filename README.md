
# Doctor Patient Calendar Appointment Management System – NextJS Web Application (Admin Control Panel Permission)

![Screenshot 2025-06-26 at 17 07 38](https://github.com/user-attachments/assets/eedf5a4c-5cf9-4cea-bbd0-878660a9ab15) ![Screenshot 2025-06-26 at 17 09 03](https://github.com/user-attachments/assets/fe0ad75e-c74a-4a7a-8c47-30ef1cf577f2) ![Screenshot 2025-06-26 at 17 09 25](https://github.com/user-attachments/assets/366dea4d-e0df-4b60-a383-919b8504eba3) ![Screenshot 2025-06-26 at 17 09 40](https://github.com/user-attachments/assets/7d2f3a91-a868-4e35-8542-e180581a612e) ![Screenshot 2025-06-26 at 17 10 49](https://github.com/user-attachments/assets/5e2c782c-3f9d-42a8-808a-c73972d2c30e) <img width="1433" height="486" alt="Screenshot 2025-08-11 at 02 35 40" src="https://github.com/user-attachments/assets/72c19730-29d6-4412-a459-2547a3a64180" /> <img width="1254" height="215" alt="Screenshot 2025-08-11 at 02 36 34" src="https://github.com/user-attachments/assets/12ec38cd-1e4d-4735-95e8-754571651c25" /> <img width="1310" height="317" alt="Screenshot 2025-08-11 at 02 36 52" src="https://github.com/user-attachments/assets/0c30a062-bbfe-4a1f-9610-2da9039d71a8" /> <img width="1354" height="323" alt="Screenshot 2025-08-11 at 02 37 00" src="https://github.com/user-attachments/assets/b64979fb-e6ee-4933-9fe7-15647fa821ab" /> <img width="1386" height="708" alt="Screenshot 2025-08-11 at 02 37 15" src="https://github.com/user-attachments/assets/7d6a4978-e189-4bcd-b115-d4d9257f1623" /> <img width="1435" height="495" alt="Screenshot 2025-08-11 at 02 37 40" src="https://github.com/user-attachments/assets/05814743-73b3-47d9-a10f-1c302519b7a8" /> <img width="908" height="491" alt="Screenshot 2025-08-11 at 02 39 00" src="https://github.com/user-attachments/assets/0b0af4f5-e5c5-4637-9d02-1eaba7ab9978" /> <img width="1431" height="554" alt="Screenshot 2025-08-11 at 02 40 47" src="https://github.com/user-attachments/assets/ac8c4241-2ffe-48da-9136-97cbb41b7401" /> <img width="885" height="699" alt="Screenshot 2025-08-11 at 02 38 05" src="https://github.com/user-attachments/assets/74aa44c2-aa80-4367-881c-6f08ae84a1fc" /> <img width="750" height="724" alt="Screenshot 2025-08-11 at 02 38 27" src="https://github.com/user-attachments/assets/b49f7a55-ee6d-46b9-9b80-5793906024f1" /> <img width="504" height="597" alt="Screenshot 2025-08-11 at 02 08 35" src="https://github.com/user-attachments/assets/ef889182-0c04-46a8-a428-cb866ed7438d" />

---

## Project Summary

**Doctor Patient Calendar Appointment Management System** is a modern, full-featured calendar and appointment management web application built with Next.js, React, Supabase, and Tailwind CSS. Designed for healthcare, clinics, or any organization needing robust scheduling, filtering, and client management, it features multiple calendar views, instant search, advanced filtering, and a clean, responsive UI. The project is extensible, type-safe, and ready for production or learning purposes.

- **Live-Demo:** [https://doctor-patient-calendar-appointment.vercel.app/](https://doctor-patient-calendar-appointment.vercel.app/)

---

## Table of Contents

- [Project Summary](#project-summary)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Component Overview](#component-overview)
- [API & Routing](#api--routing)
- [Database Schema & Relationships](#database-schema--relationships)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Application Walkthrough](#application-walkthrough)
- [Customization & Extensibility](#customization--extensibility)
- [Examples & Reusability](#examples--reusability)
- [Keywords](#keywords)
- [Conclusion](#conclusion)
- [Happy Coding!](#happy-coding)

---

## Features

- Multiple calendar views: List, Week, Month
- Instant search & advanced filtering
- Appointment management: create, edit, delete, notes, attachments, activities, assignees
- Invitation system: send, accept, discard (sender/receiver logic)
- User & permission management: session-based, robust access control
- Client/patient management: patients, relatives, filtering
- Supabase integration: authentication, data storage, real-time updates
- Accessibility: Radix UI primitives
- TypeScript: fully typed
- API documentation: status/docs pages, OpenAPI, example requests
- Responsive UI: Tailwind CSS, shadcn/ui

---

## Tech Stack

- **Framework:** Next.js (App Router, React 19)
- **UI:** Tailwind CSS, shadcn/ui, Radix UI, React Icons
- **Database:** Supabase (PostgreSQL, Storage, Auth)
- **State Management:** React Context API
- **Date Handling:** date-fns
- **Type Safety:** TypeScript
- **Other:** ESLint, Prettier, Vercel

---

## Project Structure

```bash
vocare-calender/
├── public/                # Static assets (SVGs, icons, redoc.html)
├── src/
│   ├── app/               # Next.js app directory (routing, layout, entry)
│   │   ├── page.tsx       # Main page with calendar view switcher
│   │   └── api/           # API routes (appointments, dashboard, invitations, permissions, openapi)
│   ├── components/
│   │   ├── calendar/      # Calendar UI components (List, Week, Month, Filters, Dialogs, etc.)
│   │   ├── control-panel/ # Access permissions, invitation list
│   │   ├── login/         # Login UI
│   │   ├── logout/        # Logout UI
│   │   ├── navbar/        # Navigation bar
│   │   ├── register/      # Registration UI
│   │   └── ui/            # Reusable UI primitives (button, input, label, etc.)
│   ├── context/           # React Contexts (DateContext, AppointmentColorContext)
│   ├── lib/               # Utility libraries (Supabase client, helpers)
│   ├── styles/            # Global styles (Tailwind)
│   └── types/             # TypeScript types (invitation, appointment, etc.)
├── package.json           # Project dependencies and scripts
├── tailwind.config.ts     # Tailwind CSS configuration
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

---

## Component Overview

- **Calendar Components:** MonthView, WeekView, AppointmentList, AppointmentDialog, Filters, SearchBar
- **Control Panel Components:** AppointmentAccessPermission, UserAccessPermission, InvitationList
- **UI Primitives:** button.tsx, input.tsx, label.tsx, select.tsx, dialog.tsx, hover-card.tsx, textarea.tsx
- **Auth Components:** Login.tsx, Logout.tsx, Register.tsx, AuthGuard.tsx
- **Context Providers:** DateContext, AppointmentColorContext
- **Lib Utilities:** supabaseClient.ts, supabaseAdmin.ts, email.ts, permissions.ts, utils.ts

---

## API & Routing

- **RESTful Endpoints:**

- `/api/appointments` (GET, POST, PUT, PATCH, DELETE, SEARCH)
- `/api/appointments/[id]/permissions` (GET, DELETE)
- `/api/dashboard/[id]/permissions` (GET, DELETE)
- `/api/invitations` (GET, POST)
- `/api/invitations/accept` (POST)
- `/api/users/search` (GET)
- `/api/openapi` (GET OpenAPI JSON)
- `/api-docs` (API documentation page)
- `/redoc.html` (Full interactive API docs)

- **App Routes:** `/`, `/login`, `/logout`, `/register`, `/control-panel`, `/api-status`, `/api-docs`, etc.

---

## Database Schema & Relationships

Key tables: `appointments`, `appointment_assignee`, `patients`, `relatives`, `categories`, `activities`. Attachments are stored in Supabase Storage bucket `attachments`.

---

## Environment Variables

Create a `.env.local` file in the project root with:

```sh
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Getting Started

1. **Install dependencies:**

```bash
  npm install
  # or
  yarn install
```

2. **Set up environment variables:** See [Environment Variables](#environment-variables).

3. **Run the development server:**

```bash
  npm run dev
  # or
  yarn dev
  ```

4. **Open the app:** Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage Guide

- Switch views: List, Week, Month
- Search appointments by any field
- Filter by category, client, date, status
- Create/edit appointments via dialog
- Discard invitations in control panel
- Responsive design for mobile/desktop
- Clear message if no results

---

## Application Walkthrough

- **Home Page (`/`):** Calendar with view switcher
- **List View:** Appointments grouped by date, search/filter controls
- **Week/Month View:** Calendar grid, click to view/add appointments
- **Appointment Dialog:** Create/edit appointments (title, notes, location, category, patient, status, attachments, activities, assignees)
- **Control Panel:** Manage invitations and permissions
- **API Docs:** `/api-docs` and `/redoc.html`

---

## Customization & Extensibility

- Add fields: extend types in `src/types/types.ts`, update forms/components
- Add filters: update `Filters.tsx`, `AppointmentList.tsx`
- Change theme: edit `tailwind.config.ts`, global styles
- Switch database: update `lib/supabaseClient.ts`
- Extend API: add endpoints in `src/app/api/`

---

## Examples & Reusability

### Reusing AppointmentList Component

```tsx
import AppointmentList from '@/components/calendar/AppointmentList';

export default function MyCustomPage() {
	// Fetch or filter appointments as needed
	return <AppointmentList appointments={myAppointments} />;
}
```

### Using Supabase Client

```ts
import { supabase } from '@/lib/supabaseClient';

const { data, error } = await supabase.from('appointments').select('*');
```

### API Request Example

```ts
fetch('/api/appointments')
	.then(res => res.json())
	.then(data => console.log(data.appointments));
```

---

## Keywords

Next.js, Calendar, Appointment, Scheduling, Supabase, React, Tailwind CSS, shadcn/ui, Healthcare, TypeScript, Fullstack, CRUD, Responsive, Filtering, Search, Radix UI, Modern UI, Vercel, Invitation, Permission, RESTful API, OpenAPI, Accessibility, Arnob Mahmud

---

## Conclusion

Doctor Patient Calendar Appointment Management System is a robust, extensible, and modern calendar/appointment management solution. It’s ideal for healthcare, clinics, and service businesses needing advanced scheduling, filtering, and client management. Built with the latest web technologies, it’s easy to run, customize, and deploy.

---

## Happy Coding! 🎉

Feel free to use this project repository and extend this project further!

If you have any questions or want to share your work, reach out via GitHub or my portfolio at [https://arnob-mahmud.vercel.app/](https://arnob-mahmud.vercel.app/).

**Enjoy building and learning!** 🚀

Thank you! 😊

---
