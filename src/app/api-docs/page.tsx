"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">API Documentation</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
      <div className="mb-8">
        <p className="text-gray-700 mb-2">
          Welcome to the Vocare Calendar API documentation. Below you&#39;ll find a summary of all available endpoints, their usage, and links to the full OpenAPI docs.
        </p>
        <a
          href="/redoc.html"
          target="_blank"
          rel="noopener"
          className="text-blue-600 underline"
        >
          View Full OpenAPI Docs
        </a>
      </div>
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-2">Appointments</h2>
          <ul className="list-disc ml-6 text-gray-800">
            <li><code>GET /api/appointments</code> — List all appointments</li>
            <li><code>POST /api/appointments</code> — Create a new appointment</li>
            <li><code>GET /api/appointments/[id]</code> — Get details for a specific appointment</li>
            <li><code>PUT /api/appointments/[id]</code> — Update an appointment (full)</li>
            <li><code>PATCH /api/appointments/[id]</code> — Update an appointment (partial)</li>
            <li><code>DELETE /api/appointments/[id]</code> — Delete an appointment</li>
            <li><code>GET /api/appointments/search</code> — Search appointments</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Appointment Permissions</h2>
          <ul className="list-disc ml-6 text-gray-800">
            <li><code>GET /api/appointments/[id]/permissions</code> — Check appointment permissions for current user</li>
            <li><code>DELETE /api/appointments/[id]/permissions</code> — Discard appointment invitation</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Dashboard Permissions</h2>
          <ul className="list-disc ml-6 text-gray-800">
            <li><code>GET /api/dashboard/[id]/permissions</code> — Check dashboard permissions for current user</li>
            <li><code>DELETE /api/dashboard/[id]/permissions</code> — Discard dashboard invitation</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Invitations</h2>
          <ul className="list-disc ml-6 text-gray-800">
            <li><code>GET /api/invitations</code> — List all invitations for current user</li>
            <li><code>POST /api/invitations</code> — Send a new invitation</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Users</h2>
          <ul className="list-disc ml-6 text-gray-800">
            <li><code>GET /api/users/search</code> — Search users</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">OpenAPI & Docs</h2>
          <ul className="list-disc ml-6 text-gray-800">
            <li><code>GET /api/openapi</code> — OpenAPI JSON</li>
            <li><code>/api-docs</code> — This documentation page</li>
            <li><code>/redoc.html</code> — Full interactive API docs</li>
          </ul>
        </section>
      </div>
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Example Request</h2>
        <pre className="bg-gray-100 rounded p-4 text-sm overflow-x-auto">
          {`GET /api/appointments

Response:
{
  "appointments": [
    {
      "id": "a1b2c3d4",
      "title": "Doctor Appointment",
      "description": "Annual checkup with Dr. Smith",
      "start": "2025-08-12T09:00:00.000Z",
      "end": "2025-08-12T10:00:00.000Z",
      "location": "123 Main St, Clinic Room 2",
      "created_by": {
        "id": "user123",
        "name": "Alice Example",
        "email": "alice@example.com"
      },
      "assignees": [
        {
          "id": "user456",
          "name": "Bob Example",
          "email": "bob@example.com",
          "status": "accepted"
        }
      ],
      "status": "scheduled",
      "color": "#4F46E5",
      "created_at": "2025-08-01T12:00:00.000Z",
      "updated_at": "2025-08-10T15:30:00.000Z"
    }
  ]
}`}
        </pre>
      </div>
    </div>
  );
}