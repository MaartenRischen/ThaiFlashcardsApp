'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient'; // Import supabase

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      // --- Call Supabase password reset --- 
      console.log('Attempting password reset for:', email);
      
      // Construct the redirect URL - ensure it points to your deployed login page
      const redirectUrl = window.location.origin + '/login'; 
      console.log('Redirect URL for password reset:', redirectUrl);

      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (supabaseError) {
        console.error("Supabase password reset error:", supabaseError);
        throw new Error(supabaseError.message || 'Failed to send reset link.');
      }
      // -------------------------------------
      
      setMessage('If an account exists for this email, a password reset link has been sent.');
      setEmail(''); 
      
    } catch (err: unknown) {
        console.error("Caught error during password reset:", err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="mx-auto space-y-6 w-full max-w-md">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-[#E0E0E0]">Reset Password</h1>
          <p className="text-[#BDBDBD]">
            Enter your email address to receive a password reset link.
          </p>
        </div>

        {message && (
          <div className="p-3 bg-[#2C2C2C] border border-[#404040] rounded-md text-[#BB86FC]">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 bg-[#2C2C2C] border border-red-900 rounded-md text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#E0E0E0]">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="neumorphic-input rounded-xl"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
        
        <div className="text-center">
            <p className="text-[#BDBDBD]">
              Remember your password?{" "}
              <Link href="/login" className="text-[#BB86FC] hover:underline">
                Back to Login
              </Link>
            </p>
        </div>

      </div>
    </div>
  );
} 