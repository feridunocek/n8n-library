import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SettingsProvider } from "@/lib/contexts/settings-context";
import { WorkflowProvider } from "@/lib/contexts/workflow-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "N8N Workflow Hub",
  description: "AI-Powered N8N Workflow Manager",
};

import { getWorkflowsAction } from "@/lib/actions";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialWorkflows = await getWorkflowsAction();

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased flex h-screen overflow-hidden bg-background text-foreground font-sans" suppressHydrationWarning>
        <SettingsProvider>
          <WorkflowProvider initialWorkflows={initialWorkflows}>
            <Suspense fallback={<div className="w-64 bg-card border-r border-border h-full" />}>
              <Sidebar />
            </Suspense>
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
              {/* Glassmorphism background effect - optional cosmetic */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none -z-10" />

              <Suspense fallback={<div className="h-16 border-b border-border bg-background/50" />}>
                <Header />
              </Suspense>
              <div className="flex-1 overflow-y-auto w-full p-6">
                {children}
              </div>
            </main>
          </WorkflowProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
