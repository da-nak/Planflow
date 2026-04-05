import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";
import { TourProvider } from "@/lib/tour/TourContext";
import { Tour, TourTrigger } from "@/components/tour/Tour";
import { Sidebar } from "@/components/layout/Sidebar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "PlanFlow - Personal Planning & Analytics",
  description: "Manage your life across multiple time horizons",
};

export const dynamic = 'force-dynamic';

function TourWrapper() {
  return (
    <>
      <Tour />
      <TourTrigger />
    </>
  );
}

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
          <TourProvider>
            <div className="flex min-h-screen">
              <Sidebar userName={user?.user_metadata?.name} />
              <main className="flex-1 lg:ml-64">
                {children}
              </main>
            </div>
            <TourWrapper />
          </TourProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
