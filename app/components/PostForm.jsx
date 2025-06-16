"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import MediaPreview from "./MediaPreview";
import PostTextarea from "./PostTextarea";
import toast from "react-hot-toast";
import EmojiPickerBox from "./EmojiPickerBox";
import RecurringPostOptions from "./RecurringPostOptions";
import PostNowToggle from "./PostNowToggle";
import PostVariants from "./PostVariants";
import ThreadCarouselMode from "./ThreadCarouselMode";
import { getInitialFormState } from '../utils/getInitialFormState'
import PostPreview from "./PostPreview";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";


export default function PostForm({ onAdd }) {
  const [form, setForm] = useState(getInitialFormState());
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
const [activePreview, setActivePreview] = useState("all"); // "twitter", "instagram", or "all"

const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setUser(user);
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (checkingAuth) return <p className="text-center">Loading...</p>;

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

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
  
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  
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
    if (carousel.length > 10) {
      return setError("You can only upload up to 10 images for carousel.");
    }
    if (!platforms.length) {
      return setError("Select at least one platform.");
    }
    if (!postNow && !scheduledAt) {
      return setError("Please select a date and time.");
    }
  
    // ✅ Upload media to Cloudinary
    try {
      const uploadedMainMedia = await Promise.all(
        form.images.map(async (file) => {
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
        carousel.map(async (file) => {
          const url = await uploadToCloudinary(file);
          return {
            url,
            type: file.type,
            name: file.name,
            size: file.size,
          };
        })
      );
  
      const uploadedThread = await Promise.all(
        thread.map(async (block) => ({
          ...block,
          images: block.images
            ? await Promise.all(
                block.images.map(async (file) => {
                  const url = await uploadToCloudinary(file);
                  return {
                    url,
                    type: file.type,
                    name: file.name,
                    size: file.size,
                  };
                })
              )
            : [],
        }))
      );
  
      // ✅ Build new post
      const newPost = {
        id: Date.now(),
        content: finalContent,
        platforms,
        media: uploadedMainMedia,
        scheduledAt: postNow ? new Date().toISOString() : scheduledAt,
        postNow,
        recurring,
        variantUsed: finalContent !== content ? finalContent : null,
        postFormat: {
          thread: uploadedThread,
          carousel: uploadedCarousel,
        },
      };
  
      const cleanedPost = JSON.parse(JSON.stringify(newPost)); // Removes undefined or invalid objects
      console.log("🧪 Cleaned Post to Firestore:", cleanedPost);
      

      // ✅ Save to Firestore
      await addDoc(collection(db, "posts"), {
        ...cleanedPost,
        createdAt: serverTimestamp(),
      });
      
      
  
      if (onAdd) onAdd(newPost);
      toast.success("✅ Post saved to Firestore!");
      setForm(getInitialFormState());
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
      <ThreadCarouselMode
  value={form.postFormat}
  onChange={(val) =>
    setForm((prev) => ({ ...prev, postFormat: val }))
  }
/>

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
  value={form.scheduledAt || ""}
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
  onChange={(val) =>
    setForm((prev) => ({
      ...prev,
      recurring: val,
    }))
  }
  disabled={form.postNow}
/>



      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
<PostNowToggle
  checked={form.postNow}
  onChange={(val) =>
    setForm((prev) => ({ ...prev, postNow: val }))
  }
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


{showPreview && (
  <PostPreview post={form} platform={activePreview} />
)}


      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition-all"
      >
        Schedule Post
      </button>
    </form>
  );
}
