"use client";
import React, { useState } from "react";
import AppointmentAccessPermission from "@/components/control-panel/AppointmentAccessPermission";
import UserAccessPermission from "@/components/control-panel/UserAccessPermission";
import InvitationList from "@/components/control-panel/InvitationList";

const tabs = [
  { key: "appointment", label: "Appointment Access Invitation" },
  { key: "dashboard", label: "User Dashboard Access Invitation" },
];

export default function ControlPanelPage() {
  const [activeTab, setActiveTab] = useState("appointment");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`bg-white border-r transition-all duration-200 ${sidebarOpen ? "w-64" : "w-16"} flex flex-col`}>
        <button
          className="p-2 m-2 rounded hover:bg-gray-100 self-end"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? "⏴" : "⏵"}
        </button>
        <nav className="flex-1 flex flex-col gap-2 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`text-left px-4 py-2 rounded font-semibold transition-colors ${activeTab === tab.key ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        {activeTab === "appointment" && (
          <>
            <AppointmentAccessPermission />
            <InvitationList type="appointment" />
          </>
        )}
        {activeTab === "dashboard" && (
          <>
            <UserAccessPermission />
            <InvitationList type="dashboard" />
          </>
        )}
      </main>
    </div>
  );
}
