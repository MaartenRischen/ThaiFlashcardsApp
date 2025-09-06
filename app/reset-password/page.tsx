'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Add your password reset logic here
      setMessage('Password reset successful');
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-6 w-full max-w-md">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold text-[#E0E0E0]">Reset Password</h1>
        <p className="text-[#BDBDBD]">
          Enter your new password below.
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
          <Label htmlFor="password" className="text-[#E0E0E0]">New Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="neumorphic-input rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-[#E0E0E0]">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className="neumorphic-input rounded-xl"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
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
  );
} 