"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {useCountdown} from "../lib/useCountdown"
export default function PostCard({ post, onEdit, onDelete, onDuplicate, isDeleting }) {
  const router = useRouter();
  const { content, platforms = [], media = [], scheduledAt, postNow, postFormat = {} } = post;
  const thread = postFormat.thread || [];
  const carousel = postFormat.carousel || [];

  const isImage = (type = "") => type.startsWith("image/");
  const isVideo = (type = "") => type.startsWith("video/");
  const isAudio = (type = "") => type.startsWith("audio/");
const countdown = useCountdown(scheduledAt);
  return (
    <div
      className={`bg-[#111] border border-gray-800 rounded-xl p-5 text-white space-y-5 transition-all duration-500 ${
        isDeleting ? "opacity-0 scale-95 blur-sm" : ""
      }`}
    >
      {/* Timestamp */}
      <div className="text-sm text-gray-400 font-medium">
        {postNow
          ? "🚀 Posting now"
          : scheduledAt
          ? `📅 Scheduled: ${new Date(scheduledAt).toLocaleString()}`
          : "⏳ No scheduled time"}
      </div>

      {!postNow && scheduledAt && (
  <p className="text-xs text-green-400 font-medium">
    {countdown}
  </p>
)}



      {/* Content */}
      {content && (
        <div className="whitespace-pre-wrap text-base leading-relaxed text-white">
          {content}
        </div>
      )}

      {/* 🧵 Thread Section */}
      {thread.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-blue-400">🧵 Thread:</p>
          {thread.map((block, i) => (
            <div
              key={i}
              className="bg-gray-900/60 p-3 rounded-lg space-y-2 border border-gray-700"
            >
              {block.text && <p className="text-sm text-white">{block.text}</p>}
              {block.images?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {block.images.map((img, j) => (
                    <img
                      key={j}
                      src={img.url}
                      alt={`thread-img-${j}`}
                      className="w-full max-h-48 object-contain rounded bg-white"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 🎠 Carousel */}
      {carousel.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-pink-400 font-semibold">🎠 Carousel:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {carousel.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={`carousel-img-${i}`}
                className="w-full max-h-48 object-contain rounded bg-white p-1"
              />
            ))}
          </div>
        </div>
      )}

      {/* 🎧🎞️ Fallback Media */}
      {media.length > 0 && thread.length === 0 && carousel.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm text-yellow-400 font-semibold">📎 Attached Media:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {media.map((file, i) => {
              return (
                <div key={i} className="rounded overflow-hidden bg-gray-800 p-1">
                  {isImage(file.type) && (
                    <img
                      src={file.url}
                      alt="media"
                      className="w-full max-h-48 object-contain rounded bg-white"
                    />
                  )}
                  {isVideo(file.type) && (
                    <video
                      controls
                      className="w-full max-h-40 object-contain rounded bg-black"
                    >
                      <source src={file.url} type={file.type} />
                    </video>
                  )}
                  {isAudio(file.type) && (
                    <audio controls className="w-full">
                      <source src={file.url} type={file.type} />
                    </audio>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2 flex-wrap">
        <button
          onClick={() => router.push(`/edit/${post.id}`)}
          className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-1 rounded"
        >
          ✏️ Edit
        </button>

        {onDuplicate && (
          <button
            onClick={onDuplicate}
            className="bg-purple-700 hover:bg-purple-800 text-sm px-4 py-1 rounded"
          >
            🔁 Post Again
          </button>
        )}

        <button
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-sm px-4 py-1 rounded"
        >
          {isDeleting ? "💣 Deleting..." : "🗑 Delete"}
        </button>
      </div>
    </div>
  );
}
