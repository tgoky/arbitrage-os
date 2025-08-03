// components/Breadcrumb.tsx
"use client";

import { useBreadcrumb } from "@refinedev/core";
import Link from "next/link";
import { useTheme } from "../../providers/ThemeProvider"; // Updated import path

export const Breadcrumb = () => {
  const { breadcrumbs } = useBreadcrumb();
  const { theme } = useTheme();

  return (
    <ul className={`breadcrumb ${theme === 'dark' ? 'dark:text-gray-200' : 'text-gray-800'}`}>
      {breadcrumbs.map((breadcrumb) => (
        <li key={`breadcrumb-${breadcrumb.label}`}>
          {breadcrumb.href ? (
            <Link 
              href={breadcrumb.href}
              className={`${theme === 'dark' ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-800'}`}
            >
              {breadcrumb.label}
            </Link>
          ) : (
            <span>{breadcrumb.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
};