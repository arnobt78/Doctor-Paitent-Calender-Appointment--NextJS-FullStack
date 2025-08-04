"use client";
import { useEffect, useState } from "react";

function formatDate(date: Date) {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const endpoints = [
  { name: "Appointments API", url: "/api/appointments" },
  { name: "OpenAPI Docs", url: "/api/openapi" },
];

export default function ApiStatusPage() {
  const [apiStatus, setApiStatus] = useState<"ok" | "error" | "loading">("loading");
  const [apiMessage, setApiMessage] = useState("");
  const [serverTime, setServerTime] = useState(new Date());
  const [uptime, setUptime] = useState(0);
  const [endpointStatuses, setEndpointStatuses] = useState<{ name: string; url: string; status: string; message: string }[]>([]);

  // Simulate uptime (since client loaded)
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch API health and other endpoints
  useEffect(() => {
    setApiStatus("loading");
    fetch("/api/appointments")
      .then(async (res) => {
        if (res.ok) {
          setApiStatus("ok");
          setApiMessage("API is healthy.");
        } else {
          const data = await res.json();
          setApiStatus("error");
          setApiMessage(data.message || "API error");
        }
      })
      .catch(() => {
        setApiStatus("error");
        setApiMessage("Could not reach API.");
      });

    Promise.all(
      endpoints.map(async (ep) => {
        try {
          const res = await fetch(ep.url);
          if (res.ok) {
            return { ...ep, status: "ok", message: "OK" };
          } else {
            const data = await res.json().catch(() => ({}));
            return { ...ep, status: "error", message: data.message || res.statusText };
          }
        } catch {
          return { ...ep, status: "error", message: "Unreachable" };
        }
      })
    ).then(setEndpointStatuses);
  }, []);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Build info (from env or Vercel)
  const buildInfo = {
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL_URL || null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    branch: process.env.VERCEL_GIT_COMMIT_REF || null,
    repo: process.env.VERCEL_GIT_REPO_SLUG || null,
    buildTime: process.env.BUILD_TIME || null,
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">API & Project Status</h1>
      <div className="mb-4">
        <div className="text-lg font-semibold">Project:</div>
        <div className="text-gray-700">Vocare Calendar</div>
      </div>
      <div className="mb-4">
        <div className="text-lg font-semibold">Environment:</div>
        <div className="text-gray-700">{buildInfo.env}</div>
      </div>
      <div className="mb-4">
        <div className="text-lg font-semibold">Current Time:</div>
        <div className="text-gray-700">{formatDate(serverTime)}</div>
      </div>
      <div className="mb-4">
        <div className="text-lg font-semibold">Uptime:</div>
        <div className="text-gray-700">{uptime}s</div>
      </div>
      <div className="mb-4">
        <div className="text-lg font-semibold">API Health:</div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              apiStatus === "ok"
                ? "bg-green-500"
                : apiStatus === "loading"
                ? "bg-yellow-400"
                : "bg-red-500"
            }`}
          ></span>
          <span className="text-gray-700">{apiStatus === "loading" ? "Checking..." : apiMessage}</span>
        </div>
      </div>
      <div className="mb-4">
        <div className="text-lg font-semibold">Endpoints:</div>
        <ul className="text-gray-700">
          {endpointStatuses.map((ep) => (
            <li key={ep.url} className="flex items-center gap-2 mb-1">
              <span className={`inline-block w-2 h-2 rounded-full ${ep.status === "ok" ? "bg-green-500" : "bg-red-500"}`}></span>
              <span className="font-mono">{ep.name}</span>
              <span className="text-xs text-gray-500">({ep.url})</span>
              <span className="text-xs ml-2">{ep.message}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <div className="text-lg font-semibold">Deployment:</div>
        <div className="text-gray-700">
          {buildInfo.vercel ? `Vercel (${buildInfo.vercel})` : "Local / Custom"}
        </div>
        {buildInfo.commit && (
          <div className="text-xs text-gray-500 mt-1">
            Commit: <span className="font-mono">{buildInfo.commit}</span>
            {buildInfo.branch && <> on <span className="font-mono">{buildInfo.branch}</span></>}
            {buildInfo.repo && <> ({buildInfo.repo})</>}
          </div>
        )}
        {buildInfo.buildTime && (
          <div className="text-xs text-gray-500 mt-1">Build Time: {buildInfo.buildTime}</div>
        )}
      </div>
      <div className="text-xs text-gray-400 mt-8">
        Last checked: {formatDate(serverTime)}
      </div>
    </div>
  );
}
