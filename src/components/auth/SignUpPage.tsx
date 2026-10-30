import React, { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { Layers, ArrowLeft, Mail, Lock, User, Loader2, KeyRound } from 'lucide-react';
import { supabase, isClerkAuthMode } from '../../lib/supabase';

export const SignUpPage: React.FC = () => {
  const { setCurrentView, addToast } = useApp();
  const { isLoaded: isClerkSignUpLoaded, signUp, setActive } = useSignUp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Email verification state for Clerk requirement flows
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleGoogleSignUp = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      if (!isClerkSignUpLoaded || !signUp) {
        throw new Error('Authentication is initializing. Please try again.');
      }
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err: unknown) {
      console.error('Google Sign-Up error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to sign up with Google.';
      setError(msg);
      setIsGoogleLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    if (!isClerkSignUpLoaded || !signUp) return;

    setIsVerifying(true);
    setError('');
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        addToast('Account created successfully! Welcome to WorkNest.', 'success');
        setCurrentView('dashboard');
      } else {
        setError(`Verification status: ${completeSignUp.status}. Please check details.`);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const clerkMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message;
      const msg = clerkMsg || (err instanceof Error ? err.message : 'Invalid verification code.');
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setIsLoading(true);
    try {
      if (isClerkSignUpLoaded && signUp) {
        const parts = fullName.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        const result = await signUp.create({
          emailAddress: email.trim(),
          password,
          firstName,
          lastName,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          addToast('Account created successfully! Welcome to WorkNest.', 'success');
          setCurrentView('dashboard');
          return;
        } else if (result.status === 'missing_requirements') {
          // Send verification code to email
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setPendingVerification(true);
          addToast('Verification code sent to your email.', 'info');
          return;
        } else {
          setError(`Sign up status: ${result.status}`);
          return;
        }
      }

      if (!isClerkAuthMode) {
        // Fallback: legacy Supabase sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session) {
          addToast('Account created successfully! Welcome to WorkNest.', 'success');
          setCurrentView('dashboard');
        } else {
          addToast(
            'Account created! Please check your email to verify your account.',
            'success'
          );
          setCurrentView('login');
        }
      } else {
        setError('Authentication service is initializing. Please try again.');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      const clerkMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message;
      const msg = clerkMsg || (err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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
          {pendingVerification ? 'Verify your email' : 'Create your WorkNest account'}
        </h2>
        <p className="mt-1.5 text-center text-sm text-[#737373] dark:text-[#A3A3A3]">
          {pendingVerification
            ? `Enter the 6-digit code sent to ${email}`
            : 'Start organizing your work and collaborating with your team.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#141414] py-8 px-6 shadow-xl border border-[#E5E5E5] dark:border-[#333333] rounded-3xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {pendingVerification ? (
            /* Email verification code step */
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                  Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] tracking-widest font-mono text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-sm shadow-sm active:scale-95 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Complete Sign Up'
                )}
              </button>

              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="w-full text-center text-xs text-[#737373] dark:text-[#A3A3A3] hover:underline cursor-pointer"
              >
                Back to registration details
              </button>
            </form>
          ) : (
            <>
              {/* Google Sign-Up Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
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
                <span>Sign up with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E5E5] dark:border-[#2E2E2E]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-[#141414] px-2 text-[#737373] dark:text-[#A3A3A3] font-medium">
                    Or register with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                    />
                  </div>
                </div>

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

                <div>
                  <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3] absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 rounded border-[#E5E5E5] dark:border-[#333333] accent-[#F97316] cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-[#737373] dark:text-[#A3A3A3] cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="font-semibold text-[#F97316] hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="font-semibold text-[#F97316] hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-sm shadow-sm active:scale-95 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-[#737373] dark:text-[#A3A3A3]">
                Already have an account?{' '}
                <button
                  onClick={() => setCurrentView('login')}
                  className="font-bold text-[#F97316] hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
