import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { supabase, isClerkAuthMode } from '../../lib/supabase';
import { ArrowLeft, Mail, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Logo } from '../common/Logo';

export const ForgotPasswordPage: React.FC = () => {
  const { setCurrentView } = useApp();
  const { isLoaded: isClerkSignInLoaded, signIn } = useSignIn();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setIsLoading(true);

    try {
      if (isClerkSignInLoaded && signIn) {
        await signIn.create({
          strategy: 'reset_password_email_code',
          identifier: email.trim(),
        });
        setSubmitted(true);
        return;
      }

      if (!isClerkAuthMode) {
        // Fallback: legacy Supabase reset
        const redirectUrl = window.location.origin;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectUrl,
        });

        if (resetError) {
          setError(resetError.message);
        } else {
          setSubmitted(true);
        }
      } else {
        setError('Password reset is not supported in this mode. Please sign in with Google or your Clerk credentials.');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      const clerkMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message;
      setError(clerkMsg || (err instanceof Error ? err.message : 'Failed to send password reset email. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] flex flex-col justify-center py-12 px-6 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => setCurrentView('login')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </button>

        <div className="flex justify-center mb-1">
          <Logo variant="icon" size="xl" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#171717] dark:text-[#FAFAFA]">
          Reset your password
        </h2>
        <p className="mt-1.5 text-center text-sm text-[#737373] dark:text-[#A3A3A3]">
          Enter your email address and we'll help you reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#141414] py-8 px-6 shadow-xl border border-[#E5E5E5] dark:border-[#333333] rounded-3xl">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">Reset Instructions Sent!</h3>
              <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">
                We've sent password reset instructions to <strong className="text-[#171717] dark:text-[#FAFAFA]">{email}</strong>. Please check your inbox.
              </p>
              <button
                onClick={() => setCurrentView('login')}
                className="w-full py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-600 dark:text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] disabled:opacity-60 text-white font-bold text-sm shadow-sm active:scale-95 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
