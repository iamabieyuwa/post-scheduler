"use client";

import { useState, useRef } from "react";
import MediaPreview from "./MediaPreview";
import PostTextarea from "./PostTextarea";
import toast from "react-hot-toast";
import EmojiPickerBox from "./EmojiPickerBox";
import RecurringPostOptions from "./RecurringPostOptions";
import PostNowToggle from "./PostNowToggle";
import PostVariants from "./PostVariants";


export default function PostForm({ onAdd }) {
  const [form, setForm] = useState({
    content: "",
    platforms: [],
    images: [],
    scheduledAt: "",

    recurring: {
      enabled: false,
      frequency: "",
      repeatCount: "",
      untilDate: "",
    },
    variants: {
      enabled: false,
      variants: [], // string[]
    },

    postNow: false,
  });
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setError("");
  
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        platforms: checked
          ? [...prev.platforms, value.toLowerCase()]
          : prev.platforms.filter((p) => p !== value.toLowerCase()),
      }));
    } else if (type === "file") {
      const selectedFiles = Array.from(files);
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...selectedFiles], 
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  

  const getPlainText = (html) => {
    if (typeof window === "undefined") return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const getCharLimit = (platforms) => {
    if (platforms.includes("twitter")) return 280;
    if (platforms.includes("instagram")) return 2200;
    return 0;
  };

  const plainText = getPlainText(form.content);
  const charLimit = getCharLimit(form.platforms);
  const contentLength = plainText.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const { content, platforms, images, scheduledAt } = form;

    if (!content || !platforms.length || !scheduledAt) {
      return setError("Please fill in all required fields.");
    }

    if (platforms.includes("instagram") && images.length === 0) {
      return setError("Instagram posts require at least one image.");
    }

    if (charLimit && contentLength > charLimit) {
      return setError(`Post exceeds the character limit of ${charLimit}.`);
    }

    const newPost = {
      id: Date.now(),
      ...form,
    };

    onAdd(newPost);
    setForm({ content: "", platforms: [], images: [], scheduledAt: "" });
    toast.success("Post scheduled successfully!");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-7 max-w-2xl w-full bg-white/5 backdrop-blur-md p-8 shadow-xl rounded-2xl border border-white/10"
    >
      <div className="w-full">
        <label className="block text-base font-semibold text-gray-200 mb-3">Post to:</label>
        <div className="flex gap-6">
          {["twitter", "instagram"].map((platform) => (
            <label
              key={platform}
              className="flex items-center gap-3 text-lg cursor-pointer"
            >
              <input
                type="checkbox"
                name="platforms"
                value={platform}
                checked={form.platforms.includes(platform)}
                onChange={handleChange}
                className="peer hidden"
              />
              <div className="w-5 h-5 rounded-sm border-2 border-gray-400 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div>
              <span className="capitalize select-none">{platform}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-200 mb-2">Post Content:</label>
        <PostTextarea
  value={form.content}
  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
/>
<EmojiPickerBox
  onSelect={(emoji) =>
    setForm((prev) => ({
      ...prev,
      content: prev.content + emoji,
    }))
  }
/>

        {charLimit > 0 && (
          <p
            className={`text-xs mt-1 text-right ${
              contentLength > charLimit ? "text-red-500" : "text-gray-300"
            }`}
          >
            {contentLength} / {charLimit}
          </p>
        )}
      </div>

      <div className="w-full">
        <input
          id="media-upload"
          type="file"
          accept="image/*,audio/mpeg,video/mp4,video/webm"
          multiple
          onChange={handleChange}
          ref={fileInputRef}
          className="hidden"
        />
        <label
          htmlFor="media-upload"
          className="cursor-pointer block w-full text-center border-2 border-dashed border-gray-300 text-gray-200 py-6 rounded-lg hover:border-blue-500 hover:text-blue-400 transition"
        >
          📁 Import Media (PNG, MP3, MP4...)
        </label>
      </div>

      <MediaPreview
  files={form.images}
  onRemove={(index) => {
    const updated = [...form.images];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, images: updated }));
  }}
/>



      <div className="w-full">
        <label className="block text-sm font-medium text-gray-200 mb-2">Schedule:</label>
        <input
  type="datetime-local"
  name="scheduledAt"
  value={form.scheduledAt}
  onChange={handleChange}
  disabled={form.postNow}
  className={`w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-white ${
    form.postNow ? "opacity-50 cursor-not-allowed"  : ""
  }`}
/>

      </div>
      <PostVariants
      value={form.variants}
      onChange={(newVal) =>
        setForm((prev) => ({ ...prev, variants: newVal }))
      }
    />
    
      <RecurringPostOptions
  value={form.recurring}
  onChange={(newVal) =>
    setForm((prev) => ({ ...prev, recurring: newVal }))
  }
/>


      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
<PostNowToggle
  checked={form.postNow}
  onChange={(val) =>
    setForm((prev) => ({ ...prev, postNow: val }))
  }
/>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition-all"
      >
        Schedule Post
      </button>
    </form>
  );
}
