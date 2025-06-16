"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { FaInstagram, FaXTwitter } from "react-icons/fa6";

export default function ConnectAccountsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/");
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-[#1a1a1a] text-white flex flex-col items-center justify-center px-6 py-12 font-sans">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">Connect Your Platforms</h1>
        <p className="mt-3 text-gray-400 text-lg max-w-md mx-auto">
          Link your accounts to start scheduling posts like a pro.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-xl">
        {/* X */}
        <div className="bg-[#121212] rounded-xl p-6 border border-gray-700 shadow hover:shadow-blue-500/10 transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-full p-3">
              <FaXTwitter className="text-black text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Connect X (Twitter)</h2>
              <p className="text-sm text-gray-400">Post to your X timeline.</p>
            </div>
          </div>
          <button
            onClick={() => alert("X connection coming soon")}
            className="mt-6 w-full py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition"
          >
            Connect X
          </button>
        </div>

        {/* Instagram */}
        <div className="bg-[#121212] rounded-xl p-6 border border-gray-700 shadow hover:shadow-pink-500/10 transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-pink-500 to-yellow-400 rounded-full p-3">
              <FaInstagram className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Connect Instagram</h2>
              <p className="text-sm text-gray-400">Post reels, images & more.</p>
            </div>
          </div>
          <button
            onClick={() => alert("Instagram connection coming soon")}
            className="mt-6 w-full py-2 bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-semibold rounded hover:opacity-90 transition"
          >
            Connect Instagram
          </button>
        </div>
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="mt-10 text-blue-400 hover:text-blue-500 underline transition text-sm"
      >
        Skip for now →
      </button>
    </div>
  );
}
