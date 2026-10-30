import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard, RotateCcw } from 'lucide-react';

/**
 * Redacts potential secrets, keys, JWTs, and credentials from diagnostic error strings
 * before logging to the console.
 */
function sanitizeDiagnosticString(str: string): string {
  if (!str) return str;
  return str
    // Redact JWT tokens (header.payload.signature)
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]')
    // Redact Bearer tokens
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_TOKEN]')
    // Redact key/secret/password/token assignments in URLs, query strings, headers, or JSON-like text
    .replace(/((?:token|access_token|refresh_token|apikey|api_key|secret|secret_key|secretkey|password|passwd|pwd|auth|credential|credentials|client_secret)=)[^&\s"',}]+/gi, '$1[REDACTED]')
    // Redact Supabase keys like sbp_... or sb_...
    .replace(/sb[p-]?[a-zA-Z0-9_-]{20,}/gi, '[REDACTED_KEY]');
}

export interface ErrorBoundaryFallbackProps {
  error: Error | null;
  resetError: () => void;
  onGoToDashboard?: () => void;
  onReload: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  onGoToDashboard?: () => void;
  showDashboardButton?: boolean;
  showReloadButton?: boolean;
  title?: string;
  description?: string;
  isFullScreen?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  showDetails?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const sanitizedName = sanitizeDiagnosticString(error?.name || 'Error');
    const sanitizedMessage = sanitizeDiagnosticString(error?.message || 'Unknown error');
    const sanitizedErrorStack = error?.stack ? sanitizeDiagnosticString(error.stack) : undefined;
    const sanitizedStack = errorInfo?.componentStack
      ? sanitizeDiagnosticString(errorInfo.componentStack)
      : undefined;

    console.error('[WorkNest ErrorBoundary] Caught uncaught rendering error:', {
      name: sanitizedName,
      message: sanitizedMessage,
      stack: sanitizedErrorStack,
      componentStack: sanitizedStack,
    });

    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public resetError = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  public handleGoToDashboard = (): void => {
    this.resetError();
    if (this.props.onGoToDashboard) {
      this.props.onGoToDashboard();
    } else {
      try {
        localStorage.setItem('worknest_current_view', 'dashboard');
      } catch {
        // Ignore localStorage errors
      }
      window.location.href = window.location.origin;
    }
  };

  public handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    const { hasError, error } = this.state;
    const {
      children,
      fallback,
      showDashboardButton = true,
      showReloadButton = true,
      title = 'Something went wrong',
      description = 'An unexpected error occurred while loading this section. Please try again or return to the dashboard.',
      isFullScreen = false,
    } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback({
          error,
          resetError: this.resetError,
          onGoToDashboard: this.handleGoToDashboard,
          onReload: this.handleReload,
        });
      }
      return fallback;
    }

    // Default friendly fallback UI without stack traces or sensitive details
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`flex items-center justify-center p-6 text-[#171717] dark:text-[#FAFAFA] transition-colors ${
          isFullScreen ? 'min-h-screen w-full bg-white dark:bg-[#0A0A0A]' : 'h-full min-h-[380px] w-full'
        }`}
      >
        <div className="max-w-md w-full bg-white dark:bg-[#141414] rounded-2xl border border-[#E5E5E5] dark:border-[#333333] p-8 shadow-xl text-center space-y-6 animate-fade-in">
          {/* Friendly Alert Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>

          {/* Heading & Friendly Message */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-[#171717] dark:text-[#FAFAFA]">
              {title}
            </h2>
            <p className="text-sm text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.resetError}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] active:scale-95 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 dark:focus:ring-offset-[#141414]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            {showDashboardButton && (
              <button
                type="button"
                onClick={this.handleGoToDashboard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-[#171717] dark:text-[#FAFAFA] bg-white dark:bg-[#1C1C1C] hover:bg-[#FAFAFA] dark:hover:bg-[#222222] border border-[#E5E5E5] dark:border-[#333333] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 dark:focus:ring-offset-[#141414]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            )}

            {showReloadButton && (
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs text-[#737373] hover:text-[#171717] dark:text-[#A3A3A3] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-all"
                title="Reload application"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
            )}
          </div>

          {/* Diagnostic Details (Collapsible for debuggability) */}
          {error && (
            <div className="pt-2 text-left border-t border-[#E5E5E5] dark:border-[#262626]">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] font-mono text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] dark:hover:text-[#F97316] transition cursor-pointer flex items-center justify-between w-full"
              >
                <span>{this.state.showDetails ? '▼ Hide Diagnostic Info' : '▶ Show Diagnostic Info'}</span>
                <span className="text-[10px] text-neutral-400">DEV</span>
              </button>
              {this.state.showDetails && (
                <div className="mt-2 p-3 rounded-xl bg-[#F5F5F5] dark:bg-[#1C1C1C] text-[11px] font-mono text-rose-600 dark:text-rose-400 max-h-48 overflow-y-auto space-y-1 select-all break-all border border-rose-200 dark:border-rose-950/60">
                  <div className="font-bold">{sanitizeDiagnosticString(error.name)}: {sanitizeDiagnosticString(error.message)}</div>
                  {error.stack && (
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap">
                      {sanitizeDiagnosticString(error.stack)}
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap border-t border-neutral-300 dark:border-neutral-800 pt-1 mt-1">
                      {sanitizeDiagnosticString(this.state.errorInfo.componentStack)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}
