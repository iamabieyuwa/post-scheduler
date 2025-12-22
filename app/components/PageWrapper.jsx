"use client";

import { usePathname } from "next/navigation";

export default function PageWrapper({ children }) {
  const pathname = usePathname();

  const isHome = pathname === "/";

  return (
    <main
      className={`min-h-screen w-full px-4 ${
        isHome
          ? "flex items-center justify-center" // Centered for auth page
          : "pt-20" // Space for fixed navbar
      }`}
    >
      {children}
      
      <footer className="w-full py-10 mt-20 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} PostPilot. Built with ❤️ by
          <span className="text-blue-500 font-bold ml-1">Abieyuwa Imina</span>
        </p>
      </footer>
    </main>
  );
}
