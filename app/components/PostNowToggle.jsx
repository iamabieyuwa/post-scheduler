"use client";
import React from "react";

export default function PostNowToggle({ checked, onChange }) {
  return (
    <div className="w-full mt-6 flex items-center justify-between bg-gray-900 border border-gray-700 rounded-xl px-4 py-3">
      <label className="text-white font-medium text-sm">
        Post Immediately
      </label>
      <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
        <input
          type="checkbox"
          name="postNow"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 checked:translate-x-full"
        />
        <div className="block overflow-hidden h-6 rounded-full bg-gray-600"></div>
      </div>
    </div>
  );
}
