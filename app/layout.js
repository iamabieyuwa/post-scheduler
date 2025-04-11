// ✅ app/layout.js
import './globals.css'
import { Toaster } from "react-hot-toast";
export const metadata = {
  title: "Post Scheduler",
  description: "Schedule your posts with ease.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white min-h-screen font-sans ">
      <Toaster position="top-right" toastOptions={{ className: "text-sm" }} />
        <main className="flex items-center justify-center min-h-screen p-4">
          {children}
        </main>
      </body>
    </html>
  );
}