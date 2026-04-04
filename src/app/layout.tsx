import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { LayoutWrapper } from "@/components/ai/LayoutWrapper";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "PlanFlow - Personal Planning & Analytics",
  description: "Manage your life across multiple time horizons",
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full font-sans">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar userName={user?.user_metadata?.name} />
            <main className="flex-1 lg:ml-64">
              <LayoutWrapper>{children}</LayoutWrapper>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
