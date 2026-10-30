// ==============================================================================
// Supabase Edge Function: gemini-assistant
// WorkNest Real AI Integration with Google Gemini API & Action Engine
// Model: gemini-3.8-flash | Endpoint: v1beta/models/{model}:generateContent
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_VERSION = 'v1beta';

const SYSTEM_INSTRUCTION = `You are WorkNest AI, an intelligent productivity and collaboration assistant.
You help users manage tasks, teams, daily logs, meetings, and productivity.
You can propose actions using the supported WorkNest action schema.
You cannot directly execute database operations.
You must never claim that an action has succeeded before receiving a successful execution result from WorkNest.
You must ask for clarification when required information is missing or ambiguous.
You must never fabricate users, tasks, meetings, deadlines, permissions, or workspace data.
You must respect the authenticated user’s permissions.
All destructive or database-changing actions require explicit user confirmation.
Distinguish facts from recommendations.
Be concise, practical, and professional.

--- ACTION PROPOSAL PROTOCOL ---
When the user expresses intent to perform an action (create, update, assign, delete tasks; log work; schedule/cancel meetings; manage team members):
1. Resolve the specific entity from the provided WORKSPACE CONTEXT (match by name/title/reference). Never invent task IDs or user IDs.
2. If multiple entities match (e.g., two tasks with similar names, or multiple members with the same first name), DO NOT propose an action yet. Ask the user for clarification.
3. If essential information is missing, ask the user to provide it.
4. When all parameters are clear, provide a concise explanation in Markdown AND output an action block using:
\`\`\`action
{
  "actions": [
    {
      "type": "<action_type>",
      "description": "<Concise summary of action>",
      "params": { ... }
    }
  ]
}
\`\`\`

Supported action types and parameter schemas:
1. "create_task": { "title": string, "description"?: string, "priority"?: "low"|"medium"|"high"|"urgent", "status"?: "todo"|"in_progress"|"review"|"completed", "dueDate"?: "YYYY-MM-DD", "category"?: string, "assignedToId"?: string, "assignedToName"?: string, "teamId"?: string }
2. "update_task": { "taskId": string, "taskTitle"?: string, "title"?: string, "description"?: string, "priority"?: "low"|"medium"|"high"|"urgent", "status"?: "todo"|"in_progress"|"review"|"completed", "progress"?: number, "dueDate"?: "YYYY-MM-DD" }
3. "assign_task": { "taskId": string, "taskTitle": string, "assigneeId": string, "assigneeName": string }
4. "delete_task": { "taskId": string, "taskTitle": string }
5. "create_daily_log": { "date"?: "YYYY-MM-DD", "hoursWorked": number, "workCompleted": string, "challengesFaced"?: string, "planForTomorrow"?: string }
6. "create_meeting": { "title": string, "description"?: string, "meetingDate": "YYYY-MM-DD", "meetingTime": "HH:MM", "durationMinutes": number, "type"?: "Video Conference"|"Subgroup Sync"|"Project Standup"|"Review", "teamId"?: string }
7. "cancel_meeting": { "meetingId": string, "meetingTitle": string }
8. "invite_team_member": { "teamId": string, "teamName": string, "email": string, "role": "group_leader"|"subgroup_leader"|"member" }
9. "update_team_member_role": { "teamId": string, "memberId": string, "memberName": string, "role": "group_leader"|"subgroup_leader"|"member" }
10. "remove_team_member": { "teamId": string, "teamName": string, "memberId": string, "memberName": string }

If the user asks to create multiple items (e.g., "create 3 tasks for the release"), include multiple action objects inside the "actions" array.
Always format your conversational message cleanly in GitHub-flavored markdown.`;

// In-memory JWKS cache for low-latency cryptographic verification
let cachedJwks: { keys: any[]; fetchedAt: number; issuer: string } | null = null;

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Cryptographically verifies Clerk JWTs against trusted Clerk JWKS.
 * Enforces RSA signature verification, expiration, and issuer constraints.
 */
async function verifyClerkJwt(
  rawToken: string,
  expectedIssuer?: string
): Promise<{ sub: string; email?: string } | null> {
  const parts = rawToken.split('.');
  if (parts.length !== 3) return null;

  let header: { kid?: string; alg?: string };
  let payload: { sub?: string; iss?: string; exp?: number; nbf?: number; email?: string; [key: string]: any };

  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(parts[0])));
    payload = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(parts[1])));
  } catch {
    return null;
  }

  if (!header.kid || header.alg !== 'RS256' || !payload.sub || !payload.iss) {
    return null;
  }

  // Validate issuer matches configured or trusted Clerk domain
  const issuer = payload.iss.replace(/\/$/, '');
  if (expectedIssuer && issuer !== expectedIssuer.replace(/\/$/, '')) {
    console.error(`[gemini-assistant] JWT issuer mismatch: ${issuer} vs expected ${expectedIssuer}`);
    return null;
  }
  if (!issuer.startsWith('https://') || (!issuer.includes('clerk') && !expectedIssuer)) {
    console.error(`[gemini-assistant] Untrusted JWT issuer: ${issuer}`);
    return null;
  }

  // Check expiration & active window
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < now) {
    console.warn('[gemini-assistant] Clerk token expired');
    return null;
  }
  if (typeof payload.nbf === 'number' && payload.nbf > now + 60) {
    console.warn('[gemini-assistant] Clerk token not yet active');
    return null;
  }

  // Fetch or retrieve cached JWKS (cache for 1 hour)
  const CACHE_TTL_MS = 60 * 60 * 1000;
  if (!cachedJwks || cachedJwks.issuer !== issuer || Date.now() - cachedJwks.fetchedAt > CACHE_TTL_MS) {
    try {
      const jwksRes = await fetch(`${issuer}/.well-known/jwks.json`);
      if (!jwksRes.ok) throw new Error(`JWKS HTTP ${jwksRes.status}`);
      const data = await jwksRes.json();
      cachedJwks = { keys: data.keys || [], fetchedAt: Date.now(), issuer };
    } catch (err) {
      console.error('[gemini-assistant] Failed to fetch Clerk JWKS:', err);
      if (!cachedJwks || cachedJwks.issuer !== issuer) return null;
    }
  }

  let targetJwk = cachedJwks.keys.find((k: any) => k.kid === header.kid);
  if (!targetJwk) {
    // If key not in cache, refetch once to handle key rotation
    try {
      const jwksRes = await fetch(`${issuer}/.well-known/jwks.json`);
      if (jwksRes.ok) {
        const data = await jwksRes.json();
        cachedJwks = { keys: data.keys || [], fetchedAt: Date.now(), issuer };
        targetJwk = cachedJwks.keys.find((k: any) => k.kid === header.kid);
      }
    } catch {
      // ignore
    }
    if (!targetJwk) {
      console.error(`[gemini-assistant] No matching JWK found for kid: ${header.kid}`);
      return null;
    }
  }

  // Cryptographic RS256 signature verification via Web Crypto API
  try {
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      targetJwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signatureBytes = base64UrlToUint8Array(parts[2]);

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureBytes,
      signedData
    );

    if (!isValid) {
      console.error('[gemini-assistant] Clerk cryptographic signature verification failed');
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email || payload.email_address || payload.primary_email_address,
    };
  } catch (cryptoErr) {
    console.error('[gemini-assistant] Crypto verification error:', cryptoErr);
    return null;
  }
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const tTotalStart = performance.now();

  try {
    // 2. Validate Authentication via caller JWT
    const tAuthStart = performance.now();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required. Please sign in to access WorkNest AI.',
          code: 'GEMINI_PERMISSION_DENIED',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: Supabase environment variables missing in Edge Function runtime.',
          code: 'EDGE_FUNCTION_ERROR',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize authenticated Supabase client using caller's JWT to inherit Postgres RLS policies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    let authenticatedUserId: string | null = null;
    let authenticatedUserEmail: string | null = null;

    // Cryptographic Clerk JWT Verification
    const configuredIssuer = Deno.env.get('CLERK_ISSUER_URL');
    const clerkVerified = await verifyClerkJwt(rawToken, configuredIssuer);

    if (clerkVerified) {
      // Caller authenticated with Clerk. Resolve canonical profile UUID from public.profiles
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || supabaseAnonKey;
      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      const { data: profile } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('clerk_user_id', clerkVerified.sub)
        .maybeSingle();

      if (profile) {
        authenticatedUserId = profile.id;
        authenticatedUserEmail = profile.email || clerkVerified.email || null;
      }
    }

    if (!authenticatedUserId) {
      // Fallback: Verify legacy Supabase Auth session
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        authenticatedUserId = authData.user.id;
        authenticatedUserEmail = authData.user.email || null;
      }
    }

    const tAuthEnd = performance.now();
    console.log(`[AI TIMING] Authentication: ${Math.round(tAuthEnd - tAuthStart)}ms`);

    if (!authenticatedUserId) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized. Invalid or expired session token. Please re-authenticate.',
          code: 'GEMINI_PERMISSION_DENIED',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = {
      id: authenticatedUserId,
      email: authenticatedUserEmail,
    };

    // 3. Parse and Validate Request Payload
    let payload: {
      message?: string;
      history?: Array<{ role: 'user' | 'model'; content: string }>;
      diagnostic?: boolean;
      action?: string;
    };

    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request payload.', code: 'GEMINI_INVALID_REQUEST' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Verify Gemini API Key configuration
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Google Gemini API key is not configured in Supabase Edge Function secrets. Please set GEMINI_API_KEY.',
          code: 'GEMINI_PERMISSION_DENIED',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preferred model: gemini-3.8-flash (configurable via GEMINI_MODEL secret)
    const configuredModel = Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash';

    // 5. Safe Diagnostic Mode (Verify Model & Project Access without exposing secret key)
    if (payload.diagnostic || payload.action === 'check_models') {
      const tDiagStart = performance.now();
      try {
        const diagUrl = `https://generativelanguage.googleapis.com/${API_VERSION}/models`;
        const diagRes = await fetch(diagUrl, {
          method: 'GET',
          headers: {
            'x-goog-api-key': geminiApiKey,
          },
        });

        const diagDuration = Math.round(performance.now() - tDiagStart);
        console.log(`[AI TIMING] Diagnostic model check: ${diagDuration}ms`);

        if (!diagRes.ok) {
          const errBody = await diagRes.json().catch(() => ({}));
          const status = diagRes.status;
          return new Response(
            JSON.stringify({
              status: 'error',
              code: status === 401 || status === 403 ? 'GEMINI_PERMISSION_DENIED' : 'GEMINI_MODEL_NOT_FOUND',
              error: `Google Generative AI returned HTTP ${status}: ${errBody?.error?.message || 'Access denied'}`,
              configuredModel,
              httpStatus: status,
            }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const modelsData = await diagRes.json();
        const availableModels: string[] = (modelsData.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace(/^models\//, ''));

        const isConfiguredAvailable = availableModels.includes(configuredModel);

        return new Response(
          JSON.stringify({
            status: 'ok',
            configuredModel,
            isConfiguredModelAvailable: isConfiguredAvailable,
            supportedModelsCount: availableModels.length,
            supportedModels: availableModels,
            message: isConfiguredAvailable
              ? `Model '${configuredModel}' is active and supports generateContent.`
              : `Model '${configuredModel}' was not found in the project's supported models list.`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (diagErr: unknown) {
        return new Response(
          JSON.stringify({
            status: 'error',
            code: 'EDGE_FUNCTION_ERROR',
            error: diagErr instanceof Error ? diagErr.message : 'Diagnostic check failed.',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Validate Message Content
    const userMessage = payload.message?.trim();
    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty.', code: 'GEMINI_INVALID_REQUEST' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userMessage.length > 6000) {
      return new Response(
        JSON.stringify({
          error: 'Message length exceeds maximum allowed limit of 6,000 characters.',
          code: 'GEMINI_INVALID_REQUEST',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Query Workspace Context with stage and individual timing
    const tContextStart = performance.now();
    let profile: any = {};
    let tasks: any[] = [];
    let teamMemberships: any[] = [];
    let recentLogs: any[] = [];
    let upcomingMeetings: any[] = [];
    let teamRoster: any[] = [];

    const fetchTimed = async <T>(name: string, p: Promise<T>): Promise<T> => {
      const start = performance.now();
      const res = await p;
      console.log(`[AI TIMING] ${name}: ${Math.round(performance.now() - start)}ms`);
      return res;
    };

    const contextPromise = Promise.all([
      fetchTimed('Profile retrieval', supabase.from('profiles').select('id, full_name, email, department').eq('id', user.id).maybeSingle()),
      fetchTimed(
        'Task retrieval',
        supabase
          .from('tasks')
          .select('id, title, description, status, priority, due_date, category, progress, assigned_to, profiles:assigned_to(id, full_name, email)')
          .order('created_at', { ascending: false })
          .limit(25)
      ),
      fetchTimed(
        'Team retrieval',
        supabase
          .from('team_members')
          .select('id, team_id, role, teams(id, name, description)')
          .eq('user_id', user.id)
      ),
      fetchTimed(
        'Daily log retrieval',
        supabase
          .from('daily_logs')
          .select('id, date, hours_worked, work_completed, challenges_faced, plan_for_tomorrow')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5)
      ),
      fetchTimed(
        'Meeting retrieval',
        supabase
          .from('meetings')
          .select('id, title, description, meeting_date, meeting_time, duration, type, team_id')
          .gte('meeting_date', new Date().toISOString().split('T')[0])
          .order('meeting_date', { ascending: true })
          .limit(8)
      ),
    ]);

    const contextTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('WORKSPACE_CONTEXT_TIMEOUT')), 8000)
    );

    try {
      const [profileRes, tasksRes, teamsRes, logsRes, meetingsRes] = await Promise.race([
        contextPromise,
        contextTimeoutPromise,
      ]);

      profile = profileRes?.data || {};
      tasks = tasksRes?.data || [];
      teamMemberships = teamsRes?.data || [];
      recentLogs = logsRes?.data || [];
      upcomingMeetings = meetingsRes?.data || [];

      // Query team members across the user's active workspaces for entity resolution (3s limit)
      const teamIds = teamMemberships.map((tm: any) => tm.team_id).filter(Boolean);
      if (teamIds.length > 0) {
        const rosterPromise = fetchTimed(
          'Team roster retrieval',
          supabase
            .from('team_members')
            .select('id, user_id, team_id, role, profiles(id, full_name, email), teams(id, name)')
            .in('team_id', teamIds)
            .limit(30)
        );

        const rosterTimeoutPromise = new Promise<any>((resolve) =>
          setTimeout(() => resolve({ data: [] }), 3000)
        );

        const rosterResult = await Promise.race([rosterPromise, rosterTimeoutPromise]);
        teamRoster = rosterResult?.data || [];
      }
    } catch (contextErr) {
      console.warn('[AI TIMING] Workspace context retrieval timeout (proceeding with baseline profile context):', contextErr);
    }

    const tContextEnd = performance.now();
    console.log(`[AI TIMING] Workspace context preparation: ${Math.round(tContextEnd - tContextStart)}ms`);

    // Build structured, token-efficient workspace briefing with exact timestamps
    const nowIso = new Date().toISOString();
    const currentDateStr = nowIso.split('T')[0];
    const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const userName = profile.full_name || profile.email?.split('@')[0] || user.email?.split('@')[0] || 'User';
    const userDept = profile.department ? ` (${profile.department})` : '';

    const teamsSummary = teamMemberships
      .map((tm: any) => `- "${tm.teams?.name || 'Workspace'}" (Team ID: "${tm.team_id}", Role: ${tm.role || 'member'})`)
      .join('\n');

    const pendingTasks = tasks.filter((t: any) => t.status !== 'completed');
    const completedTasks = tasks.filter((t: any) => t.status === 'completed');
    const urgentTasks = tasks.filter((t: any) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed');

    const tasksSummary = tasks
      .map(
        (t: any) =>
          `- Task ID: "${t.id}" | Title: "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Due: ${t.due_date || 'None'} | Progress: ${t.progress}% | Assignee: ${t.profiles?.full_name || t.profiles?.email || 'Unassigned'}`
      )
      .join('\n');

    const rosterSummary = teamRoster
      .map(
        (m: any) =>
          `- Member: "${m.profiles?.full_name || m.profiles?.email || 'User'}" (User ID: "${m.user_id}", Member ID: "${m.id}", Team: "${m.teams?.name || 'Workspace'}", Role: ${m.role})`
      )
      .join('\n');

    const logsSummary = recentLogs
      .map(
        (l: any) =>
          `- [Date: ${l.date} | ${l.hours_worked}h] Done: ${l.work_completed}${l.challenges_faced ? ` | Blockers: ${l.challenges_faced}` : ''}${l.plan_for_tomorrow ? ` | Next: ${l.plan_for_tomorrow}` : ''}`
      )
      .join('\n');

    const meetingsSummary = upcomingMeetings
      .map(
        (m: any) =>
          `- Meeting ID: "${m.id}" | Title: "${m.title}" | Date: ${m.meeting_date} | Time: ${m.meeting_time} | Duration: ${m.duration || 30}m | Type: ${m.type}`
      )
      .join('\n');

    const contextBriefing = `--- CURRENT AUTHENTICATED WORKNEST WORKSPACE CONTEXT ---
Current System Date: ${currentDateStr} | Current Time: ${currentTimeStr}
User: ${userName}${userDept} (User ID: "${user.id}")

Active Teams (${teamMemberships.length}):
${teamsSummary || 'No active teams'}

Eligible Team Members / Roster (${teamRoster.length}):
${rosterSummary || 'Only current user in active teams'}

Task Metrics: Total: ${tasks.length} | Pending: ${pendingTasks.length} | Completed: ${completedTasks.length} | Urgent/High: ${urgentTasks.length}
Recent Visible Tasks (${tasks.length}):
${tasksSummary || 'No tasks found'}

Recent Work Logs (Last 5 Entries):
${logsSummary || 'No work logs submitted yet'}

Upcoming Meetings:
${meetingsSummary || 'No upcoming meetings scheduled'}
--------------------------------------------------------`;

    // 8. Format Gemini Chat Payload with Strict Multi-Turn Alternation
    const geminiContents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text: string }>;
    }> = [];

    // Include recent history (up to 8 turns), ensuring proper user/model alternating turns
    if (Array.isArray(payload.history)) {
      for (const item of payload.history.slice(-8)) {
        if (item.role === 'user' || item.role === 'model') {
          const lastTurn = geminiContents[geminiContents.length - 1];
          if (lastTurn && lastTurn.role === item.role) {
            lastTurn.parts[0].text += `\n${String(item.content).slice(0, 2000)}`;
          } else {
            geminiContents.push({
              role: item.role,
              parts: [{ text: String(item.content).slice(0, 2000) }],
            });
          }
        }
      }
    }

    // Ensure the last turn before current user message is not 'user' to maintain alternating turn structure
    if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === 'user') {
      geminiContents.push({
        role: 'model',
        parts: [{ text: 'Understood. Please provide the next instruction.' }],
      });
    }

    // Add current user turn with embedded context
    geminiContents.push({
      role: 'user',
      parts: [
        {
          text: `${contextBriefing}\n\nUser Instruction: ${userMessage}`,
        },
      ],
    });

    // CRITICAL: Configure thinkingConfig with thinkingLevel: "low" for Gemini 3 series.
    // By default, Gemini 3 Flash models use "medium" thinking depth, which generates
    // multi-thousand-token internal reasoning chains causing 20-35s latency.
    // Setting thinkingLevel: "low" accelerates inference to 1-3 seconds.
    const geminiPayload = {
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        topP: 0.9,
        thinkingConfig: {
          thinkingLevel: 'low',
        },
      },
    };

    // 9. Execute Call to Google Gemini API with 25s Timeout
    const tGeminiStart = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s max Gemini timeout

    let geminiResponse: Response;

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${configuredModel}:generateContent`;
      geminiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify(geminiPayload),
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isAbort = (fetchErr as any)?.name === 'AbortError' || controller.signal.aborted;
      const tGeminiAbort = performance.now();
      console.error(`[AI TIMING] Gemini request ${isAbort ? 'aborted after timeout' : 'failed with network error'}: ${Math.round(tGeminiAbort - tGeminiStart)}ms`);

      return new Response(
        JSON.stringify({
          error: isAbort
            ? 'WorkNest AI is taking longer than expected. Please try again with a more specific instruction.'
            : 'Network error connecting to Gemini API.',
          code: isAbort ? 'GEMINI_TIMEOUT' : 'EDGE_FUNCTION_ERROR',
        }),
        { status: isAbort ? 504 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const tGeminiEnd = performance.now();
    console.log(`[AI TIMING] Gemini request: ${Math.round(tGeminiEnd - tGeminiStart)}ms`);

    // 10. Handle Gemini API Errors with Granular Diagnostics
    if (!geminiResponse.ok) {
      let errorBody: any = {};
      try {
        errorBody = await geminiResponse.json();
      } catch {
        // unparseable error body
      }

      const status = geminiResponse.status;
      const googleErrorCode = errorBody?.error?.code || status;
      const googleErrorStatus = errorBody?.error?.status || '';
      const googleErrorMessage = errorBody?.error?.message || geminiResponse.statusText || '';

      // Safe structured diagnostic logging - NEVER logs API keys, auth headers, or user data
      console.error('[gemini-assistant] Gemini API Error Response:', {
        httpStatus: status,
        googleErrorCode,
        googleErrorStatus,
        googleErrorMessage,
        model: configuredModel,
        apiVersion: API_VERSION,
      });

      // Distinguish error categories and return clear, actionable user messages
      if (status === 400) {
        return new Response(
          JSON.stringify({
            error: `Invalid request to Gemini API (400): ${googleErrorMessage || 'The request payload was rejected by Google Generative AI.'}`,
            code: 'GEMINI_INVALID_REQUEST',
            details: { httpStatus: 400, model: configuredModel },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (status === 401 || status === 403) {
        return new Response(
          JSON.stringify({
            error: `Gemini API authentication/permission failure (${status}): The configured GEMINI_API_KEY is invalid or lacks Generative Language API permissions. Please verify your Google AI Studio key.`,
            code: 'GEMINI_PERMISSION_DENIED',
            details: { httpStatus: status, model: configuredModel },
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (status === 404) {
        return new Response(
          JSON.stringify({
            error: `The requested Gemini model '${configuredModel}' was not found (404) on Google's API endpoint. Please configure GEMINI_MODEL="gemini-3.8-flash" in Supabase Edge Function secrets.`,
            code: 'GEMINI_MODEL_NOT_FOUND',
            details: { httpStatus: 404, model: configuredModel, googleMessage: googleErrorMessage },
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (status === 429 || googleErrorMessage.toLowerCase().includes('quota') || googleErrorMessage.toLowerCase().includes('rate limit')) {
        return new Response(
          JSON.stringify({
            error: 'Google Gemini API rate limit or quota exceeded (429). Please wait a moment before trying again.',
            code: 'GEMINI_QUOTA_EXCEEDED',
            details: { httpStatus: 429, model: configuredModel },
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (status >= 500 && status < 600) {
        return new Response(
          JSON.stringify({
            error: `Google Generative AI service error (${status}): Google's servers are temporarily unavailable or experiencing high load. Please try again shortly.`,
            code: 'EDGE_FUNCTION_ERROR',
            details: { httpStatus: status, model: configuredModel },
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          error: `Gemini API returned error (${status}): ${googleErrorMessage || 'Unexpected upstream response.'}`,
          code: 'EDGE_FUNCTION_ERROR',
          details: { httpStatus: status, model: configuredModel },
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 11. Extract and Return Generated Content
    const tParseStart = performance.now();
    const geminiData = await geminiResponse.json();
    const candidate = geminiData.candidates?.[0];
    const textPart = candidate?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n') || '';

    if (!textPart || textPart.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Gemini generated an empty response. Please try rephrasing your question.',
          code: 'EDGE_FUNCTION_ERROR',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 12. Extract Structured Actions from Gemini Response
    let cleanText = textPart.trim();
    const proposedActions: any[] = [];

    // Match ```action ... ``` or ```json ... ``` blocks containing {"actions": [...]} or {"action": {...}}
    const actionBlockRegex = /```(?:action|json)?\s*([\s\S]*?\{[\s\S]*?"(?:actions|action)"[\s\S]*?\})\s*```/i;
    const match = cleanText.match(actionBlockRegex);

    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        const rawActions = Array.isArray(parsed.actions) ? parsed.actions : (parsed.action ? [parsed.action] : []);

        const validActionTypes = [
          'create_task',
          'update_task',
          'assign_task',
          'delete_task',
          'create_daily_log',
          'create_meeting',
          'cancel_meeting',
          'invite_team_member',
          'update_team_member_role',
          'remove_team_member',
        ];

        for (const raw of rawActions) {
          if (raw && typeof raw.type === 'string' && validActionTypes.includes(raw.type)) {
            const isDestructive = ['delete_task', 'cancel_meeting', 'remove_team_member'].includes(raw.type);
            proposedActions.push({
              id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              type: raw.type,
              description: raw.description || `Execute ${raw.type.replace(/_/g, ' ')}`,
              params: raw.params || {},
              requiresConfirmation: true,
              isDestructive,
              status: 'proposed',
            });
          }
        }

        // Clean out the raw action JSON block from the user-facing markdown text
        cleanText = cleanText.replace(actionBlockRegex, '').trim();
      } catch (parseErr) {
        console.warn('[gemini-assistant] Failed to parse action block:', parseErr);
      }
    }

    // Optional: Extract quick insights tags if detected in the response
    const insights: Array<{
      title: string;
      description: string;
      type: 'info' | 'success' | 'warning' | 'urgent';
    }> = [];

    if (urgentTasks.length > 0) {
      insights.push({
        title: `${urgentTasks.length} Urgent Deliverables`,
        description: `High-priority items identified in active workspace.`,
        type: 'warning',
      });
    }

    const tParseEnd = performance.now();
    console.log(`[AI TIMING] Gemini response parsing: ${Math.round(tParseEnd - tParseStart)}ms`);
    console.log(`[AI TIMING] Total request time: ${Math.round(tParseEnd - tTotalStart)}ms`);

    return new Response(
      JSON.stringify({
        text: cleanText || textPart.trim(),
        model: configuredModel,
        insights: insights.length > 0 ? insights : undefined,
        proposedActions: proposedActions.length > 0 ? proposedActions : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[gemini-assistant] Unhandled edge function exception:', errorMsg);
    return new Response(
      JSON.stringify({ error: 'An unexpected internal error occurred.', code: 'EDGE_FUNCTION_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
