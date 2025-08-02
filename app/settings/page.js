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
import { generateCodeVerifier, generateCodeChallenge } from "../utils/pkce"
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import ConfirmDisconnectModal from "../settings/ConfirmDisconnectModal"

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


  // Reload user to check verification status
  const handleCheckVerified = async () => {
    if (!user) return;
    setVerifyLoading(true);
    try {
      await user.reload();
      if (auth.currentUser.emailVerified) {
        setShowVerifyReminder(false);
        toast.success("Email verified!");
      } else {
        toast.error(
          "Email is still not verified. Please check your inbox and click the verification link."
        );
      }
    } catch (err) {
      if (err.code === "auth/user-token-expired") {
        toast.error("Your session has expired. Please login again.");
        await auth.signOut();
        window.location.href = "/"; // or your login route
        return;
      } else {
        toast.error(err.message || "An error occurred.");
      }
    }
    setVerifyLoading(false);
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!user) return;
    setVerifyLoading(true);
    try {
      await sendEmailVerification(user);
      toast.success("Verification email sent!");
    } catch (err) {
      if (err.code === "auth/user-token-expired") {
        toast.error("Your session has expired. Please login again.");
        await auth.signOut();
        window.location.href = "/";
        return;
      } else {
        toast.error("Failed to send verification email.");
      }
    }
    setVerifyLoading(false);
  };

  // Change Email (with verifyBeforeUpdateEmail)
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!newEmail || newEmail === currentEmail) {
      toast.error("Please enter a new email.");
      return;
    }
    setEmailLoading(true);
    try {
      // Only works for email/password users
      if (user.providerData[0]?.providerId !== "password") {
        throw new Error(
          "You signed up using Google. Please use Google Account settings to change your email."
        );
      }
      await verifyBeforeUpdateEmail(user, newEmail);
      setNewEmail("");
      setShowVerifyReminder(true);
      toast.success(
        "A verification link has been sent to your new email address. Your email will update after clicking the link in your new inbox."
      );
    } catch (err) {
      if (
        err.code === "auth/requires-recent-login" ||
        err.message?.includes("recent authentication")
      ) {
        setShowReauth(true);
        setPendingEmail(newEmail);
        toast.error("Please re-enter your password to confirm this change.");
      } else if (err.code === "auth/user-token-expired") {
        toast.error("Your session has expired. Please login again.");
        await auth.signOut();
        window.location.href = "/";
        return;
      } else {
        toast.error(err.message || "Failed to update email.");
      }
    }
    setEmailLoading(false);
  };

  const handleConnectTwitter = async () => {
  if (!user) return;
  try {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem("twitter_code_verifier", verifier);
    document.cookie = `twitter_code_verifier=${verifier}; path=/`;
    const token = await user.getIdToken();
    document.cookie = `firebase_token=${token}; path=/`;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
      redirect_uri: "http://post-scheduler-pearl.vercel.app/api/twitter/callback",
      scope: "tweet.read tweet.write users.read offline.access",
      state: "secureState123",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    window.location.href = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  } catch (err) {
    console.error("Twitter PKCE error", err);
    toast.error("Failed to initiate Twitter connection.");
  }
};


  // Re-authenticate and retry email change
  const handleReauthAndChangeEmail = async (e) => {
    e.preventDefault();
    if (!user) return;
    setEmailLoading(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        reauthPassword
      );
      await reauthenticateWithCredential(user, credential);
      await verifyBeforeUpdateEmail(user, pendingEmail);
      setNewEmail("");
      setPendingEmail("");
      setReauthPassword("");
      setShowReauth(false);
      setShowVerifyReminder(true);
      toast.success(
        "A verification link has been sent to your new email address. Your email will update after clicking the link in your new inbox."
      );
    } catch (err) {
      if (err.code === "auth/user-token-expired") {
        toast.error("Your session has expired. Please login again.");
        await auth.signOut();
        window.location.href = "/";
        return;
      } else {
        toast.error(err.message || "Re-authentication failed.");
      }
    }
    setEmailLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setPassLoading(true);
    try {
      await updatePassword(user, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated!");
    } catch (err) {
      if (err.code === "auth/user-token-expired") {
        toast.error("Your session has expired. Please login again.");
        await auth.signOut();
        window.location.href = "/";
        return;
      } else {
        toast.error(err.message || "Failed to update password.");
      }
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
              <svg
                className="w-4 h-4 mr-1 opacity-80"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l1.8 5.4H19l-4.5 3.3 1.8 5.4L12 13.8l-4.5 3.3 1.8-5.4L5 7.4h5.2L12 2z" />
              </svg>
              Admin
            </span>
          )}
        </div>

        {/* Email Verification Reminder */}
        {showVerifyReminder && (
          <div className="bg-yellow-900/40 border border-yellow-500 text-yellow-300 rounded-lg mb-6 px-4 py-3">
            <div className="flex justify-between items-center gap-2">
              <div>
                <strong>Your email is not verified.</strong>
                <div className="text-sm mt-1">
                  Please check your inbox for a verification link or resend
                  below. Some settings may be restricted until you verify your
                  email.
                </div>
              </div>
              <FaSpinner
                className={`ml-2 animate-spin ${
                  verifyLoading ? "inline" : "hidden"
                }`}
              />
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleResendVerification}
                disabled={verifyLoading}
                className="px-3 py-1 rounded bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
              >
                Resend Verification Email
              </button>
              <button
                onClick={handleCheckVerified}
                disabled={verifyLoading}
                className="px-3 py-1 rounded bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
              >
                I&apos;ve Verified My Email
              </button>
            </div>
          </div>
        )}

        {/* Change Email */}
        <form className="space-y-5 mb-10" onSubmit={handleChangeEmail}>
          <h2 className="text-base sm:text-lg font-semibold mb-1 text-gray-200">
            Change Email
          </h2>
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1">
              Current Email
            </label>
            <input
              type="email"
              value={currentEmail}
              disabled
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-gray-400 cursor-not-allowed text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1">
              New Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={isAdmin}
              className={`w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm ${
                isAdmin ? "opacity-80 cursor-not-allowed" : ""
              }`}
              placeholder="New email"
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={isAdmin || emailLoading}
            className={`w-full px-4 py-2 rounded-lg font-semibold shadow transition mt-1
              ${
                isAdmin
                  ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              } text-sm`}
          >
            {emailLoading ? (
              <FaSpinner className="animate-spin inline mr-2" />
            ) : null}
            {emailLoading ? "Updating..." : "Update Email"}
          </button>
        </form>

        {/* Re-authenticate Modal */}
        {showReauth && (
          <form
            className="space-y-4 mb-8"
            onSubmit={handleReauthAndChangeEmail}
          >
            <h3 className="text-base font-semibold text-red-400">
              Re-authenticate
            </h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Please enter your password to confirm this change:
              </label>
              <input
                type="password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs"
                placeholder="Your password"
                autoComplete="current-password"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={emailLoading}
                className="flex-1 px-4 py-2 rounded-lg font-semibold shadow transition bg-blue-700 hover:bg-blue-600 text-white text-sm"
              >
                {emailLoading ? (
                  <FaSpinner className="animate-spin inline mr-2" />
                ) : null}
                Re-authenticate & Update Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReauth(false);
                  setReauthPassword("");
                  setPendingEmail("");
                }}
                className="flex-1 px-4 py-2 rounded-lg font-semibold shadow transition bg-gray-700 hover:bg-gray-600 text-white text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Change Password */}
        {!isAdmin && user?.providerData[0]?.providerId === "password" && (
          <form className="space-y-5" onSubmit={handleChangePassword}>
            <h2 className="text-base sm:text-lg font-semibold mb-1 text-gray-200">
              Change Password
            </h2>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                placeholder="New password"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs sm:text-sm"
                placeholder="Confirm password"
                autoComplete="new-password"
              />
            </div>
           
            <button
              type="submit"
              disabled={passLoading}
              className="w-full px-4 py-2 rounded-lg font-semibold shadow transition mt-1 bg-gray-700 hover:bg-gray-600 text-white text-sm"
            >
              {passLoading ? (
                <FaSpinner className="animate-spin inline mr-2" />
              ) : null}
              {passLoading ? "Updating..." : "Update Password"}
            </button>
      


          </form>
        )}

               <div className="mt-10 border-t border-gray-700 pt-6">
  <h2 className="text-base sm:text-lg font-semibold text-gray-200 mb-3 ">
  <div className="flex items-center gap-2">
     <FaXTwitter /> Account
  </div>
  </h2>

  {twitterProfile ? (
    // Connected UI
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
      <div>
        <div className="text-sm sm:text-base font-medium text-white">
          @{twitterProfile.username}
        </div>
        <div className="text-xs text-gray-400">{twitterProfile.name}</div>
      </div>
     <button
  onClick={() => setShowDisconnectModal(true)}
  className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-sm font-semibold text-white"
>
  Disconnect
</button>

<ConfirmDisconnectModal
  isOpen={showDisconnectModal}
  onClose={() => setShowDisconnectModal(false)}
  onConfirm={handleDisconnectTwitter}
  isDisconnecting={isDisconnecting}
/>

    </div>
  ) : (
    // Reconnect button
   <button
    onClick={handleConnectTwitter}
    disabled={connectingTwitter}
    className="mt-4 flex items-center gap-2 px-4 py-2 rounded bg-white text-black font-semibold hover:bg-gray-200 transition"
  >
    {connectingTwitter && <FaSpinner className="animate-spin text-black" />}
    {!connectingTwitter && <FaXTwitter className="text-black" />}
    {connectingTwitter ? "Connecting..." : "Connect X"}
  </button>

  )}
</div>
      </div>
    </div>
  );
}