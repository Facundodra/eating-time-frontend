import type { Metadata } from "next";
import "typeface-inter";
import "@/css/globals.css";

import { THEME_STORAGE_KEY } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Eating Time",
  description: "All you can eat, all the time",
};

const themeScript = `
try {
  var theme = localStorage.getItem("${THEME_STORAGE_KEY}");
  var root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
} catch (_) {
  document.documentElement.classList.remove("dark");
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}
