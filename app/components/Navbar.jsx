"use client"
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { FaCalendarAlt, FaSignOutAlt } from "react-icons/fa";
import Link from "next/link";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // ⛔ Don't show navbar on homepage
  if (pathname === "/") return null;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-white text-xl font-bold tracking-wide">
        Post<span className="text-blue-500">Pilot</span>
      </h1>

      {user && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/scheduled")}
            className="flex items-center gap-2 text-sm text-white bg-gray-800 px-3 py-1.5 rounded hover:bg-gray-700 transition"
          >
            <FaCalendarAlt />
            <span className="hidden sm:inline">Scheduled</span>
          </button>

          <span className="text-sm text-gray-300 hidden sm:inline-block">
            {user.displayName || user.email}
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition"
          >
            <FaSignOutAlt className="text-sm" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
