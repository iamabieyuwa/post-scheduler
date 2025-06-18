import './globals.css';
import { Toaster } from "react-hot-toast";
import NavbarWrapper from "./components/NavbarWrapper";
import PageWrapper from './components/PageWrapper';
import { AuthProvider } from "./context/AuthContext";

import { Inter } from "next/font/google";
export const metadata = {
  title: "PostPilot",
  description: "Schedule your posts with ease.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-black text-white min-h-screen font-sans">
        <Toaster position="top-right" toastOptions={{ className: "text-sm" }} />
        <NavbarWrapper />
        {/* 💡 Center children fully if homepage, else apply navbar spacing */}
       <AuthProvider><PageWrapper>{children}</PageWrapper></AuthProvider>
      </body>
    </html>
  );
}
