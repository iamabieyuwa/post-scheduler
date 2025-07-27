"use client";
import React, { useRef, useState } from "react";

export default function DropZone({
  label = "📁 Import media",
  onDrop,
  accept = "image/*",
  multiple = false,
  showPreview = false,
  currentFile = null,
  max = 10,
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (!multiple) {
      onDrop(files[0]);
    } else {
      if (files.length > max) {
        alert(`You can only upload up to ${max} files.`);
        return;
      }
      onDrop(files);
    }
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    if (!multiple) {
      onDrop(files[0]);
    } else {
      if (files.length > max) {
        alert(`You can only upload up to ${max} files.`);
        return;
      }
      onDrop(files);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`w-full max-w-2xl border-2 border-dashed rounded-xl px-6 py-8 text-center transition-all
          ${isDragging ? "border-blue-400 bg-blue-500/10" : "border-blue-500 bg-transparent"}
          ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}
        `}
      >
        <p className="text-base text-blue-300 font-semibold">{label}</p>

        <input
          type="file"
          accept={accept}
          multiple={multiple}
          ref={fileInputRef}
          onChange={handleChange}
          className="hidden"
        />

        {showPreview && currentFile && (
          <div className="mt-4">
            <img
              src={URL.createObjectURL(currentFile)}
              alt="preview"
              className="mx-auto rounded-md h-28 object-cover shadow-md"
            />
          </div>
        )}
      </div>
    </div>
  );
}
