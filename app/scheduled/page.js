// app/scheduled/page.jsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { FaSpinner } from "react-icons/fa";
import PostCard from './PostCard'
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import toast from "react-hot-toast";


export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState(null); // ← at top
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(fetchedPosts);
      } catch (err) {
        console.error("❌ Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleConfirmDelete = async () => {
    if (!postToDelete?.id) return;
  
    setDeletingId(postToDelete.id);
  
    try {
        await deleteDoc(doc(db, "posts", String(postToDelete?.id)));
      toast.success("Post deleted");
  
      // ✅ Correct ID comparison
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
        <div className="flex justify-center items-center mt-20">
          <FaSpinner className="animate-spin text-white text-2xl" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-gray-400">No scheduled posts found.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
  <PostCard
    key={post.id}
    post={post}
    onEdit={() => handleEdit(post)}
    onDelete={() => setPostToDelete(post)}
    isDeleting={deletingId === post.id} // 👈 pass this
  />
))}
        </div>
      )}
      <ConfirmDeleteModal
  isOpen={!!postToDelete}
  onClose={() => setPostToDelete(null)}
  onConfirm={handleConfirmDelete}
  postToDelete={postToDelete}
  isDeleting={deletingId === postToDelete?.id} // ✅ pass this
/>


    </div>
  );
}
