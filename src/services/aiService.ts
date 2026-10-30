import { supabase, getClerkToken, isClerkAuthMode } from '../lib/supabase';
import type { AIMessage, AIAction, AIActionType } from '../types';

export interface AIServiceResponse {
  text: string;
  model?: string;
  insights?: AIMessage['insights'];
  proposedActions?: AIAction[];
}

export interface AIServiceOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export const aiService = {
  /**
   * Invokes the secure Supabase Edge Function 'gemini-assistant' with the user's instruction
   * and multi-turn message history. Bounded by a reliable 35-second client timeout and
   * external AbortSignal cancellation support.
   */
  async sendMessage(
    message: string,
    history: AIMessage[] = [],
    options?: AIServiceOptions
  ): Promise<AIServiceResponse> {
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      throw new Error('Message cannot be empty.');
    }

    // Verify authenticated session (Clerk token priority with legacy Supabase session fallback)
    const clerkToken = await getClerkToken();
    let authToken = clerkToken;

    if (!authToken && !isClerkAuthMode) {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!sessionError && session) {
        authToken = session.access_token;
      }
    }

    if (!authToken) {
      throw new Error('Authentication required. Please sign in to communicate with WorkNest AI.');
    }

    // Map existing AIMessage[] into clean Gemini-compatible turns ({ role: 'user' | 'model', content })
    const formattedHistory = history
      .filter((m) => !m.isError && m.text && m.text.trim().length > 0)
      .slice(-8)
      .map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: m.text,
      }));

    // Setup client-side 35-second maximum overall timeout controller
    const clientTimeoutMs = options?.timeoutMs || 35000;
    const internalController = new AbortController();
    let isTimedOut = false;

    const timer = setTimeout(() => {
      isTimedOut = true;
      internalController.abort();
    }, clientTimeoutMs);

    // If external caller provided a signal (e.g. user clicked Stop/Cancel)
    if (options?.signal) {
      if (options.signal.aborted) {
        clearTimeout(timer);
        throw new Error('Request was cancelled.');
      }
      options.signal.addEventListener('abort', () => {
        internalController.abort();
      });
    }

    try {
      const { data, error } = await supabase.functions.invoke('gemini-assistant', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        body: {
          message: cleanMessage,
          history: formattedHistory,
        },
        signal: internalController.signal,
      });

      if (error) {
        let detailedMessage = error.message;
        let errorCode = '';

        // PostgREST/Functions error objects often wrap the body in context
        if (typeof (error as any)?.context?.json === 'function') {
          try {
            const body = await (error as any).context.json();
            if (body?.error) {
              detailedMessage = body.error;
            }
            if (body?.code) {
              errorCode = body.code;
            }
          } catch {
            // Failed to parse response body json
          }
        }

        if (detailedMessage?.includes('FunctionsFetchError') || detailedMessage?.includes('Failed to send a request')) {
          throw new Error(
            'The WorkNest AI Edge Function is not deployed or unreachable. Deploy the function via `supabase functions deploy gemini-assistant`.'
          );
        }

        const errObj = new Error(detailedMessage || 'Failed to communicate with WorkNest AI.');
        (errObj as any).code = errorCode;
        throw errObj;
      }

      if (!data || !data.text) {
        throw new Error('Received an empty response from WorkNest AI.');
      }

      let extractedActions: AIAction[] = Array.isArray(data.proposedActions) ? data.proposedActions : [];
      let responseText = data.text;

      // Fallback client-side action extraction if Edge Function did not strip it
      if (extractedActions.length === 0) {
        const actionBlockRegex = /```(?:action|json)?\s*([\s\S]*?\{[\s\S]*?"(?:actions|action)"[\s\S]*?\})\s*```/i;
        const match = responseText.match(actionBlockRegex);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            const rawActions = Array.isArray(parsed.actions) ? parsed.actions : (parsed.action ? [parsed.action] : []);
            const validActionTypes: AIActionType[] = [
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
              if (raw && typeof raw.type === 'string' && validActionTypes.includes(raw.type as AIActionType)) {
                const isDestructive = ['delete_task', 'cancel_meeting', 'remove_team_member'].includes(raw.type);
                extractedActions.push({
                  id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  type: raw.type as AIActionType,
                  description: raw.description || `Execute ${raw.type.replace(/_/g, ' ')}`,
                  params: raw.params || {},
                  requiresConfirmation: true,
                  isDestructive,
                  status: 'proposed',
                });
              }
            }
            responseText = responseText.replace(actionBlockRegex, '').trim();
          } catch (clientParseErr) {
            console.warn('[aiService] Client-side action block parse failure:', clientParseErr);
          }
        }
      }

      return {
        text: responseText,
        model: data.model,
        insights: data.insights,
        proposedActions: extractedActions.length > 0 ? extractedActions : undefined,
      };
    } catch (err: unknown) {
      if (isTimedOut) {
        throw new Error('WorkNest AI is taking longer than expected. Please try again.');
      }
      if (options?.signal?.aborted || (err as any)?.name === 'AbortError') {
        throw new Error('Request was cancelled.');
      }
      console.error('[aiService] Edge Function invocation error:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred while communicating with WorkNest AI.');
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Safe diagnostic check that queries available Gemini models via the Edge Function
   * without exposing API keys or credentials.
   */
  async checkDiagnostics(): Promise<{
    status: 'ok' | 'error';
    configuredModel: string;
    isConfiguredModelAvailable: boolean;
    supportedModels?: string[];
    supportedModelsCount?: number;
    message: string;
    code?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('gemini-assistant', {
      body: { diagnostic: true },
    });

    if (error) {
      let msg = error.message;
      let code = 'EDGE_FUNCTION_ERROR';
      if (typeof (error as any)?.context?.json === 'function') {
        try {
          const body = await (error as any).context.json();
          if (body?.error) msg = body.error;
          if (body?.code) code = body.code;
        } catch {
          // parse error
        }
      }
      return {
        status: 'error',
        configuredModel: 'gemini-3.8-flash',
        isConfiguredModelAvailable: false,
        message: msg,
        code,
      };
    }

    return data;
  },
};
