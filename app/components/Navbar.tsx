"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { LogOut, LogIn } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  // Don't show navbar on auth pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex flex-col md:flex-row items-center justify-between h-auto md:h-9 px-2 py-1 md:py-0">
        <div className="flex items-center gap-1 font-medium text-xs text-gray-200">
          <Link href="/">
          {status === "authenticated" && session?.user?.name ? 
            session.user.name : 
            "Guest"}
        </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:gap-2 w-full md:w-auto">
          <span className="block text-[0.7em] md:text-[0.85em] text-gray-400 font-normal text-center md:text-left md:ml-4 md:mb-0 mb-1 md:order-none order-2 leading-tight max-w-xs sm:max-w-md break-words whitespace-pre-line">
            Super Personalized Thai Language Learning App
          </span>
          <nav className="flex items-center gap-2 md:ml-4 md:order-none order-3">
          {status === "authenticated" ? (
            <>
              <div className="hidden md:flex items-center gap-3 mr-2">
                <Link href="/my-sets" className="text-xs font-medium transition-colors hover:text-primary">
                  My Sets
                </Link>
              </div>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "https://donkeybridge.world" })}
                className="p-1 h-7 w-7 md:h-8 md:w-8"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline ml-1">Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="p-1 h-7 w-7 md:h-8 md:w-8"
                aria-label="Sign In or Register"
              >
                <Link href="/login">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden md:inline ml-1">Sign In</span>
                </Link>
              </Button>
            </>
          )}
        </nav>
        </div>
      </div>
    </header>
  );
} 