"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FaInstagram, FaXTwitter } from "react-icons/fa6";
import { FaSpinner, FaCheckCircle } from "react-icons/fa";
import { generateCodeVerifier, generateCodeChallenge } from "./../utils/pkce"

export default function ConnectAccountsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState({ twitter: false, instagram: false });
  const [connecting, setConnecting] = useState({ twitter: false, instagram: false });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/");
      } else {
        setUser(u);
        // Fetch connection status from Firestore
        const userDocRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setConnected({
            twitter: !!(data.connectedAccounts && data.connectedAccounts.twitter),
            instagram: !!(data.connectedAccounts && data.connectedAccounts.instagram),
          });
        }
        setChecking(false);
      }
    });
    return () => unsub();
  }, [router]);const handleConnectTwitter = async () => {
  setConnecting((c) => ({ ...c, twitter: true }));

  try {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    // Save verifier for use in callback (cookie for server, localStorage for debug)
    localStorage.setItem("twitter_code_verifier", verifier);
    document.cookie = `twitter_code_verifier=${verifier}; path=/`;

    // 🔐 NEW: Save Firebase ID token for secure UID lookup
    const token = await user.getIdToken();
    document.cookie = `firebase_token=${token}; path=/`;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
      redirect_uri: "http://localhost:3000/api/twitter/callback",
      scope: "tweet.read tweet.write users.read offline.access",
      state: "secureState123",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    window.location.href = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  } catch (err) {
    console.error("Twitter PKCE error", err);
    alert("Failed to initiate Twitter connection.");
    setConnecting((c) => ({ ...c, twitter: false }));
  }
};



  const handleConnectInstagram = async () => {
    setConnecting((c) => ({ ...c, instagram: true }));
    try {
      // TODO: Replace with real Instagram OAuth logic
      // Simulate successful connection:
      await new Promise((res) => setTimeout(res, 1000));
      // Update Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          connectedAccounts: { instagram: true },
        },
        { merge: true }
      );
      setConnected((c) => ({ ...c, instagram: true }));
    } catch (e) {
      alert("Instagram connection failed (demo)");
    }
    setConnecting((c) => ({ ...c, instagram: false }));
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <FaSpinner className="text-white text-2xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-12 font-sans">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">Connect Your Platforms</h1>
        <p className="mt-3 text-gray-400 text-lg max-w-md mx-auto">
          Link your accounts to start scheduling posts like a pro.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-xl">
        {/* Twitter/X */}
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
          {connected.twitter ? (
            <button
              disabled
              className="mt-6 w-full py-2 bg-green-500 text-white font-semibold rounded flex items-center justify-center gap-2"
            >
              <FaCheckCircle className="text-white" /> Connected!
            </button>
          ) : (
            <button
              onClick={handleConnectTwitter}
              disabled={connecting.twitter}
              className="mt-6 w-full py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              {connecting.twitter && (
                <FaSpinner className="animate-spin mr-2" />
              )}
              Connect X
            </button>
          )}
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
          {connected.instagram ? (
            <button
              disabled
              className="mt-6 w-full py-2 bg-green-500 text-white font-semibold rounded flex items-center justify-center gap-2"
            >
              <FaCheckCircle className="text-white" /> Connected!
            </button>
          ) : (
            <button
              onClick={handleConnectInstagram}
              disabled={connecting.instagram}
              className="mt-6 w-full py-2 bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-semibold rounded hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              {connecting.instagram && (
                <FaSpinner className="animate-spin mr-2" />
              )}
              Connect Instagram
            </button>
          )}
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