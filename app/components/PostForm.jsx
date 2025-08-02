"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import MediaPreview from "./MediaPreview";
import DateTimeInput from "./DateTimeInput";
import PostTextarea from "./PostTextarea";
import toast from "react-hot-toast";
import EmojiPickerBox from "./EmojiPickerBox";
import RecurringPostOptions from "./RecurringPostOptions";
import PostNowToggle from "./PostNowToggle";
import PostVariants from "./PostVariants";
import ThreadCarouselMode from "./ThreadCarouselMode";
import { getInitialFormState } from '../utils/getInitialFormState';
import PostPreview from "./PostPreview";
import DropZone from "./DropZone"
import { FaSpinner } from "react-icons/fa";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function PostForm({ onAdd, onSave, isEdit = false, initialData = null }) {
  const [form, setForm] = useState(initialData || getInitialFormState());
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activePreview, setActivePreview] = useState("all");
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const [existingMedia, setExistingMedia] = useState(initialData?.media || []);
  const [existingCarousel, setExistingCarousel] = useState(initialData?.postFormat?.carousel || []);
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

  useEffect(() => {
  return () => {
    newMedia.forEach((file) => URL.revokeObjectURL(file));
    newCarousel.forEach((file) => URL.revokeObjectURL(file));
  };
}, [newMedia, newCarousel]);

  if (checkingAuth)
    return (
      <div className="flex justify-center items-center align-center mt-20">
        <FaSpinner className="animate-spin text-white text-2xl" />
      </div>
    );

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setError("");
    if (type === "file") {
      if (name === "media") {
        setNewMedia([...newMedia, ...Array.from(files)]);
      } else if (name === "carousel") {
        setNewCarousel([...newCarousel, ...Array.from(files)]);
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removeExistingMedia = (i) => setExistingMedia(existingMedia.filter((_, idx) => idx !== i));
  const removeNewMedia = (i) => setNewMedia(newMedia.filter((_, idx) => idx !== i));
  const removeExistingCarousel = (i) => setExistingCarousel(existingCarousel.filter((_, idx) => idx !== i));
  const removeNewCarousel = (i) => setNewCarousel(newCarousel.filter((_, idx) => idx !== i));

  const getPlainText = (html) => {
    if (typeof window === "undefined") return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const getCharLimit = () => 280;


  const plainText = getPlainText(form.content);
 const charLimit = getCharLimit();
  const contentLength = plainText.length;

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
  const errorData = await res.json().catch(() => ({}));
  throw new Error(errorData?.error || "Upload failed");
}

    const data = await res.json();
    return data.url;
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  const { content, scheduledAt, postNow, variants, recurring, postFormat } = form;
  let finalContent = content;

  // Handle variants (A/B testing)
  if (variants?.enabled && variants.variants.length > 0) {
    const options = variants.variants.filter((v) => v.trim() !== "");
    if (options.length > 0) {
      const randomIndex = Math.floor(Math.random() * options.length);
      finalContent = options[randomIndex];
    }
  }

  const thread = postFormat?.thread || [];
  const carousel = postFormat?.carousel || [];
  const threadEnabled = thread.length > 0;
  const carouselEnabled = carousel.length > 0;

  // Ensure there's something to post
  if (!finalContent && !threadEnabled && !carouselEnabled) {
    return setError("Add content, a thread, or a carousel to post.");
  }

  // Thread block validation
  const invalidThread = threadEnabled && thread.some(
    (t) => !t.text.trim() && (!t.images || !t.images.length)
  );
  if (invalidThread) {
    return setError("Each thread block must have text or image.");
  }

  // Twitter-specific media rules
  const totalMedia = [...existingMedia, ...newMedia];
  const imageCount = totalMedia.filter((f) => f.type?.startsWith("image/")).length;
  const videoCount = totalMedia.filter((f) => f.type?.startsWith("video/")).length;

  if (totalMedia.length > 4) {
    return setError("You can only upload up to 4 media files for Twitter.");
  }
  if (videoCount > 1) {
    return setError("Twitter only allows one video per post.");
  }
  if (videoCount >= 1 && imageCount >= 1) {
    return setError("You can't mix images and video in a single Twitter post.");
  }

  if (!postNow && !scheduledAt) {
    return setError("Please select a date and time.");
  }

  try {
    // Upload media to Cloudinary
    const uploadedMedia = await Promise.all(
      (newMedia || []).map(async (file) => {
        const url = await uploadToCloudinary(file);
        return {
          url,
          type: file.type,
          name: file.name,
          size: file.size,
        };
      })
    );

    const uploadedCarousel = await Promise.all(
      (newCarousel || []).map(async (file) => {
        const url = await uploadToCloudinary(file);
        return {
          url,
          type: file.type,
          name: file.name,
          size: file.size,
        };
      })
    );

    // Upload thread images
    let uploadedThread = thread;
    if (threadEnabled) {
      uploadedThread = await Promise.all(
        thread.map(async (block) => {
          const uploadedImages = await Promise.all(
            (block.images || []).map(async (file) => {
              if (typeof file === "string") return file;
              const url = await uploadToCloudinary(file);
              return url;
            })
          );
          return {
            text: block.text,
            images: uploadedImages,
          };
        })
      );
    }

    const newPost = {
  content: finalContent,
  platforms,
  media: [...existingMedia, ...uploadedMedia],
  scheduledAt: postNow ? new Date().toISOString() : scheduledAt,
  postNow,
  recurring,
  variantUsed: finalContent !== content ? finalContent : null,
   postFormat: {
    thread: uploadedThread,
    carousel: [...existingCarousel, ...uploadedCarousel],
  },
  userId: user.uid,
  status: postNow ? 'posted' : 'pending', // ✅ This is the key addition
};

    const cleanedPost = JSON.parse(JSON.stringify(newPost));

    if (isEdit && onSave) {
      await onSave({ ...newPost, id: initialData?.id });
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
  } finally {
    setLoading(false);
  }
};


  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-7 max-w-2xl w-full bg-white/5 backdrop-blur-md p-8 shadow-xl rounded-2xl border border-white/10"
    >
      {/* Post Content */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-200 mb-2">Post Content:</label>
        <PostTextarea
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
        />
        <EmojiPickerBox
          onSelect={(emoji) =>
            setForm((prev) => ({ ...prev, content: prev.content + emoji }))
          }
        />
        {charLimit > 0 && (
          <p className={`text-xs mt-1 text-right ${contentLength > charLimit ? "text-red-500" : "text-gray-300"}`}>
            {contentLength} / {charLimit}
          </p>
        )}
      </div>
<DropZone
  label="📁 Import main media (Max 4)"
  onDrop={(files) => {
    const incoming = Array.isArray(files) ? files : [files];
    const total = existingMedia.length + newMedia.length + incoming.length;

    if (total > 4) {
      toast.error("You can only upload up to 4 media files.");
      return;
    }

    setNewMedia((prev) => [...prev, ...incoming]);
  }}
  multiple={true}
  accept="image/*,audio/mpeg,video/mp4,video/webm"
  max={4}
  disabled={existingMedia.length + newMedia.length >= 4}
/>
{(newMedia.length > 0 || existingMedia.length > 0) && (
  <div className="w-full mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
    {[...existingMedia, ...newMedia].map((file, i) => {
      const url = file.url || URL.createObjectURL(file);
      const type = file.type || file.mimeType;

      return (
        <div key={i} className="relative group bg-gray-800 p-2 rounded shadow-sm">
          {type?.startsWith("image/") && (
            <img src={url} alt={`media-${i}`} className="h-40 w-full object-contain rounded" />
          )}
          {type?.startsWith("video/") && (
            <video src={url} controls className="h-40 w-full object-contain rounded" />
          )}
          {type?.startsWith("audio/") && (
            <audio src={url} controls className="w-full" />
          )}

          <button
            type="button"
            onClick={() => {
              if (i < existingMedia.length) {
                removeExistingMedia(i);
              } else {
                removeNewMedia(i - existingMedia.length);
              }
            }}
            className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            ✕
          </button>
        </div>
      );
    })}
  </div>
)}

      <ThreadCarouselMode
        value={form.postFormat}
        onChange={(val) => setForm((prev) => ({ ...prev, postFormat: val }))}
      />
      {/* The rest... */}
      <RecurringPostOptions
        value={form.recurring}
        onChange={(val) => setForm((prev) => ({ ...prev, recurring: val }))}
        disabled={form.postNow}
      />
      <DateTimeInput
  label="Post Date & Time"
  value={form.scheduledAt}
  onChange={(val) => setForm((prev) => ({ ...prev, scheduledAt: val }))}
  disabled={form.postNow}
/>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <PostNowToggle
        checked={form.postNow}
        onChange={(val) => setForm((prev) => ({ ...prev, postNow: val }))}
      />
     <button
  type="submit"
  disabled={loading}
  className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition-all ${
    loading ? "opacity-50 cursor-not-allowed" : ""
  }`}
>
  {loading ? "Saving..." : isEdit ? "Update Post" : "Schedule Post"}
</button>

    </form>
  );
}
