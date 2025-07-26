"use client";

import { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, provider, db } from "./lib/firebase";
import toast from "react-hot-toast";
import { Typewriter } from "react-simple-typewriter";
import { FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

async function redirectAfterAuth(user, router) {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    let connected = false;
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (
        data.connectedAccounts &&
        data.connectedAccounts.twitter &&
        data.connectedAccounts.instagram
      ) {
        connected = true;
      }
    }
    if (connected) {
      router.push("/dashboard");
    } else {
      router.push("/connect");
    }
  } catch (err) {
    router.push("/connect");
  }
}

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && typeof window !== "undefined") {
      if (user.emailVerified) {
        redirectAfterAuth(user, router);
      }
      // else: do nothing, let user see the login page and the error message
    }
  }, [user, router]);

  const validatePassword = (pass) => {
    const errors = [];
    if (pass.length < 8) errors.push("8 characters minimum");
    if (!/[A-Z]/.test(pass)) errors.push("at least one uppercase letter");
    if (!/[a-z]/.test(pass)) errors.push("at least one lowercase letter");
    if (!/[0-9]/.test(pass)) errors.push("at least one number");
    return errors;
  };

  // Google sign in
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      toast.success("Signed in with Google");
      setEmail("");
      setPassword("");
      sessionStorage.setItem("justSignedIn", "true");
      await redirectAfterAuth(result.user, router);
    } catch (err) {
      toast.error(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  // Email/password login, redirect to settings if not verified
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEmailError("");
    setPasswordError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) {
        toast.error("Please verify your email before continuing. You will be redirected to settings.");
        setLoading(false);
        router.push("/settings");
        return;
      }
      toast.success("Logged in successfully");
      setEmail("");
      setPassword("");
      sessionStorage.setItem("justSignedIn", "true");
      await redirectAfterAuth(result.user, router);
    } catch (err) {
      toast.error(err.message || "Email login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEmailError("");
    setPasswordError("");
    setConfirmError("");

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      setEmailError("Invalid email address");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      setLoading(false);
      return;
    }

    const passErrors = validatePassword(password);
    if (passErrors.length > 0) {
      setPasswordError("Password must have: " + passErrors.join(", "));
      setLoading(false);
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      toast.success("Account created! Please check your email for a verification link.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setMode("login");
    } catch (err) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // Login screen
  // Show login/signup form if user is not signed in, or if signed in but not verified
  if (!user || (user && !user.emailVerified)) {
    return (
      <div
        className="w-full min-h-screen flex flex-col items-center justify-center align-center"
        style={{ backgroundColor: "#000", fontFamily: "Inter, sans-serif" }}
      >
        <h1 className="text-5xl font-semibold text-center mb-2 text-white">
          Post<span className="text-blue-500">Pilot</span>
        </h1>
        <p className="text-gray-400 text-center mb-8 max-w-md text-lg">
          Schedule your posts across platforms —{" "}
          <span className="text-white font-semibold">
            <Typewriter
              words={["with ease.", "powered by automation.", "like a pro."]}
              loop
              cursor
              cursorStyle="|"
              typeSpeed={60}
              deleteSpeed={30}
              delaySpeed={2000}
            />
          </span>
        </p>
        {/* Email/password login */}
        <form
          onSubmit={mode === "signup" ? handleEmailSignUp : handleEmailLogin}
          className="w-full max-w-xs space-y-4 text-white"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 pr-10 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-white"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}

          {mode === "signup" && (
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                disabled={loading}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmError) setConfirmError("");
                }}
                required
                className="w-full px-4 py-2 pr-10 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
              {confirmError && (
                <p className="text-red-500 text-sm mt-1">{confirmError}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <FaSpinner className="animate-spin text-white text-lg" />
            ) : mode === "signup" ? (
              "Create Account"
            ) : (
              "Login"
            )}
          </button>

          {/* Toggle Login/Signup Mode */}
          <p className="text-sm text-center text-gray-400 mt-2">
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-blue-400 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-blue-400 hover:underline"
                >
                  Login
                </button>
              </>
            )}
          </p>
        </form>

        {/* Google login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full max-w-xs h-12 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition mt-4"
        >
          <FcGoogle className="text-xl" />
          <span className="text-base font-semibold">Sign in with Google</span>
        </button>
      </div>
    );
  }
  // While checking user or redirecting, show spinner
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <FaSpinner className="text-white text-2xl animate-spin" />
    </div>
  );
}