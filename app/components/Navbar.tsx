"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import Image from 'next/image';
import Link from 'next/link';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser
} from "@clerk/nextjs";
import { useFeedback } from "../context/FeedbackContext";
import { Plus, Grid, Settings, HelpCircle, GalleryHorizontal, LogIn, LogOut } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { /* openFeedbackModal */ } = useFeedback();
  
  // Don't show navbar on auth pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="container flex flex-row items-center justify-between h-10 px-2 py-1 gap-2 overflow-x-auto whitespace-nowrap">
        {/* Home Icon */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center p-0 mr-1 hover:scale-105 transition-transform"
          aria-label="Home"
          style={{ minWidth: 32 }}
        >
          <Image 
            src="/images/logonobg-rev.png"
            alt="Home" 
            width={24}
            height={24} 
            className="rounded-sm"
          />
        </button>
        {/* Title: single responsive span, no duplicate */}
        <span className="flex-1 min-w-0 text-[0.6em] xs:text-[0.7em] md:text-[0.85em] text-gray-400 font-normal ml-2 align-middle">
          Ultra Personal Thai Language Learning Experience{user ? ` For ${user.firstName || user.username}` : ''}
        </span>
        <nav className="flex items-center gap-2 ml-auto flex-shrink-0">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="h-7 md:h-8">Sign In</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
} 