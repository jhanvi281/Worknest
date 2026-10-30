import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { getJitsiDomain, getJitsiMeetingUrl } from '../../services/meetingService';
import {
  PhoneOff,
  Video,
  Users,
  Shield,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import type { Meeting } from '../../types';

interface Props {
  meeting: Meeting | null;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

export const VideoConferenceModal: React.FC<Props> = ({ meeting, onClose }) => {
  const { user, teams, addToast } = useApp();

  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  const [isScriptLoading, setIsScriptLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(0);
  const [hasCopiedRoom, setHasCopiedRoom] = useState(false);

  // Authorization check: User must be signed in AND (organizer, invited participant, or host team member)
  const isAuthorized = Boolean(
    user?.id &&
      meeting &&
      (meeting.organizerId === user.id ||
        meeting.participants?.some((p) => p.userId === user.id) ||
        (meeting.teamId && teams.some((t) => t.id === meeting.teamId)) ||
        (!meeting.teamId && (meeting.organizerId === user.id || meeting.participants?.some((p) => p.userId === user.id))))
  );

  const roomName = meeting
    ? meeting.roomName || `WorkNest-${meeting.id.replace(/[^a-zA-Z0-9]/g, '')}`
    : '';

  const handleLeaveCall = useCallback(() => {
    if (apiRef.current) {
      try {
        apiRef.current.executeCommand('hangup');
      } catch (err) {
        console.warn('Error executing hangup:', err);
      }
      try {
        apiRef.current.dispose();
      } catch (err) {
        console.warn('Error disposing Jitsi instance:', err);
      }
      apiRef.current = null;
    }
    onClose();
  }, [onClose]);

  // Call duration counter
  useEffect(() => {
    if (!meeting || isConnecting) return;
    const interval = setInterval(() => {
      setCallDurationSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [meeting, isConnecting]);

  const formatCallDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyRoomId = () => {
    if (!roomName) return;
    const jitsiUrl = getJitsiMeetingUrl(roomName);
    navigator.clipboard.writeText(jitsiUrl);
    setHasCopiedRoom(true);
    addToast('Direct meeting room link copied to clipboard', 'info');
    setTimeout(() => setHasCopiedRoom(false), 2500);
  };

  // Load official Jitsi Meet IFrame API script
  useEffect(() => {
    let isCancelled = false;
    const domain = getJitsiDomain();

    const loadScript = () => {
      if (window.JitsiMeetExternalAPI) {
        setIsScriptLoading(false);
        return;
      }

      const existingScript = document.getElementById('jitsi-external-api');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (!isCancelled) setIsScriptLoading(false);
        });
        existingScript.addEventListener('error', () => {
          if (!isCancelled) {
            setLoadError(`Failed to load Jitsi Meet library from ${domain}.`);
            setIsScriptLoading(false);
          }
        });
        return;
      }

      const script = document.createElement('script');
      script.id = 'jitsi-external-api';
      script.src = `https://${domain}/external_api.js`;
      script.async = true;

      script.onload = () => {
        if (!isCancelled) {
          setIsScriptLoading(false);
        }
      };

      script.onerror = () => {
        if (!isCancelled) {
          setLoadError(
            'Failed to load Jitsi Meet API. Please check your internet connection or network firewall.'
          );
          setIsScriptLoading(false);
        }
      };

      document.body.appendChild(script);
    };

    loadScript();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Initialize Jitsi IFrame API once script is loaded and container is ready
  useEffect(() => {
    if (!meeting || !isAuthorized || isScriptLoading || loadError || !jitsiContainerRef.current) return;
    if (apiRef.current) return; // Already instantiated

    try {
      const domain = getJitsiDomain();
      const options = {
        roomName,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: user?.name || user?.email || 'WorkNest Member',
          email: user?.email || '',
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          enableClosePage: false,
          disableThirdPartyRequests: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          DEFAULT_BACKGROUND: '#0A0A0A',
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'recording',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'tileview',
            'select-background',
            'stats',
            'shortcuts',
          ],
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = api;

      // Event Listeners
      api.addEventListener('videoConferenceJoined', () => {
        setIsConnecting(false);
      });

      api.addEventListener('videoConferenceLeft', () => {
        handleLeaveCall();
      });

      api.addEventListener('readyToClose', () => {
        handleLeaveCall();
      });

      api.addEventListener('cameraError', (err: any) => {
        console.warn('Jitsi camera error:', err);
        setMediaError('Camera device not accessible or permission denied. Audio remains active.');
      });

      api.addEventListener('micError', (err: any) => {
        console.warn('Jitsi microphone error:', err);
        setMediaError('Microphone device not accessible or permission denied.');
      });

      api.addEventListener('participantJoined', () => {
        setParticipantCount((prev) => prev + 1);
      });

      api.addEventListener('participantLeft', () => {
        setParticipantCount((prev) => Math.max(1, prev - 1));
      });
    } catch (err: unknown) {
      console.error('Error instantiating Jitsi API:', err);
      const msg = err instanceof Error ? err.message : 'Error starting conference';
      setLoadError(msg);
      setIsConnecting(false);
    }

    return () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (e) {
          console.warn('Error on cleanup:', e);
        }
        apiRef.current = null;
      }
    };
  }, [meeting, isScriptLoading, loadError, roomName, user?.name, user?.email, handleLeaveCall]);

  if (!meeting) return null;

  if (!isAuthorized) {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="access-denied-title"
        className="fixed inset-0 z-50 bg-[#0A0A0A]/95 text-[#FAFAFA] flex items-center justify-center p-6 animate-fade-in"
      >
        <div className="max-w-md w-full bg-[#141414] border border-rose-900/60 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h2 id="access-denied-title" className="text-lg font-bold text-white">Access Denied</h2>
          <p className="text-xs text-[#A3A3A3] leading-relaxed">
            You are not authorized to join this conference. You must be the meeting organizer, an invited attendee, or an active member of the host team.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition cursor-pointer"
          >
            Close Conference View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Video conference: ${meeting.title}`}
      className="fixed inset-0 z-50 bg-[#0A0A0A] text-[#FAFAFA] flex flex-col font-sans select-none animate-fade-in"
    >
      {/* HEADER BAR */}
      <div className="h-16 px-4 sm:px-6 bg-[#141414] border-b border-[#333333] flex items-center justify-between shrink-0 gap-3">
        {/* Left: Meeting Info */}
        <div className="flex items-center gap-3 truncate">
          <div className="p-2 rounded-xl bg-orange-950/60 text-[#F97316] shrink-0">
            <Video className="w-5 h-5" />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate">{meeting.title}</h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1C1C1C] border border-[#333333] text-[#A3A3A3]">
                {meeting.type}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#A3A3A3] truncate">
              <span>Organizer: {meeting.organizer}</span>
              <span>•</span>
              <span className="font-mono text-[#F97316]">{roomName}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Call Timer & Participant count */}
        <div className="hidden md:flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-[#1C1C1C] border border-[#333333] text-xs font-mono font-bold text-neutral-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isConnecting ? 'Connecting...' : formatCallDuration(callDurationSeconds)}</span>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-[#1C1C1C] border border-[#333333] text-xs font-semibold text-[#A3A3A3] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#F97316]" />
            <span>{participantCount} in room</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyRoomId}
            title="Copy Direct Jitsi Room Link"
            className="px-3 py-1.5 rounded-xl border border-[#333333] bg-[#1C1C1C] hover:bg-[#262626] text-xs font-semibold text-[#FAFAFA] flex items-center gap-1.5 transition-colors"
          >
            {hasCopiedRoom ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#A3A3A3]" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleLeaveCall}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Call</span>
          </button>
        </div>
      </div>

      {/* SECURITY NOTICE BAR */}
      <div className="px-4 sm:px-6 py-1.5 bg-[#171717] border-b border-[#262626] flex items-center justify-between text-[11px] text-[#A3A3A3]">
        <div className="flex items-center gap-1.5 truncate">
          <Shield className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
          <span className="truncate">
            Jitsi Meet WebRTC transport (<code className="font-mono text-neutral-300">{getJitsiDomain()}</code>).
            Platform access is authorized via WorkNest credentials.
          </span>
        </div>
        <a
          href={getJitsiMeetingUrl(roomName)}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1 text-[#F97316] hover:underline font-semibold shrink-0 ml-2"
        >
          <span>Open Standalone Tab</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* MEDIA PERMISSION ALERT (IF APPLICABLE) */}
      {mediaError && (
        <div className="px-4 py-2 bg-amber-950/60 border-b border-amber-900/60 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{mediaError}</span>
          </div>
          <button
            onClick={() => setMediaError(null)}
            className="text-amber-400 hover:text-amber-100 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN CONFERENCE VIEWPORT CONTAINER */}
      <div className="flex-1 relative w-full h-full bg-[#0A0A0A] overflow-hidden">
        {/* Loading / Connecting Overlay */}
        {(isScriptLoading || isConnecting) && !loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0A0A]/90 backdrop-blur-sm gap-4">
            <div className="p-4 rounded-3xl bg-[#141414] border border-[#333333] shadow-2xl flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
              <div className="text-sm font-bold text-white">
                {isScriptLoading ? 'Loading Jitsi Meet IFrame Engine...' : 'Connecting to Audio/Video Bridge...'}
              </div>
              <p className="text-xs text-[#A3A3A3] max-w-xs text-center font-mono">
                Room: {roomName}
              </p>
            </div>
          </div>
        )}

        {/* Load Error State */}
        {loadError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#0A0A0A] text-center space-y-4">
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-900/60 text-rose-400">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-white">Connection Error</h3>
            <p className="text-xs text-[#A3A3A3] max-w-md leading-relaxed">
              {loadError}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleLeaveCall}
                className="px-4 py-2 rounded-xl border border-[#333333] text-xs font-semibold text-[#A3A3A3] hover:bg-[#1C1C1C]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setLoadError(null);
                  setIsScriptLoading(true);
                  setIsConnecting(true);
                }}
                className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-sm"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Real Jitsi IFrame Root Container */}
        <div
          ref={jitsiContainerRef}
          className="w-full h-full relative"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
};
