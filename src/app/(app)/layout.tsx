import "@/app/globals.css";
import NavBar from "@/components/NavBar";
import { ContextProvider } from "@/context/AppContext";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <ContextProvider>
        <main
          className={`h-full antialiased`}
        >
          <NavBar />
          <Toaster theme="dark" closeButton richColors />
          <body className="min-h-full flex flex-col">{children}</body>
        </main>
      </ContextProvider>
    </SessionProvider>
  );
}
