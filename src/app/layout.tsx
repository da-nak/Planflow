import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "PlanFlow - Personal Planning & Analytics",
  description: "Manage your life across multiple time horizons",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full font-sans">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar userName={session?.user?.name} />
            <main className="flex-1 lg:ml-64">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
