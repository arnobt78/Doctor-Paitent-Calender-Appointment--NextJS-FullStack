"use client";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <span className="text-lg font-semibold text-gray-700">Still on Process...</span>
      </div>
    </div>
  );
}
