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
      <div className="container flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {status === "authenticated" && session?.user?.name ? 
            session.user.name : 
            "Guest"}
        </Link>
        
        <nav className="flex items-center gap-4">
          {status === "authenticated" ? (
            <>
              <div className="hidden md:flex items-center gap-6 mr-4">
                <Link href="/my-sets" className="text-sm font-medium transition-colors hover:text-primary">
                  My Sets
                </Link>
                <Link href="/set-wizard" className="text-sm font-medium transition-colors hover:text-primary">
                  Set Wizard
                </Link>
                <Link href="/example-wizard" className="text-sm font-medium transition-colors hover:text-primary">
                  Example Wizard
                </Link>
                <Link href="/profile" className="text-sm font-medium transition-colors hover:text-primary">
                  Profile
                </Link>
              </div>
              <Button 
                variant="outline" 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium transition-colors hover:text-primary">
                Sign In
              </Link>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
} 