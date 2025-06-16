"use client";
import React from "react";

export default function PostPreview({ post, platform = "all" }) {
  if (!post) return null;

  const { content, postFormat, platforms } = post;
  const thread = postFormat?.thread || [];
  const carousel = postFormat?.carousel || [];

  return (
    <div className="w-full mt-10 space-y-10">
      <h3 className="text-white font-bold text-xl">🖼 Post Preview</h3>

      {/* Twitter Style */}
      {(platform === "all" || platform === "twitter") && platforms.includes("twitter") && (
        <div className="bg-[#15202b] text-white rounded-xl p-5 border border-gray-700 max-w-xl shadow-lg space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-500 rounded-full" />
            <div>
              <p className="font-bold">@yourhandle</p>
              <p className="text-xs text-gray-400">just now</p>
            </div>
          </div>

          {/* Thread content or single post */}
          {thread.length > 0 ? (
            <div className="space-y-6">
              {thread.map((item, idx) => (
                <div key={idx}>
                  <p className="text-sm leading-snug whitespace-pre-wrap">{item.text}</p>
                  {item.images?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {item.images.map((img, i) => (
                        <img
                          key={i}
                          src={URL.createObjectURL(img)}
                          alt={`thread-img-${idx}-${i}`}
                          className="rounded-md object-cover w-full h-28"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{content}</p>
            </>
          )}
        </div>
      )}

      {/* Instagram Style */}
      {(platform === "all" || platform === "instagram") && platforms.includes("instagram") && (
        <div className="bg-black text-white rounded-xl p-4 border border-gray-700 max-w-sm shadow-xl space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-yellow-400 rounded-full" />
            <div>
              <p className="font-semibold">yourusername</p>
              <p className="text-xs text-gray-500">now</p>
            </div>
          </div>

          {/* Carousel images */}
          {carousel?.length > 0 && (
            <div className="grid grid-cols-2 gap-2 rounded overflow-hidden">
              {carousel.map((img, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(img)}
                  alt={`carousel-${i}`}
                  className="rounded-md object-cover w-full h-32"
                />
              ))}
            </div>
          )}

          {/* Caption */}
          {content && (
            <p className="text-sm leading-tight whitespace-pre-wrap text-gray-200">
              {content}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
