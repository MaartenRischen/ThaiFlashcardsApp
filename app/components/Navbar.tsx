"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LogIn, User } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  // Don't show navbar on auth pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex flex-row items-center justify-between h-10 px-2 py-1 gap-2 overflow-x-auto whitespace-nowrap">
        {/* Donkey Home Icon */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center p-0 mr-2 hover:scale-105 transition-transform"
          aria-label="Home"
          style={{ minWidth: 32 }}
        >
          <Image src="/images/dblogo.svg" alt="Home" width={32} height={32} priority />
        </button>
        {/* Title: single responsive span, no duplicate */}
        <span className="flex-1 min-w-0 text-[0.6em] xs:text-[0.7em] md:text-[0.85em] text-gray-400 font-normal ml-2 align-middle">
          {status === "authenticated" && session?.user?.name
            ? `Ultra Personal Thai Language Experience For ${session.user.name}`
            : "Ultra Personal Thai Language Experience"}
        </span>
        <nav className="flex items-center gap-2 ml-2 flex-shrink-0">
          {status === "authenticated" ? (
            <>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "https://donkeybridge.world" })}
                className="p-1 h-7 w-7 md:h-8 md:w-8"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
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