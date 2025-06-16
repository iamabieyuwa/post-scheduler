"use client";

import TextareaAutosize from "react-textarea-autosize";
import { useEffect } from "react";

export default function PostTextarea({
  value,
  onChange,
  maxLength = null,
  placeholder = "Write your post...",
}) {
  const length = value?.length || 0;
  const isOverLimit = maxLength && length >= maxLength;

  return (
    <div className="w-full">
      <TextareaAutosize
        value={value || ""}
        onChange={(e) => {
          if (!maxLength || e.target.value.length <= maxLength) {
            onChange(e);
          }
        }}
        minRows={4}
        placeholder={placeholder}
        className={`w-full p-3 text-white placeholder-gray-400 bg-transparent border ${
          isOverLimit ? "border-red-500" : "border-gray-600"
        } rounded-md resize-none focus:ring-2 ${
          isOverLimit ? "focus:ring-red-500" : "focus:ring-blue-500"
        } focus:outline-none`}
      />

      {maxLength && (
        <p
          className={`text-xs text-right mt-1 ${
            isOverLimit ? "text-red-400" : "text-gray-400"
          }`}
        >
          {length}/{maxLength}
        </p>
      )}
    </div>
  );
}
