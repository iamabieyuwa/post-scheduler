"use client";

import { useState } from "react";
import { FaBars, FaTimes, FaUserCircle, FaCog, FaEnvelope } from "react-icons/fa";
import Link from "next/link";

export default function MobileDrawerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      {/* Burger Icon */}
      <button
        aria-label="Open menu"
        className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen(true)}
      >
        <FaBars className="text-2xl text-blue-400" />
      </button>
      {/* Overlay & Drawer */}
      {open && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute right-0 top-0 h-full w-60 bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col p-6 z-50 animate-slide-in">
            <button
              aria-label="Close menu"
              className="self-end mb-8 text-gray-400 hover:text-white transition"
              onClick={() => setOpen(false)}
            >
              <FaTimes className="text-2xl" />
            </button>
            <Link href="/settings" className="flex items-center gap-2 py-3 text-white hover:text-blue-400 transition font-semibold">
              <FaUserCircle /> Profile
            </Link>
            <Link href="/settings/email" className="flex items-center gap-2 py-3 text-white hover:text-blue-400 transition font-semibold">
              <FaEnvelope /> Change Email
            </Link>
            <Link href="/settings/password" className="flex items-center gap-2 py-3 text-white hover:text-blue-400 transition font-semibold">
              <FaCog /> Change Password
            </Link>
            {/* Add more menu items as needed */}
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
    </div>
  );
}