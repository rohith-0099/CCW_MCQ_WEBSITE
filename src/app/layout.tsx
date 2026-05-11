import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CCW MCQ Practice",
  description: "Practice and mock tests for ADT308 coursework.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
