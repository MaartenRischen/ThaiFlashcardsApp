"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  // Don't show navbar on auth pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex items-center justify-between h-9 px-2">
        <Link href="/" className="flex items-center gap-1 font-medium text-xs text-gray-200">
          {status === "authenticated" && session?.user?.name ? 
            session.user.name : 
            "Guest"}
        </Link>
        <nav className="flex items-center gap-2">
          {status === "authenticated" ? (
            <>
              <div className="hidden md:flex items-center gap-3 mr-2">
                <Link href="/my-sets" className="text-xs font-medium transition-colors hover:text-primary">
                  My Sets
                </Link>
              </div>
              <Button 
                variant="outline" 
                onClick={() => signOut({ callbackUrl: "https://donkeybridge.world" })}
                className="text-xs px-2 py-1 h-7 min-w-0"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-medium transition-colors hover:text-primary">
                Sign In
              </Link>
              <Button asChild className="text-xs px-2 py-1 h-7 min-w-0">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
} 