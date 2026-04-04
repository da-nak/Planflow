"use client";

import { ChatWidget } from "@/components/ai/ChatWidget";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
