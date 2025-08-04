"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ApiDocsPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">API Documentation</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
      <div style={{ border: "1px solid #ddd", borderRadius: 8, background: "#fff", padding: 0 }}>
        <iframe
          src="/redoc.html"
          width="100%"
          height="900"
          style={{ border: "none", borderRadius: 8, background: "#fff" }}
          title="Vocare API Docs"
        />
      </div>
    </div>
  );
}