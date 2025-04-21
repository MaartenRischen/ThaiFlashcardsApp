"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { LogOut, LogIn, User } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  // Don't show navbar on auth pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex flex-row items-center justify-between h-10 px-2 py-1 gap-2 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-1 font-medium text-xs text-gray-200 flex-shrink-0">
          <User className="w-4 h-4" aria-label="User" />
        </div>
        {/* Subtitle: always fits, shrinks on xs screens */}
        <span className="flex-1 min-w-0 text-[0.6em] xs:text-[0.7em] md:text-[0.85em] text-gray-400 font-normal ml-2 truncate md:hidden align-middle">
          Ultra-Personal Thai Learning
        </span>
        <span className="hidden md:inline text-[0.85em] text-gray-400 font-normal ml-2 truncate max-w-[200px] lg:max-w-xs align-middle">
          Super Personalized Thai Language Learning App
        </span>
        <nav className="flex items-center gap-2 ml-2 flex-shrink-0">
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
    </header>
  );
} 