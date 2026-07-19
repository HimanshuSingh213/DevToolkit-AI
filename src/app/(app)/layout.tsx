import "@/app/globals.css";
import NavBar from "@/components/NavBar";
import { ContextProvider } from "@/context/AppContext";
import { Toaster } from "sonner";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ContextProvider>
      <div className="h-screen w-full flex flex-col overflow-hidden antialiased bg-background">
        <NavBar />
        <Toaster theme="dark" closeButton richColors />
        <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </ContextProvider>
  );
}
