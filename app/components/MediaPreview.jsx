"use client";
import React, { useState } from "react";

export default function MediaPreview({ files, onRemove }) {
  const [activeFile, setActiveFile] = useState(null);

  if (!files || files.length === 0) return null;

  const closeModal = () => setActiveFile(null);

  return (
    <>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {files.map((file, index) => {
          const isCloudinary = typeof file.url === "string";
          const type = isCloudinary ? file.type : file.type;
          const url = isCloudinary
            ? file.url
            : URL.createObjectURL(file);

          const isImage = type.startsWith("image/");
          const isAudio = type.startsWith("audio/");
          const isVideo = type.startsWith("video/");

          return (
            <div
              key={index}
              className="relative rounded-md overflow-hidden border border-gray-600 bg-gray-800 p-2 text-white shadow-sm"
            >
              {isImage && (
                <img
                  src={url}
                  alt={`Preview ${index}`}
                  className="w-full h-32 object-cover rounded cursor-pointer"
                  onClick={() => setActiveFile({ url, type })}
                />
              )}

              {isAudio && (
                <div
                  className="cursor-pointer"
                  onClick={() => setActiveFile({ url, type })}
                >
                  <audio controls className="w-full mt-2 pointer-events-none">
                    <source src={url} type={type} />
                  </audio>
                </div>
              )}

              {isVideo && (
                <video
                  className="w-full h-32 object-cover rounded cursor-pointer"
                  onClick={() => setActiveFile({ url, type })}
                >
                  <source src={url} type={type} />
                </video>
              )}

              <p className="text-xs text-gray-300 mt-2 truncate">
                <span className="font-medium">Type:</span> {type} <br />
                <span className="font-medium">Size:</span>{" "}
                {file.size
                  ? (file.size / 1024).toFixed(1) + " KB"
                  : "Uploaded"}
              </p>

              {onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  type="button"
                  className="absolute top-1 right-1 text-xs bg-black text-white px-2 py-1 rounded-full hover:bg-black hover:cursor-pointer transition"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {activeFile && (
        <div
          onClick={closeModal}
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
        >
          <div
            className="relative max-w-4xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 bg-white text-black px-3 py-1 text-sm rounded hover:bg-gray-200"
            >
              ✕
            </button>

            {activeFile.type.startsWith("image/") && (
              <img
                src={activeFile.url}
                alt="Full Preview"
                className="rounded max-h-[80vh] w-auto mx-auto"
              />
            )}

            {activeFile.type.startsWith("audio/") && (
              <audio
                controls
                autoPlay
                className="w-full mt-4"
                src={activeFile.url}
              />
            )}

            {activeFile.type.startsWith("video/") && (
              <video
                controls
                autoPlay
                className="w-full max-h-[80vh] mx-auto rounded"
              >
                <source src={activeFile.url} type={activeFile.type} />
              </video>
            )}
          </div>
        </div>
      )}
    </>
  );
}
