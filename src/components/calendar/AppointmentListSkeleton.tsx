import React from "react";

export default function AppointmentListSkeleton() {
  return (
    <div className="p-6 sm:p-8 space-y-6 bg-[#f5f5f6] min-h-[calc(100vh-80px)] animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="relative border rounded-xl shadow bg-white p-0 flex items-stretch min-h-[110px]"
          >
            <div className="w-2 rounded-l-xl h-full absolute left-0 top-0 bottom-0 bg-gray-200" />
            <div className="pl-6 pr-2 py-4 flex-1 flex flex-col justify-center min-h-[110px]">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
              <div className="flex flex-col gap-1 mb-1">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-40 bg-gray-100 rounded mb-1" />
              <div className="h-4 w-28 bg-gray-100 rounded mb-1" />
              <div className="h-4 w-32 bg-gray-100 rounded mb-1" />
            </div>
            <div className="flex flex-col items-center gap-3 min-w-[56px] py-4 px-2 justify-center">
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
              <div className="h-8 w-8 bg-gray-100 rounded-full" />
              <div className="h-8 w-8 bg-gray-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
