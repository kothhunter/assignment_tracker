import type { Metadata } from "next";
import "@/styles/globals.css";
import { TRPCReactProvider } from "@/lib/trpc-provider";
import { AuthProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Assignment Tracker",
  description: "AI-powered assignment management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}