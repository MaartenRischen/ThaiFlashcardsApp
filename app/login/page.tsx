"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  });

  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    if (params.get("type") === "recovery") {
      console.log("Password recovery mode detected.");
      setIsRecoveryMode(true);
      setMessage("Please enter your new password.");
    }

    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("registered") === "true") {
      setMessage("Registration successful! Please log in.");
      router.replace("/login", undefined);
    }
  }, [router]);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: loginFormData.email,
        password: loginFormData.password,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong during login. Please try again.");
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
    }

    setIsLoading(true);
    try {
        console.log("Attempting to update password via Supabase...");
        const { data, error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            console.error("Supabase password update error:", updateError);
            throw new Error(updateError.message || "Failed to update password.");
        }

        console.log("Password updated successfully:", data);
        setMessage("Password successfully updated! You can now log in.");
        setNewPassword("");
        setConfirmPassword("");
        setIsRecoveryMode(false);
        router.replace("/login", undefined);

    } catch (err: any) {
        console.error("Caught error during password update:", err);
        setError(err.message || "An unexpected error occurred while updating your password.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="mx-auto space-y-6 w-full max-w-md">

        {isRecoveryMode ? (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">Set New Password</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Enter and confirm your new password below.
              </p>
            </div>

            {message && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
                {message}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                 <p className="text-xs text-gray-500">
                   Password must be at least 8 characters long
                 </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">Login</h1>
              <p className="text-gray-500 dark:text-gray-400">
                Enter your credentials to access your account
              </p>
            </div>

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                {message}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@example.com"
                  value={loginFormData.email}
                  onChange={handleLoginChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginFormData.password}
                  onChange={handleLoginChange}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Loading..." : "Sign In"}
              </Button>
            </form>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 