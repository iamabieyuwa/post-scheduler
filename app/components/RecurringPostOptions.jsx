"use client";

import { useState } from "react";

export default function RecurringPostOptions({ value, onChange }) {
  const [enabled, setEnabled] = useState(value.enabled || false);

  const handleChange = (key, val) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="w-full mt-6 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-gray-700/50 rounded-2xl p-5 shadow-xl">
      <label className="flex items-center gap-3 text-white text-sm font-semibold mb-4">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            handleChange("enabled", e.target.checked);
          }}
          className="w-5 h-5 accent-blue-500 rounded transition duration-200"
        />
        Enable recurring post
      </label>

      {enabled && (
        <div className="space-y-6">
          {/* Frequency Dropdown */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Repeat Frequency
            </label>
            <select
              value={value.frequency || ""}
              onChange={(e) => handleChange("frequency", e.target.value)}
              className="w-full bg-[#1e293b] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="bg-[#1e293b] text-white">
                Select frequency
              </option>
              <option value="daily" className="bg-[#1e293b] text-white">
                Daily
              </option>
              <option value="weekly" className="bg-[#1e293b] text-white">
                Weekly
              </option>
              <option value="monthly" className="bg-[#1e293b] text-white">
                Monthly
              </option>
            </select>
          </div>

          {/* End Condition: Repeat Count or Until Date */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              End Condition
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-2">
              <input
                type="number"
                placeholder="e.g. 5 times"
                value={value.repeatCount || ""}
                onChange={(e) =>
                  handleChange(
                    "repeatCount",
                    e.target.value ? parseInt(e.target.value) : ""
                  )
                }
                className="flex-1 bg-[#1e293b] text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm text-center">or</span>
              <input
                type="date"
                value={value.untilDate || ""}
                onChange={(e) => handleChange("untilDate", e.target.value)}
                className="flex-1 bg-[#1e293b] text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
