"use client";

import TextareaAutosize from "react-textarea-autosize";
import { useEffect } from "react";

export default function PostTextarea({ value, onChange }) {
  return (
    <div className="w-full">
      <TextareaAutosize
        value={value}
        onChange={onChange}
        minRows={4}
        placeholder="Write your post..."
        className="w-full p-3 text-white placeholder-gray-400 bg-transparent border border-gray-600 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}
