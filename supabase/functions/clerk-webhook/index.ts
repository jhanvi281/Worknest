// ==============================================================================
// Supabase Edge Function: clerk-webhook
// Secure Webhook Handler for Clerk User Lifecycle Events (user.created, user.updated)
// Synchronizes Clerk identities with WorkNest's canonical PostgreSQL profiles
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

/**
 * Verifies Svix webhook signatures using Web Crypto API.
 * Prevents unauthorized or spoofed webhook payloads.
 */
async function verifySvixSignature(
  rawBody: string,
  headers: Headers,
  webhookSecret: string
): Promise<boolean> {
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Prevent replay attacks: ensure timestamp is within 5 minutes
  const nowSec = Math.floor(Date.now() / 1000);
  const tsSec = parseInt(svixTimestamp, 10);
  if (isNaN(tsSec) || Math.abs(nowSec - tsSec) > 300) {
    console.warn('[clerk-webhook] Timestamp outside tolerance window');
    return false;
  }

  try {
    const cleanSecret = webhookSecret.startsWith('whsec_')
      ? webhookSecret.slice(6)
      : webhookSecret;

    const secretBytes = Uint8Array.from(atob(cleanSecret), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expectedBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    // svix-signature can contain multiple versions separated by space (e.g. "v1,abc v1,def")
    const passedSignatures = svixSignature
      .split(' ')
      .map((s) => s.split(',')[1])
      .filter(Boolean);

    return passedSignatures.includes(expectedBase64);
  } catch (err) {
    console.error('[clerk-webhook] Signature verification error:', err);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await req.text();
  const webhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET');

  // Fail-Closed: Strictly enforce Svix webhook signature verification
  if (!webhookSecret) {
    console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not configured in environment secrets');
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration: Webhook signing secret missing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const isValid = await verifySvixSignature(rawBody, req.headers, webhookSecret);
  if (!isValid) {
    console.error('[clerk-webhook] Invalid Svix webhook signature');
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let event: { type: string; data: any };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[clerk-webhook] Missing Supabase service role environment variables');
    return new Response(
      JSON.stringify({ error: 'Server configuration error: missing service credentials' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const eventType = event.type;
    const data = event.data;

    console.log(`[clerk-webhook] Processing event: ${eventType} for Clerk user: ${data?.id}`);

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const clerkUserId = data.id;
      const primaryEmailObj = data.email_addresses?.find(
        (e: any) => e.id === data.primary_email_address_id
      ) || data.email_addresses?.[0];

      const email = primaryEmailObj?.email_address;
      if (!email) {
        console.warn(`[clerk-webhook] User ${clerkUserId} has no email address. Skipping sync.`);
        return new Response(JSON.stringify({ status: 'ignored', reason: 'no_email' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || data.username || '';
      const avatarUrl = data.image_url || '';

      // Idempotently sync profile using database RPC
      const { data: profileId, error: rpcErr } = await supabaseAdmin.rpc('sync_clerk_profile', {
        p_clerk_user_id: clerkUserId,
        p_email: email,
        p_full_name: fullName,
        p_avatar_url: avatarUrl,
        p_department: 'General',
      });

      if (rpcErr) {
        console.error('[clerk-webhook] RPC sync_clerk_profile error:', rpcErr);
        return new Response(JSON.stringify({ error: rpcErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[clerk-webhook] Successfully synced profile ${profileId} for Clerk user ${clerkUserId}`);
      return new Response(JSON.stringify({ status: 'ok', profileId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (eventType === 'user.deleted') {
      const clerkUserId = data.id;
      console.log(`[clerk-webhook] User deleted in Clerk: ${clerkUserId}`);
      // WorkNest preserves historical data / audit trail; simply unbind clerk_user_id
      await supabaseAdmin
        .from('profiles')
        .update({ clerk_user_id: null, updated_at: new Date().toISOString() })
        .eq('clerk_user_id', clerkUserId);

      return new Response(JSON.stringify({ status: 'ok', deleted: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ status: 'ignored', event: eventType }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown webhook error';
    console.error('[clerk-webhook] Handler exception:', errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

