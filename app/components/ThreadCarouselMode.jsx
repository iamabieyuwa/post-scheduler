"use client";
import { useState } from "react";
import PostTextarea from "./PostTextarea";
import DropZone from "./DropZone";

export default function ThreadCarouselMode({ value, onChange }) {
  const {
    thread = [{ text: "", images: [] }],
    carousel = [],
  } = value || {};

  const [threadEnabled, setThreadEnabled] = useState(!!thread.length);
  const [carouselEnabled, setCarouselEnabled] = useState(!!carousel.length);

  const update = (key, val) => {
    onChange({ ...value, [key]: val });
  };

  // === THREAD ===
  const addThreadItem = () => {
    update("thread", [...thread, { text: "", images: [] }]);
  };

  const removeThreadItem = (index) => {
    const updated = thread.filter((_, i) => i !== index);
    update("thread", updated);
  };

  const handleThreadTextChange = (index, text) => {
    const updated = [...thread];
    updated[index].text = text;
    update("thread", updated);
  };

  const handleThreadImageChange = (index, files) => {
    const updated = [...thread];
    const prev = updated[index].images || [];
    const incoming = Array.isArray(files) ? files : [files];
    updated[index].images = [...prev, ...incoming].slice(0, 4); // max 4 images
    update("thread", updated);
  };

  const removeThreadImage = (tIndex, iIndex) => {
    const updated = [...thread];
    updated[tIndex].images.splice(iIndex, 1);
    update("thread", updated);
  };

  // === CAROUSEL ===
  const handleCarouselUpload = (files) => {
    const newFiles = Array.isArray(files) ? files : [files];
    const limited = newFiles.slice(0, 10 - carousel.length);
    update("carousel", [...carousel, ...limited]);
  };

  const removeCarouselImage = (index) => {
    update("carousel", carousel.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full mt-6 bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg text-white">
      <label className="block font-semibold text-sm mb-2">
        Post Formats (Select one or both)
      </label>

      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={threadEnabled}
            onChange={(e) => {
              const checked = e.target.checked;
              setThreadEnabled(checked);
              update("thread", checked ? [{ text: "", images: [] }] : []);
            }}
            className="accent-blue-500"
          />
          🧵 Thread
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={carouselEnabled}
            onChange={(e) => {
              const checked = e.target.checked;
              setCarouselEnabled(checked);
              update("carousel", checked ? [] : []);
            }}
            className="accent-blue-500"
          />
          🖼 Carousel
        </label>
      </div>

      {/* THREAD MODE */}
      {threadEnabled && (
        <div className="space-y-4">
          {thread.map((block, index) => (
            <div key={index} className="border border-gray-700 rounded p-3 space-y-2 relative">
              <PostTextarea
                value={block.text}
                onChange={(e) => handleThreadTextChange(index, e.target.value)}
                maxLength={280}
                placeholder={`Thread block ${index + 1}`}
              />

              <DropZone
                label="📎 Drag & drop or click to upload (max 4)"
                onDrop={(files) => handleThreadImageChange(index, files)}
                multiple={true}
                max={4}
              />

              {block.images?.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {block.images.map((img, imgIndex) => (
                    <div key={imgIndex} className="relative group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`thread-${index}-${imgIndex}`}
                        className="rounded w-full h-24 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeThreadImage(index, imgIndex)}
                        className="absolute top-1 right-1 text-white text-xs bg-red-600 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {thread.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeThreadItem(index)}
                  className="absolute top-2 right-2 text-red-500 text-xs hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {thread.length < 10 && (
            <button
              type="button"
              onClick={addThreadItem}
              className="text-blue-400 text-sm mt-1 hover:text-blue-500"
            >
              ➕ Add another thread block
            </button>
          )}
        </div>
      )}

      {/* CAROUSEL MODE */}
      {carouselEnabled && (
        <div className="space-y-4 mt-6">
          <DropZone
            label="🖼 Drag & drop or click to upload carousel images"
            onDrop={handleCarouselUpload}
            multiple={true}
            max={10}
            disabled={carousel.length >= 10}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {carousel.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`carousel-${index}`}
                  className="rounded w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeCarouselImage(index)}
                  className="absolute top-1 right-1 text-white text-xs bg-red-600 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
