"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PostCard from './PostCard';
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { FaSpinner } from 'react-icons/fa';

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
      if (!user) router.push("/");
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!authChecked || !currentUser) return;

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "posts"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const userPosts = snapshot.docs.map((doc) => ({
          id: doc.id, // Firestore document ID!
          ...doc.data(),
        }));
        setPosts(userPosts);
      } catch (err) {
        console.error("❌ Failed to fetch user posts:", err);
        toast.error("Missing or insufficient permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [authChecked, currentUser]);

  const handleConfirmDelete = async () => {
    if (!postToDelete?.id) return;
    setDeletingId(postToDelete.id);

    try {
      await deleteDoc(doc(db, "posts", String(postToDelete?.id))); // Use Firestore doc id
      toast.success("Post deleted");
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      setPostToDelete(null);
    } catch (err) {
      console.error("❌ Failed to delete post:", err);
      toast.error("Could not delete post.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6">📅 Scheduled Posts</h1>

      {loading ? (
        <div className="flex justify-center items-center align-center mt-20">
          <FaSpinner className="animate-spin text-white text-2xl" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-gray-400">No scheduled posts found.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id} // Firestore doc id!
              post={post}
              onEdit={() => router.push(`/edit/${post.id}`)} // Use Firestore doc id!
              onDelete={() => setPostToDelete(post)}
              isDeleting={deletingId === post.id}
            />
          ))}
        </div>
      )}
      <ConfirmDeleteModal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleConfirmDelete}
        postToDelete={postToDelete}
        isDeleting={deletingId === postToDelete?.id}
      />
    </div>
  );
}