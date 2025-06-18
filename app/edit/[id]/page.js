"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import toast from "react-hot-toast";
import PostForm from "../../components/PostForm";
import { auth } from "../../lib/firebase";
export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchPost = async () => {
    try {
      console.log("🔍 Getting post for ID:", id);

      const docRef = doc(db, "posts", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("✅ Post found:", data);
        setPostData(data);
      } else {
        console.warn("⚠️ No such post exists!");
        toast.error("Post not found");
        router.push("/scheduled");
      }
    } catch (err) {
      console.error("❌ Failed to load post", err);
      toast.error("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  if (id) fetchPost();
}, [id, router]);


 const handleUpdate = async (updatedPost) => {
  try {
    const docRef = doc(db, "posts", id);
    const cleanedPost = JSON.parse(JSON.stringify(updatedPost)); // strip undefined/circular
    await updateDoc(docRef, {
      ...cleanedPost,
      updatedAt: new Date().toISOString()
    });
    toast.success("Post updated successfully!");
    router.push("/scheduled");
  } catch (err) {
    console.error("Error updating post:", err);
    toast.error("Failed to update post");
  }
};


  if (loading) return <p className="text-center text-white mt-10">Loading post...</p>;

  return (
  <div className="min-h-screen flex flex-col items-center justify-center max-w-2xl px-4 py-10 bg-black text-white">
    <h1 className="text-3xl font-bold mb-6 text-center">✏️ Edit Post</h1>
    
    <div className=" flex flex-col w-full max-w-3xl items-center justify-center align-center">
      <PostForm isEdit initialData={postData} onSave={handleUpdate} />
    </div>
  </div>
);

}
