"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FiSearch } from "react-icons/fi";

interface SearchBarProps {
  value: string;
  setValue: (val: string) => void;
}

export default function SearchBar({ value, setValue }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 w-full max-w-md">
      <div className="relative w-full">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <FiSearch className="w-5 h-5" />
        </span>
        <Input
          type="text"
          placeholder="Suchen... (Name, Titel, Notiz ...)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition w-full bg-white"
        />
      </div>
    </div>
  );
}
