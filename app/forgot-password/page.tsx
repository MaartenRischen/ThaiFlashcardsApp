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
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Enter your email address to receive a password reset link.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
        
        <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </p>
        </div>

      </div>
    </div>
  );
} 