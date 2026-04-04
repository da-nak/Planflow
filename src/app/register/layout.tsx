import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/ThemeContext";

export const metadata: Metadata = {
  title: "PlanFlow - Register",
  description: "Create your PlanFlow account",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full font-sans">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
