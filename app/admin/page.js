"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

export default function AdminPage() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [stats, setStats] = useState({ users: 0, posts: 0, admins: 0 });
  const [users, setUsers] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();

  // 1) Check authentication & role
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/");
        return;
      }
      const userSnap = await getDoc(doc(db, "users", u.uid));
      if (userSnap.exists() && userSnap.data().role === "admin") {
        setIsAdmin(true);
        await fetchStatsAndUsers();
      } else {
        toast.error("Access denied");
        router.push("/dashboard");
      }
      setLoadingAuth(false);
    });
    return () => unsub();
  }, [router]);

  // 2) Fetch stats + user list
  const fetchStatsAndUsers = async () => {
    // Users & Admins
    const usersSnap = await getDocs(collection(db, "users"));
    const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const adminsCount = allUsers.filter((u) => u.role === "admin").length;

    // Posts
    const postsSnap = await getDocs(collection(db, "posts"));

    setStats({
      users: allUsers.length,
      admins: adminsCount,
      posts: postsSnap.size,
    });
    setUsers(allUsers);
  };

  // 3) Toggle user role
  const toggleRole = async (userId, currentRole) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", userId), {
        role: currentRole === "admin" ? "user" : "admin",
      });
      await fetchStatsAndUsers();
      toast.success("Role updated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingAuth || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <FaSpinner className="animate-spin text-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white space-y-8">
      <h1 className="text-3xl font-bold">👑 Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Total Users", value: stats.users, color: "blue" },
          { label: "Total Posts", value: stats.posts, color: "green" },
          { label: "Total Admins", value: stats.admins, color: "purple" },
        ].map((card) => (
          <div
            key={card.label}
            className={`p-6 rounded-lg border border-gray-700 bg-${card.color}-800/20`}
          >
            <p className="text-gray-400">{card.label}</p>
            <p className={`text-4xl font-semibold text-${card.color}-400`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* User Management */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between bg-[#111] p-4 rounded-lg border border-gray-800"
            >
              <div>
                <p className="font-medium">{u.email}</p>
                <p className="text-sm text-gray-400 capitalize">{u.role}</p>
              </div>
              <button
                disabled={actionLoading}
                onClick={() => toggleRole(u.id, u.role)}
                className={`px-4 py-1 rounded text-sm font-medium ${
                  u.role === "admin"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } transition`}
              >
                {actionLoading ? "…" : u.role === "admin" ? "Revoke" : "Promote"}
              </button>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-gray-400">No users found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
