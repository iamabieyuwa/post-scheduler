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
        alert(`You can only upload up to ${max} images.`);
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
        alert(`You can only upload up to ${max} images.`);
        return;
      }
      onDrop(files);
    }
  };

  return (
    <div
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed ${
        isDragging ? "border-blue-400 bg-blue-500/10" : "border-blue-500"
      } rounded-lg p-4 text-center text-sm text-blue-300 cursor-pointer transition ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
      />

      {showPreview && currentFile && (
        <div className="mt-3">
          <img
            src={URL.createObjectURL(currentFile)}
            alt="preview"
            className="mx-auto rounded h-24 object-cover"
          />
        </div>
      )}
    </div>
  );
}
