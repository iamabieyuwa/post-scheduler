// components/Breadcrumb.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const getHref = (index) => {
    return "/" + segments.slice(0, index + 1).join("/");
  };

  return (
    <nav className="text-sm text-gray-400 mb-4">
      <ol className="flex flex-wrap items-center space-x-2">
        <li>
          <Link href="/" className="hover:underline text-blue-400">
            Home
          </Link>
        </li>
        {segments.map((segment, index) => (
          <li key={index} className="flex items-center space-x-2">
            <span className="mx-1">/</span>
            <Link
              href={getHref(index)}
              className={`capitalize ${
                index === segments.length - 1
                  ? "text-white font-semibold"
                  : "text-blue-400 hover:underline"
              }`}
            >
              {decodeURIComponent(segment)}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
