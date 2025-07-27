"use client";
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaClock } from "react-icons/fa";

export default function DateTimeInput({
  label = "Schedule Post",
  value,
  onChange,
  autoSetNowIfEmpty = true,
  disabled = false,
}) {
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value) : null
  );

  useEffect(() => {
    if (autoSetNowIfEmpty && !value) {
      const now = new Date();
      setSelectedDate(now);
      onChange(now.toISOString());
    }
  }, [value, autoSetNowIfEmpty, onChange]);

  const handleChange = (date) => {
    setSelectedDate(date);
    if (date) {
      onChange(date.toISOString());
    }
  };

  const handleNow = () => {
    const now = new Date();
    setSelectedDate(now);
    onChange(now.toISOString());
  };

  return (
    <div className="w-full text-white">
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label}
      </label>
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <DatePicker
            selected={selectedDate}
            onChange={handleChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="yyyy-MM-dd h:mm aa"
            className={`w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          onClick={handleNow}
          disabled={disabled}
          title="Set current time"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition disabled:opacity-40"
        >
          <FaClock />
        </button>
      </div>
    </div>
  );
}
