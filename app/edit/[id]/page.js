"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import toast from "react-hot-toast";
import PostForm from "../../components/PostForm";
import {FaSpinner} from 'react-icons/fa'

export default function EditPostPage() {
  const { id } = useParams(); // Firestore doc id from URL!
  const router = useRouter();
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthChecked(true);
      if (!user) {
        toast.error("You must be logged in to edit a post.");
        router.push("/");
      }
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!authChecked || !currentUser) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "posts", id); // Use Firestore doc id!
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userId !== currentUser.uid) {
            toast.error("You do not have permission to edit this post.");
            router.push("/scheduled");
            return;
          }
          setPostData(data);
        } else {
          toast.error("Post not found");
          router.push("/scheduled");
        }
      } catch (err) {
        toast.error("Failed to load post");
        router.push("/scheduled");
        console.error("❌ Failed to fetch user posts:", err.code, err.message, err.stack);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id, router, authChecked, currentUser]);

  const handleUpdate = async (updatedPost) => {
    if (!currentUser || !postData || postData.userId !== currentUser.uid) {
      toast.error("You do not have permission to edit this post.");
      return;
    }
    try {
      const docRef = doc(db, "posts", id); // Firestore doc id!
      const cleanedPost = JSON.parse(JSON.stringify(updatedPost));
      await updateDoc(docRef, {
        ...cleanedPost,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Post updated successfully!");
      router.push("/scheduled");
    } catch (err) {
      console.error("Error updating post:", err);
      toast.error("Failed to update post");
    }
  };

  if (loading) return <div className="flex justify-center items-center align-center mt-20">
          <FaSpinner className="animate-spin text-white text-2xl" />
        </div>;

  return (
  <div className="min-h-screen flex items-center justify-center bg-black text-white px-4 py-10">
    <div className="w-full max-w-2xl flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6 text-center">✏️ Edit Post</h1>
      <PostForm isEdit initialData={postData} onSave={handleUpdate} />
    </div>
  </div>
);
}