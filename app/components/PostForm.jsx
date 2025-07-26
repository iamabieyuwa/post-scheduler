"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import MediaPreview from "./MediaPreview";
import PostTextarea from "./PostTextarea";
import toast from "react-hot-toast";
import EmojiPickerBox from "./EmojiPickerBox";
import RecurringPostOptions from "./RecurringPostOptions";
import PostNowToggle from "./PostNowToggle";
import PostVariants from "./PostVariants";
import ThreadCarouselMode from "./ThreadCarouselMode";
import { getInitialFormState } from '../utils/getInitialFormState';
import PostPreview from "./PostPreview";
import { FaSpinner } from "react-icons/fa";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function PostForm({ onAdd, onSave, isEdit = false, initialData = null }) {
  const [form, setForm] = useState(initialData || getInitialFormState());
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activePreview, setActivePreview] = useState("all");
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Media states for editing
  const [existingMedia, setExistingMedia] = useState(initialData?.media || []);
  const [existingCarousel, setExistingCarousel] = useState(initialData?.postFormat?.carousel || []);

  // New uploads
  const [newMedia, setNewMedia] = useState([]);
  const [newCarousel, setNewCarousel] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && pathname === "/dashboard") {
        router.push("/");
      } else {
        setUser(user);
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [router, pathname]);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setExistingMedia(initialData.media || []);
      setExistingCarousel(initialData.postFormat?.carousel || []);
      setNewMedia([]);
      setNewCarousel([]);
    }
  }, [initialData]);

  if (checkingAuth) return <div className="flex justify-center items-center align-center mt-20">
            <FaSpinner className="animate-spin text-white text-2xl" />
          </div>;

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
      if (name === "media") {
        setNewMedia([...newMedia, ...Array.from(files)]);
      } else if (name === "carousel") {
        setNewCarousel([...newCarousel, ...Array.from(files)]);
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Removal handlers
  const removeExistingMedia = (i) => setExistingMedia(existingMedia.filter((_, idx) => idx !== i));
  const removeNewMedia = (i) => setNewMedia(newMedia.filter((_, idx) => idx !== i));
  const removeExistingCarousel = (i) => setExistingCarousel(existingCarousel.filter((_, idx) => idx !== i));
  const removeNewCarousel = (i) => setNewCarousel(newCarousel.filter((_, idx) => idx !== i));

  // Char limit helpers
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

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { content, platforms, scheduledAt, postNow, variants, recurring, postFormat } = form;
    let finalContent = content;

    // Variants
    if (variants?.enabled && variants.variants.length > 0) {
      const options = variants.variants.filter((v) => v.trim() !== "");
      if (options.length > 0) {
        const randomIndex = Math.floor(Math.random() * options.length);
        finalContent = options[randomIndex];
      }
    }

    // Thread + carousel
    const thread = postFormat?.thread || [];
    const carousel = postFormat?.carousel || [];
    const threadEnabled = thread.length > 0;
    const carouselEnabled = carousel.length > 0;

    // Validation
    if (!finalContent && !threadEnabled && !carouselEnabled) {
      return setError("Add content, a thread, or a carousel to post.");
    }
    const invalidThread =
      threadEnabled &&
      thread.some((t) => !t.text.trim() && (!t.images || !t.images.length));
    if (invalidThread) {
      return setError("Each thread block must have text or image.");
    }
    if (existingCarousel.length + newCarousel.length > 10) {
      return setError("You can only upload up to 10 images for carousel.");
    }
    if (!platforms.length) {
      return setError("Select at least one platform.");
    }
    if (!postNow && !scheduledAt) {
      return setError("Please select a date and time.");
    }

    try {
      // Main Media
      const uploadedMedia = await Promise.all(
        (newMedia || []).map(async (file) => {
          const url = await uploadToCloudinary(file);
          return { url, type: file.type, name: file.name, size: file.size };
        })
      );
      // Carousel
      const uploadedCarousel = await Promise.all(
        (newCarousel || []).map(async (file) => {
          const url = await uploadToCloudinary(file);
          return { url, type: file.type, name: file.name, size: file.size };
        })
      );

      const newPost = {
        content: finalContent,
        platforms,
        media: [...existingMedia, ...uploadedMedia],
        scheduledAt: postNow ? new Date().toISOString() : scheduledAt,
        postNow,
        recurring,
        variantUsed: finalContent !== content ? finalContent : null,
        postFormat: {
          ...postFormat,
          carousel: [...existingCarousel, ...uploadedCarousel],
        },
        userId: user.uid,
      };

      const cleanedPost = JSON.parse(JSON.stringify(newPost));
      if (isEdit && onSave) {
        await onSave(newPost);
        return;
      }
      const docRef = await addDoc(collection(db, "posts"), {
        ...cleanedPost,
        createdAt: serverTimestamp(),
      });
      if (onAdd) onAdd({ ...cleanedPost, id: docRef.id });
      toast.success("✅ Post saved to Firestore!");
      setForm(getInitialFormState());
      setExistingMedia([]);
      setExistingCarousel([]);
      setNewMedia([]);
      setNewCarousel([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setError("");
    } catch (err) {
      console.error("❌ Failed to save post:", err);
      toast.error("Could not save post to database.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-7 max-w-2xl w-full bg-white/5 backdrop-blur-md p-8 shadow-xl rounded-2xl border border-white/10"
    >
      {/* Platforms */}
      <div className="w-full">
        <label className="block text-base font-semibold text-gray-200 mb-3">Post to:</label>
        <div className="flex gap-6">
          {["twitter", "instagram"].map((platform) => (
            <label key={platform} className="flex items-center gap-3 text-lg cursor-pointer">
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
      {/* Post Content */}
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

      {/* Thread & Carousel UI */}
      <ThreadCarouselMode
        value={form.postFormat}
        onChange={(val) => setForm((prev) => ({ ...prev, postFormat: val }))}
      />

      {/* === Main Media Preview === */}
      {(existingMedia.length > 0 || newMedia.length > 0) && (
        <div className="w-full mb-2">
          <label className="block text-xs text-gray-300 mb-2">Main Media</label>
          <div className="flex flex-wrap gap-2">
            {existingMedia.map((file, i) => (
              <div key={`em-${i}`} className="relative group">
                {file.type?.startsWith("image/") ? (
                  <img src={file.url} alt={file.name || "media"} className="w-24 h-24 object-cover rounded" />
                ) : file.type?.startsWith("video/") ? (
                  <video src={file.url} controls className="w-24 h-24 object-cover rounded" />
                ) : file.type?.startsWith("audio/") ? (
                  <audio src={file.url} controls className="w-24" />
                ) : null}
                <button type="button"
                  onClick={() => removeExistingMedia(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 text-xs opacity-70 hover:opacity-100"
                  title="Remove"
                >×</button>
              </div>
            ))}
            {newMedia.map((file, i) => (
              <div key={`nm-${i}`} className="relative group">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-24 h-24 object-cover rounded" />
                <button type="button"
                  onClick={() => removeNewMedia(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 text-xs opacity-70 hover:opacity-100"
                  title="Remove"
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Media input: ALWAYS VISIBLE */}
      <div className="w-full mb-4">
        <input
          id="media-upload"
          name="media"
          type="file"
          accept="image/*,audio/mpeg,video/mp4,video/webm"
          multiple
          onChange={handleChange}
          ref={fileInputRef}
          className="hidden"
        />
        <label
          htmlFor="media-upload"
          className="cursor-pointer block w-full text-center border-2 border-dashed border-gray-300 text-gray-200 py-3 rounded-lg hover:border-blue-500 hover:text-blue-400 transition mt-2"
        >
          Import Media (PNG, MP3, MP4...)
        </label>
      </div>

      {/* Carousel Preview */}
      {(existingCarousel.length > 0 || newCarousel.length > 0) && (
        <div className="w-full mb-2">
          <label className="block text-xs text-pink-400 mb-2">Carousel</label>
          <div className="flex flex-wrap gap-2">
            {existingCarousel.map((img, i) => (
              <div key={`ec-${i}`} className="relative group">
                <img src={img.url} alt={`carousel-${i}`} className="w-24 h-24 object-cover rounded" />
                <button type="button"
                  onClick={() => removeExistingCarousel(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 text-xs opacity-70 hover:opacity-100"
                  title="Remove"
                >×</button>
              </div>
            ))}
            {newCarousel.map((file, i) => (
              <div key={`nc-${i}`} className="relative group">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-24 h-24 object-cover rounded" />
                <button type="button"
                  onClick={() => removeNewCarousel(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 text-xs opacity-70 hover:opacity-100"
                  title="Remove"
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

     
      {/* Schedule */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-200 mb-2">Schedule:</label>
        <input
          type="datetime-local"
          name="scheduledAt"
          value={form.scheduledAt || ""}
          onChange={handleChange}
          disabled={form.postNow}
          className={`w-full p-2 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-white ${
            form.postNow ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      </div>
      <PostVariants
        value={form.variants}
        onChange={(newVal) => setForm((prev) => ({ ...prev, variants: newVal }))}
      />
      <RecurringPostOptions
        value={form.recurring}
        onChange={(val) => setForm((prev) => ({ ...prev, recurring: val }))}
        disabled={form.postNow}
      />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <PostNowToggle
        checked={form.postNow}
        onChange={(val) => setForm((prev) => ({ ...prev, postNow: val }))}
      />
      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        className="ml-3 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
      >
        {showPreview ? "Hide Preview" : "Preview Post"}
      </button>
      {showPreview && (
        <div className="mt-4 space-x-2">
          <button
            className={`px-3 py-1 rounded text-sm ${
              activePreview === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
            onClick={() => setActivePreview("all")}
          >
            Show All
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              activePreview === "twitter"
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
            onClick={() => setActivePreview("twitter")}
          >
            Twitter
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              activePreview === "instagram"
                ? "bg-pink-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
            onClick={() => setActivePreview("instagram")}
          >
            Instagram
          </button>
        </div>
      )}
      {showPreview && <PostPreview post={form} platform={activePreview} />}
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition-all"
      >
        {isEdit ? "Update Post" : "Schedule Post"}
      </button>
    </form>
  );
}