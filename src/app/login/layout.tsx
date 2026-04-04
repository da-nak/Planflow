import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/ThemeContext";

export const metadata: Metadata = {
  title: "PlanFlow - Login",
  description: "Sign in to your PlanFlow account",
};

export default function LoginLayout({
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
