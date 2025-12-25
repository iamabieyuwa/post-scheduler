"use client";

import { usePathname } from "next/navigation";

export default function PageWrapper({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    // 1. main is now a flex column that spans the full height
    <main className="min-h-screen flex flex-col w-full px-4">
      
      {/* 2. This wrapper grows to fill all space, pushing the footer down */}
      <div 
        className={`flex-grow w-full flex flex-col ${
          isHome 
            ? "justify-center items-center" // Centers content only on Home
            : "pt-20" // Standard padding for other pages
        }`}
      >
        {children}
      </div>

      {/* 3. Footer now stays at the bottom regardless of content size */}
      <footer className="w-full py-6 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} PostPilot. Built with ❤️ by
          <span className="text-blue-500 font-bold ml-1">Abieyuwa Imina</span>
        </p>
      </footer>
    </main>
  );
}