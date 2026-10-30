import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'

// Global unhandled error diagnostics
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[WorkNest Global Error]:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[WorkNest Unhandled Rejection]:', event.reason);
  });
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Root() {
  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#171717] dark:text-[#FAFAFA] flex flex-col items-center justify-center p-6 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-[#141414] p-8 rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316] flex items-center justify-center text-white mx-auto shadow-md">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Clerk Configuration Required</h2>
          <p className="text-sm text-[#737373] dark:text-[#A3A3A3]">
            WorkNest requires <code className="px-1.5 py-0.5 rounded bg-[#F5F5F5] dark:bg-[#262626] text-[#F97316] font-mono text-xs">VITE_CLERK_PUBLISHABLE_KEY</code> to initialize Clerk Authentication (Application ID: <code className="text-xs font-mono">app_3LOEzTZ89ZmDHCa2BxXwtSrMd8w</code>).
          </p>
          <div className="p-3 bg-[#FAFAFA] dark:bg-[#1C1C1C] rounded-xl border border-[#E5E5E5] dark:border-[#2E2E2E] text-left text-xs text-[#737373] dark:text-[#A3A3A3] space-y-1 font-mono">
            <div># Add to .env:</div>
            <div className="text-[#171717] dark:text-[#FAFAFA] font-bold">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</div>
          </div>
          <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">
            Restart your Vite dev server after adding your publishable key.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

