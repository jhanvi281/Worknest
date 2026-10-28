/* TEMPORARY SUPABASE CONNECTION TEST - REMOVE AFTER VERIFICATION */
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const SupabaseConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkConnection() {
      try {
        // Simple lightweight request using existing Supabase client to test reachability
        const { error } = await supabase.from('_supabase_connection_test').select('*').limit(0);

        if (!isMounted) return;

        // If fetch failed due to invalid host/network error
        if (error && (error.message.includes('Failed to fetch') || error.message.includes('Invalid URL') || error.message.includes('fetch failed'))) {
          setStatus('failed');
          setErrorMsg(error.message);
        } else {
          // If project is reachable (returns 200 or API error like relation does not exist), connection is valid
          setStatus('connected');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setStatus('failed');
        if (err instanceof Error) {
          setErrorMsg(err.message);
        }
      }
    }

    checkConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg shadow-md border transition-all pointer-events-auto"
      style={{
        backgroundColor: status === 'connected' ? '#ecfdf5' : status === 'failed' ? '#fef2f2' : '#f8fafc',
        borderColor: status === 'connected' ? '#a7f3d0' : status === 'failed' ? '#fecaca' : '#e2e8f0',
        color: status === 'connected' ? '#047857' : status === 'failed' ? '#b91c1c' : '#475569',
      }}
    >
      {status === 'checking' && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
          <span>Testing Supabase connection...</span>
        </>
      )}
      {status === 'connected' && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Supabase Connected</span>
        </>
      )}
      {status === 'failed' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Supabase Connection Failed{errorMsg ? `: ${errorMsg}` : ''}</span>
        </>
      )}
    </div>
  );
};
