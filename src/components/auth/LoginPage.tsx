import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { Layers, ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
import { supabase, isClerkAuthMode } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const { setCurrentView, addToast } = useApp();
  const { isLoaded: isClerkSignInLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      if (!isClerkSignInLoaded || !signIn) {
        throw new Error('Authentication is initializing. Please try again.');
      }
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err: unknown) {
      console.error('Google Sign-In error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to sign in with Google.';
      setError(msg);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (isClerkSignInLoaded && signIn) {
        // Clerk authentication
        const result = await signIn.create({
          identifier: email.trim(),
          password,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          addToast('Signed in successfully', 'success');
          setCurrentView('dashboard');
          return;
        } else {
          console.warn('Clerk sign-in pending extra steps:', result.status);
          setError(`Additional verification required: ${result.status}`);
          return;
        }
      }

      if (!isClerkAuthMode) {
        // Fallback: legacy Supabase sign-in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        if (data.session) {
          addToast('Signed in successfully', 'success');
          setCurrentView('dashboard');
        }
      } else {
        setError('Authentication service is initializing. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      const clerkMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message;
      const msg = clerkMsg || (err instanceof Error ? err.message : 'An unexpected error occurred.');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col justify-center py-12 px-6 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => setCurrentView('landing')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316] flex items-center justify-center text-white shadow-sm">
            <Layers className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#171717] dark:text-[#FAFAFA]">
          Welcome back
        </h2>
        <p className="mt-1.5 text-center text-sm text-[#737373] dark:text-[#A3A3A3]">
          Sign in to continue to your workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#141414] py-8 px-6 shadow-xl border border-[#E5E5E5] dark:border-[#333333] rounded-3xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#1C1C1C] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] text-[#171717] dark:text-[#FAFAFA] font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#F97316]" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E5E5] dark:border-[#2E2E2E]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#141414] px-2 text-[#737373] dark:text-[#A3A3A3] font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#737373] dark:text-[#A3A3A3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E5E5E5] dark:border-[#333333] accent-[#F97316]"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setCurrentView('forgot_password')}
                className="font-semibold text-[#F97316] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-sm shadow-sm active:scale-95 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#737373] dark:text-[#A3A3A3]">
            Don't have an account?{' '}
            <button
              onClick={() => setCurrentView('signup')}
              className="font-bold text-[#F97316] hover:underline cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
