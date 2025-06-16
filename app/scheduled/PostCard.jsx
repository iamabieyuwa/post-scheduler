"use client";

import React from "react";
export default function PostCard({ post, onEdit, onDelete, isDeleting }) {
  const { content, platforms, media, scheduledAt, postNow, postFormat } = post;
  const thread = postFormat?.thread || [];
  const carousel = postFormat?.carousel || [];
  

  return (
    <div
    className={`bg-[#111] border border-gray-800 rounded-lg p-5 text-white space-y-3 transition-all duration-500 ${
      isDeleting ? "opacity-0 scale-95 blur-sm" : ""
    }`}
  >
      {/* Time */}
      <p className="text-sm text-gray-400 font-semibold">
        {postNow ? "Posting now" : `Scheduled for: ${new Date(scheduledAt).toLocaleString()}`}
      </p>

      {/* Content */}
      {content && <p className="text-base text-white">{content}</p>}

      {/* Platforms */}
      <div className="text-sm text-gray-400">
        Platforms:{" "}
        {platforms.map((p) => (
          <span key={p} className="mr-2 capitalize">
            {p}
          </span>
        ))}
      </div>

      {/* 🧵 Thread View */}
      {thread.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-blue-400 font-semibold">Thread:</p>
          {thread.map((block, i) => (
            <div key={i} className="bg-gray-900/60 p-3 rounded-md space-y-2">
              {block.text && <p className="text-sm text-white">{block.text}</p>}
              {block.images?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {block.images.map((img, j) => (
                    <img
                      key={j}
                      src={img.url}
                      alt={`thread-img-${j}`}
                      className="w-full h-24 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 🎠 Carousel View */}
      {carousel.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-pink-400 font-semibold">Carousel:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {carousel.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={`carousel-img-${i}`}
                className="w-full h-24 object-cover rounded bg-gray-800 p-1"
              />
            ))}
          </div>
        </div>
      )}

      {/* 🎞️ Fallback Media */}
      {media?.length > 0 && thread.length === 0 && carousel.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {media.map((file, i) => {
            const isImage = file.type.startsWith("image/");
            const isVideo = file.type.startsWith("video/");
            const isAudio = file.type.startsWith("audio/");

            return (
              <div key={i} className="rounded overflow-hidden bg-gray-800 p-1">
                {isImage && (
                  <img src={file.url} alt="media" className="w-full h-24 object-cover rounded" />
                )}
                {isVideo && (
                  <video controls className="w-full h-24 object-cover rounded">
                    <source src={file.url} type={file.type} />
                  </video>
                )}
                {isAudio && (
                  <audio controls className="w-full">
                    <source src={file.url} type={file.type} />
                  </audio>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-3">
        <button
          onClick={() => onEdit(post)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1 rounded"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1 rounded"
        >
          {isDeleting ? "💣" : "Delete"}
        </button>
      </div>
    </div>
  );
}
