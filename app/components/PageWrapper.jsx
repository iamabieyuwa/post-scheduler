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
    </main>
  );
}
