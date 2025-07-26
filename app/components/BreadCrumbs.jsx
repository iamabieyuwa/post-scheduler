"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

function humanize(segment) {
  // Capitalize, replace -/_ with space, handle id-like segments
  if (/^\d+$/.test(segment)) return `#${segment}`;
  if (/^[0-9a-f]{20,}$/.test(segment)) return "Detail";
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const generatePath = (index) => {
    return "/" + segments.slice(0, index + 1).join("/");
  };

  return (
    <nav
      className="w-full px-3 py-2 rounded-lg bg-gray-900/70 border border-gray-800 shadow-sm overflow-x-auto"
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap gap-x-1 items-center text-sm whitespace-nowrap">
        <li className="flex items-center">
          <Link href="/" className="flex items-center gap-1 text-blue-400 hover:underline font-medium">
            <svg
              className="w-4 h-4 inline-block mr-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h4m10-11v10a1 1 0 01-1 1h-4" />
            </svg>
            Home
          </Link>
        </li>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const path = generatePath(index);
          const label = humanize(segment);

          return (
            <Fragment key={index}>
              <li className="flex items-center select-none">
                <svg
                  className="w-4 h-4 mx-1 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li className="flex items-center">
                {isLast ? (
                  <span className="text-white font-semibold">{label}</span>
                ) : (
                  <Link
                    href={path}
                    className="text-blue-400 hover:underline font-medium transition"
                  >
                    {label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}