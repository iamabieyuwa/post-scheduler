"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PostCard from "./PostCard";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { FaSpinner } from "react-icons/fa";

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
          id: doc.id,
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
      await deleteDoc(doc(db, "posts", String(postToDelete.id)));
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

  const handleDuplicatePost = async (post) => {
    try {
      const duplicated = {
        ...post,
        scheduledAt: null,
        postNow: false,
        createdAt: null,
      };
      delete duplicated.id;

      const docRef = await addDoc(collection(db, "posts"), {
        ...duplicated,
        createdAt: serverTimestamp(),
      });

      toast.success("✅ Post duplicated!");
      router.push(`/edit/${docRef.id}`);
    } catch (err) {
      console.error("❌ Failed to duplicate post:", err);
      toast.error("Could not duplicate post.");
    }
  };

  const now = new Date();
  const filteredPosts = posts
    .filter((post) =>
      post.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((post) => {
      if (statusFilter === "scheduled") {
        return new Date(post.scheduledAt) > now;
      }
      if (statusFilter === "posted") {
        return new Date(post.scheduledAt) <= now;
      }
      return true;
    });

  return (
    <div className="min-h-screen w-full px-4 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6">📅 Scheduled Posts</h1>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Search by content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md p-2 rounded bg-gray-800 border border-gray-600 text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 bg-gray-800 text-white border border-gray-600 rounded w-full sm:w-48"
        >
          <option value="all">All</option>
          <option value="scheduled">Scheduled</option>
          <option value="posted">Already Posted</option>
        </select>
      </div>

      {/* Post List */}
      {loading ? (
        <div className="flex justify-center items-center mt-20">
          <FaSpinner className="animate-spin text-white text-2xl" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <p className="text-gray-400">No posts found.</p>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={() => router.push(`/edit/${post.id}`)}
              onDelete={() => setPostToDelete(post)}
              onDuplicate={() => handleDuplicatePost(post)}
              isDeleting={deletingId === post.id}
            />
          ))}
        </div>
      )}

      {/* Delete Modal */}
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
