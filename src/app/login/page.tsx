'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!fullName) {
          toast.error('Full Name is required for sign up');
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });
        if (error) throw error;
        toast.success('Sign up successful! Please check your email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Logged in successfully!');
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl sm:rounded-2xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
          <h3 className="text-xl font-semibold">{isSignUp ? 'Create an Account' : 'Welcome to DocLens'}</h3>
          <p className="text-sm text-gray-500">
            {isSignUp ? 'Sign up to manage your medical history securely.' : 'Log in to continue.'}
          </p>
        </div>
        <form onSubmit={handleAuth} className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16">
          {isSignUp && (
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {isSignUp && (
            <div className="flex flex-col space-y-2 mt-2">
              <Label>I am a:</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="PATIENT"
                    checked={role === 'PATIENT'}
                    onChange={() => setRole('PATIENT')}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Patient</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="DOCTOR"
                    checked={role === 'DOCTOR'}
                    onChange={() => setRole('DOCTOR')}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Doctor</span>
                </label>
              </div>
            </div>
          )}

          <Button disabled={isLoading} type="submit" className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            {isLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
