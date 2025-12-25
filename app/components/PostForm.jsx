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
import { getInitialFormState } from "../utils/getInitialFormState";
import PostPreview from "./PostPreview";
import DropZone from "./DropZone";
import { FaSpinner } from "react-icons/fa";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function PostForm({
  onAdd,
  onSave,
  isEdit = false,
  initialData = null,
}) {
  const [form, setForm] = useState(initialData || getInitialFormState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const [existingMedia, setExistingMedia] = useState(initialData?.media || []);
  const [existingCarousel, setExistingCarousel] = useState(
    initialData?.postFormat?.carousel || []
  );
  const [newMedia, setNewMedia] = useState([]);
  const [newCarousel, setNewCarousel] = useState([]);

  // --- Auth logic ---
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

  // --- Sync logic ---
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
      <div className="flex justify-center items-center mt-20">
        <FaSpinner className="animate-spin text-white text-2xl" />
      </div>
    );

  const removeExistingMedia = (i) =>
    setExistingMedia(existingMedia.filter((_, idx) => idx !== i));
  const removeNewMedia = (i) =>
    setNewMedia(newMedia.filter((_, idx) => idx !== i));

  const getPlainText = (html) => {
    if (typeof window === "undefined") return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const plainText = getPlainText(form.content);
  const charLimit = 280;
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

    // Handle Variants
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

    // --- Validation ---
    if (!finalContent && !threadEnabled && !carouselEnabled) {
      setLoading(false);
      return setError("Add content, a thread, or a carousel to post.");
    }

    if (threadEnabled) {
        const invalidThread = thread.some(t => !t.text.trim() && (!t.images || !t.images.length));
        if (invalidThread) {
            setLoading(false);
            return setError("Each thread block must have text or image.");
        }
    }

    if (contentLength > charLimit) {
        setLoading(false);
        return setError(`Content is too long for X (${contentLength}/${charLimit})`);
    }

    try {
      // 1. Upload Main Media
      const uploadedMedia = await Promise.all(
        newMedia.map(async (file) => {
          const url = await uploadToCloudinary(file);
          return { url, type: file.type, name: file.name, size: file.size };
        })
      );

      // 2. Upload Carousel Media
      const uploadedCarousel = await Promise.all(
        newCarousel.map(async (file) => {
          const url = await uploadToCloudinary(file);
          return { url, type: file.type, name: file.name, size: file.size };
        })
      );

      // 3. Upload Thread Images
      let uploadedThread = thread;
      if (threadEnabled) {
        uploadedThread = await Promise.all(
          thread.map(async (block) => {
            const uploadedImages = await Promise.all(
              (block.images || []).map(async (file) => {
                if (typeof file === "string") return file; // Already uploaded
                return await uploadToCloudinary(file);
              })
            );
            return { text: block.text, images: uploadedImages };
          })
        );
      }

      const newPost = {
        content: finalContent,
        platforms: ["twitter"],
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
        status: "pending", // Worker picks this up
      };

      const cleanedPost = JSON.parse(JSON.stringify(newPost));

      if (isEdit && onSave) {
        await onSave({ ...cleanedPost, id: initialData?.id });
      } else {
        const docRef = await addDoc(collection(db, "posts"), {
          ...cleanedPost,
          createdAt: serverTimestamp(),
        });
        if (onAdd) onAdd({ ...cleanedPost, id: docRef.id });
      }

      // --- FULL RESET ---
      toast.success("Success! Post Pilot is ready 🚀");
      setForm(getInitialFormState());
      setExistingMedia([]);
      setExistingCarousel([]);
      setNewMedia([]);
      setNewCarousel([]);
      setError("");
      
    } catch (err) {
      console.error("❌ Submission Error:", err);
      toast.error(err.message || "Failed to save post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-7 max-w-2xl w-full bg-white/5 backdrop-blur-md p-8 shadow-xl rounded-2xl border border-white/10"
    >
      <div className="w-full">
        <div className="flex justify-between items-end mb-2">
            <label className="text-sm font-medium text-gray-200">Post Content:</label>
            <span className={`text-[10px] font-mono ${contentLength > charLimit ? 'text-red-500' : 'text-gray-500'}`}>
                {contentLength}/{charLimit}
            </span>
        </div>
        <PostTextarea
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
        />
        <EmojiPickerBox
          onSelect={(emoji) => setForm((prev) => ({ ...prev, content: prev.content + emoji }))}
        />
      </div>

      <DropZone
        label="📁 Add Main Media (Max 4)"
        onDrop={(files) => {
          const incoming = Array.isArray(files) ? files : [files];
          if (existingMedia.length + newMedia.length + incoming.length > 4) {
            return toast.error("Maximum of 4 media items allowed.");
          }
          setNewMedia((prev) => [...prev, ...incoming]);
        }}
        multiple={true}
        accept="image/*,video/mp4"
      />

      {/* Main Media Previews */}
      {(newMedia.length > 0 || existingMedia.length > 0) && (
        <div className="w-full grid grid-cols-2 gap-4">
          {[...existingMedia, ...newMedia].map((file, i) => (
            <div key={i} className="relative group bg-gray-900/50 p-2 rounded-lg border border-white/5">
              <MediaPreview file={file} />
              <button
                type="button"
                onClick={() => i < existingMedia.length ? removeExistingMedia(i) : removeNewMedia(i - existingMedia.length)}
                className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-lg"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <ThreadCarouselMode
        value={form.postFormat}
        onChange={(val) => setForm((prev) => ({ ...prev, postFormat: val }))}
      />

      <div className="w-full h-px bg-white/10 my-2" />

      <RecurringPostOptions
        value={form.recurring}
        onChange={(val) => setForm((prev) => ({ ...prev, recurring: val }))}
        disabled={form.postNow}
      />

      <DateTimeInput
        label="Set Schedule Time"
        value={form.scheduledAt}
        onChange={(val) => setForm((prev) => ({ ...prev, scheduledAt: val }))}
        disabled={form.postNow}
      />

      {error && (
        <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center animate-pulse">
            {error}
        </div>
      )}

      <div className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
        <PostNowToggle
            checked={form.postNow}
            onChange={(val) => setForm((prev) => ({ ...prev, postNow: val }))}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3"
      >
        {loading ? <FaSpinner className="animate-spin" /> : (isEdit ? "Update Schedule" : "Confirm Schedule")}
      </button>

      <div className="text-center opacity-40">
        <p className="text-[10px] uppercase tracking-widest font-semibold">
          Built by Abieyuwa Imina
        </p>
      </div>
    </form>
  );
}