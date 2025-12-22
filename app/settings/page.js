"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  verifyBeforeUpdateEmail,
  updatePassword,
  onAuthStateChanged,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { generateCodeVerifier, generateCodeChallenge } from "../utils/pkce";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import ConfirmDisconnectModal from "../settings/ConfirmDisconnectModal";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [currentEmail, setCurrentEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Change Email State
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [showReauth, setShowReauth] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  // Change Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // Email verification reminder
  const [showVerifyReminder, setShowVerifyReminder] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [twitterProfile, setTwitterProfile] = useState(null);
  const [connectingTwitter, setConnectingTwitter] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      setUser(currentUser);
      setCurrentEmail(currentUser.email);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();

          if (data.role === "admin") {
            setIsAdmin(true);
          }

          if (data.connectedAccounts?.twitter && data.twitterProfile) {
            setTwitterProfile(data.twitterProfile);
          }
        }

        setShowVerifyReminder(!currentUser.emailVerified);
      } catch (err) {
        console.error("Failed to fetch user settings:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCheckVerified = async () => {
    if (!user) return;
    setVerifyLoading(true);
    try {
      await user.reload();
      if (auth.currentUser.emailVerified) {
        setShowVerifyReminder(false);
        toast.success("Email verified!");
      } else {
        toast.error("Email is still not verified. Please check your inbox.");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred.");
    }
    setVerifyLoading(false);
  };

  const handleResendVerification = async () => {
    if (!user) return;
    setVerifyLoading(true);
    try {
      await sendEmailVerification(user);
      toast.success("Verification email sent!");
    } catch (err) {
      toast.error("Failed to send verification email.");
    }
    setVerifyLoading(false);
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!newEmail || newEmail === currentEmail) {
      toast.error("Please enter a new email.");
      return;
    }
    setEmailLoading(true);
    try {
      if (user.providerData[0]?.providerId !== "password") {
        throw new Error("Please use Google settings to change your email.");
      }
      await verifyBeforeUpdateEmail(user, newEmail);
      setNewEmail("");
      setShowVerifyReminder(true);
      toast.success("Verification link sent to your new email.");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setShowReauth(true);
        setPendingEmail(newEmail);
        toast.error("Please re-enter your password to confirm.");
      } else {
        toast.error(err.message || "Failed to update email.");
      }
    }
    setEmailLoading(false);
  };

  // ✅ Updated handleConnectTwitter logic
  const handleConnectTwitter = async () => {
    if (!user) return;
    setConnectingTwitter(true);
    try {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      // Store verifier for the callback
      localStorage.setItem("twitter_code_verifier", verifier);
      document.cookie = `twitter_code_verifier=${verifier}; path=/; Secure; SameSite=Lax`;

      const token = await user.getIdToken();
      document.cookie = `firebase_token=${token}; path=/; Secure; SameSite=Lax`;

      const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
        // ✅ Uses Environment Variable
        redirect_uri: process.env.NEXT_PUBLIC_TWITTER_CALLBACK_URL,
        scope: "tweet.read tweet.write users.read offline.access",
        state: "secureState123",
        code_challenge: challenge,
        code_challenge_method: "S256",
      });

      window.location.href = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
    } catch (err) {
      console.error("Twitter PKCE error", err);
      toast.error("Failed to initiate Twitter connection.");
      setConnectingTwitter(false);
    }
  };

  const handleReauthAndChangeEmail = async (e) => {
    e.preventDefault();
    if (!user) return;
    setEmailLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, reauthPassword);
      await reauthenticateWithCredential(user, credential);
      await verifyBeforeUpdateEmail(user, pendingEmail);
      setNewEmail("");
      setPendingEmail("");
      setReauthPassword("");
      setShowReauth(false);
      setShowVerifyReminder(true);
      toast.success("Verification link sent to your new email.");
    } catch (err) {
      toast.error(err.message || "Re-authentication failed.");
    }
    setEmailLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("Check your password fields.");
      return;
    }
    setPassLoading(true);
    try {
      await updatePassword(user, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update password.");
    }
    setPassLoading(false);
  };

  const handleDisconnectTwitter = async () => {
    if (!user) return;
    setIsDisconnecting(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          connectedAccounts: { twitter: false },
          twitterProfile: null,
          twitterTokens: null,
        },
        { merge: true }
      );
      setTwitterProfile(null);
      toast.success("Disconnected from X (Twitter)");
    } catch (err) {
      console.error("Error disconnecting Twitter:", err);
      toast.error("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center align-center mt-20">
        <FaSpinner className="animate-spin text-white text-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-2 sm:px-4 py-8 sm:py-12">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl border-[1px] border-gray-700 rounded-2xl shadow-lg p-4 sm:p-8 md:p-10 bg-transparent">
        <div className="flex items-center mb-8 gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex-1">
            Account Settings
          </h1>
          {isAdmin && (
            <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-blue-700 text-xs font-semibold text-blue-300 shadow">
              Admin
            </span>
          )}
        </div>

        {showVerifyReminder && (
          <div className="bg-yellow-900/40 border border-yellow-500 text-yellow-300 rounded-lg mb-6 px-4 py-3">
            <strong>Your email is not verified.</strong>
            <div className="mt-2 flex gap-2">
              <button onClick={handleResendVerification} disabled={verifyLoading} className="px-3 py-1 rounded bg-yellow-500 text-black font-semibold">
                Resend Email
              </button>
              <button onClick={handleCheckVerified} disabled={verifyLoading} className="px-3 py-1 rounded bg-gray-700 text-white font-semibold">
                I&apos;ve Verified
              </button>
            </div>
          </div>
        )}

        <form className="space-y-5 mb-10" onSubmit={handleChangeEmail}>
          <h2 className="text-base sm:text-lg font-semibold mb-1 text-gray-200">Change Email</h2>
          <input type="email" value={currentEmail} disabled className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-gray-400 cursor-not-allowed" />
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={isAdmin} placeholder="New email" className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white" />
          <button type="submit" disabled={isAdmin || emailLoading} className="w-full px-4 py-2 rounded-lg font-semibold bg-gray-700 text-white">
            {emailLoading ? <FaSpinner className="animate-spin inline mr-2" /> : "Update Email"}
          </button>
        </form>

        {showReauth && (
          <form className="space-y-4 mb-8" onSubmit={handleReauthAndChangeEmail}>
            <h3 className="text-base font-semibold text-red-400">Re-authenticate</h3>
            <input type="password" value={reauthPassword} onChange={(e) => setReauthPassword(e.target.value)} placeholder="Your password" className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white" />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-blue-700 text-white">Confirm</button>
              <button type="button" onClick={() => setShowReauth(false)} className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white">Cancel</button>
            </div>
          </form>
        )}

        {!isAdmin && user?.providerData[0]?.providerId === "password" && (
          <form className="space-y-5" onSubmit={handleChangePassword}>
            <h2 className="text-base sm:text-lg font-semibold text-gray-200">Change Password</h2>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white" />
            <button type="submit" disabled={passLoading} className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white">
              {passLoading ? <FaSpinner className="animate-spin inline mr-2" /> : "Update Password"}
            </button>
          </form>
        )}

        <div className="mt-10 border-t border-gray-700 pt-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <FaXTwitter /> Account
          </h2>
          {twitterProfile ? (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
              <div>
                <div className="text-sm sm:text-base font-medium text-white">@{twitterProfile.username}</div>
                <div className="text-xs text-gray-400">{twitterProfile.name}</div>
              </div>
              <button onClick={() => setShowDisconnectModal(true)} className="px-3 py-1.5 rounded bg-red-600 text-white text-sm font-semibold">Disconnect</button>
            </div>
          ) : (
            <button onClick={handleConnectTwitter} disabled={connectingTwitter} className="mt-4 flex items-center gap-2 px-4 py-2 rounded bg-white text-black font-semibold">
              {connectingTwitter ? <FaSpinner className="animate-spin" /> : <FaXTwitter />}
              {connectingTwitter ? "Connecting..." : "Connect X"}
            </button>
          )}
        </div>
      </div>
      <ConfirmDisconnectModal isOpen={showDisconnectModal} onClose={() => setShowDisconnectModal(false)} onConfirm={handleDisconnectTwitter} isDisconnecting={isDisconnecting} />
    </div>
  );
}