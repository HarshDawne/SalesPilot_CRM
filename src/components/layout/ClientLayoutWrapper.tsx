"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, MobileHeader } from "@/components/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CommandCenter } from "@/components/CommandCenter";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("salespilot_token");
    if (!token && pathname !== "/login") {
      router.replace("/login");
    } else if (token && pathname === "/login") {
      router.replace("/");
    } else {
      setIsReady(true);
    }
  }, [pathname, router]);

  if (!isReady) return null;

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <>
      <CommandCenter />
      <div className="flex h-screen overflow-hidden">
        {/* Navigation Layer */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* Application Layer */}
        <div className="flex-1 flex flex-col min-w-0 bg-bg-base overflow-hidden">
          <MobileHeader />
          <TopBar />
          
          <main className="flex-1 overflow-auto relative">
            {/* Visual Depth Overlay */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 min-h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
