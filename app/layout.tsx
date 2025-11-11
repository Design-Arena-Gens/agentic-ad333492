import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucky Jet Crash Game Analysis",
  description: "Analyze Lucky Jet crash game patterns and statistics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">{children}</body>
    </html>
  );
}
