"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { FaCalendarAlt, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import Link from "next/link";
import BreadCrumbs from "./BreadCrumbs";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
    setDrawerOpen(false);
  };

  // ⛔ Don't show navbar on homepage
  if (pathname === "/") return null;

  // Custom breadcrumbs for special pages, deterministic on first render
  let customCrumbs = null;
  if (pathname === "/scheduled") {
    customCrumbs = [
      { href: "/", label: "Home" },
      { href: "/dashboard", label: "dashboard" }
    ];
  } else if (pathname === "/dashboard") {
    customCrumbs = [
      { href: "/", label: "Home" },
      { href: "/scheduled", label: "scheduled" }
    ];
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black px-4 sm:px-6 py-4 flex items-center shadow-md">
      {/* Centered Breadcrumbs with Logo Above */}
     <div className="flex items-center gap-4">
  <h1 className="text-white text-xl font-bold tracking-wide whitespace-nowrap">
    Post<span className="text-blue-500">Pilot</span>
  </h1>
  <BreadCrumbs forceCrumbs={customCrumbs} navClassName="ml-8" />
</div>

      {user && (
        <>
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-4 absolute right-6 top-1/2 -translate-y-1/2">
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
            <Link
              href="/settings"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition px-3 py-2"
            >
              <FiSettings className="text-sm" />
              <span className="hidden md:inline text-sm">Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition"
            >
              <FaSignOutAlt className="text-sm" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          {/* Burger Icon for Mobile */}
          <button
            className="sm:hidden p-2 rounded focus:outline-none z-50 absolute right-4"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <FaBars className="text-2xl text-blue-400" />
          </button>
        </>
      )}

      {/* Drawer Menu (Mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black bg-opacity-60"
            onClick={() => setDrawerOpen(false)}
          />
          <nav className="absolute right-0 top-0 h-full w-64 bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col p-6 z-50 animate-slide-in">
            <button
              aria-label="Close menu"
              className="self-end mb-8 text-gray-400 hover:text-white transition"
              onClick={() => setDrawerOpen(false)}
            >
              <FaTimes className="text-2xl" />
            </button>
            <button
              onClick={() => {
                router.push("/scheduled");
                setDrawerOpen(false);
              }}
              className="flex items-center gap-2 py-3 text-white hover:text-blue-400 transition font-semibold"
            >
              <FaCalendarAlt /> Scheduled
            </button>
            <Link
              href="/settings"
              className="flex items-center gap-2 py-3 text-white hover:text-blue-400 transition font-semibold"
              onClick={() => setDrawerOpen(false)}
            >
              <FiSettings /> Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 py-3 text-red-400 hover:text-red-600 transition font-semibold"
            >
              <FaSignOutAlt /> Logout
            </button>
            {/* User Info */}
            <span className="mt-8 text-xs text-gray-400 truncate">
              {user.displayName || user.email}
            </span>
          </nav>
        </div>
      )}
      <style jsx>{`
        .animate-slide-in {
          animation: slide-in 0.24s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </header>
  );
}