import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  MessageSquare,
  Users,
  PhoneOff,
  MoreVertical,
  Send,
  X,
} from 'lucide-react';
import type { Meeting } from '../../types';

interface Props {
  meeting: Meeting | null;
  onClose: () => void;
}

export const VideoConferenceModal: React.FC<Props> = ({ meeting, onClose }) => {
  const { user } = useApp();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [callChat, setCallChat] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'David Chen', text: 'Hey team, audio is sounding crystal clear!', time: '10:02 AM' },
    { sender: 'Sarah Jenkins', text: 'I am sharing the UI component tokens deck now.', time: '10:04 AM' },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [seconds, setSeconds] = useState(145); // simulated active call duration

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!meeting) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    setCallChat((prev) => [
      ...prev,
      { sender: user?.name || 'User', text: inputMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setInputMsg('');
  };

  const participantsList = [
    { name: user?.name || 'User', avatar: user?.avatar || 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff', isSpeaking: isMicOn, isSelf: true },
    { name: 'David Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', isSpeaking: true, isSelf: false },
    { name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', isSpeaking: false, isSelf: false },
    { name: 'Michael Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', isSpeaking: false, isSelf: false },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans animate-fade-in select-none">
      {/* MEETING HEADER */}
      <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wide">REC</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{meeting.title}</h2>
            <div className="text-[10px] text-slate-400">Host: {meeting.organizer}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300">
            ⏱️ {formatTimer(seconds)}
          </div>

          <button
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>{participantsList.length}</span>
          </button>
        </div>
      </div>

      {/* MAIN VIDEO ROOM BODY */}
      <div className="flex-1 relative flex overflow-hidden p-4 md:p-6 gap-4">
        {/* VIDEO TILES GRID */}
        <div className="flex-1 flex flex-col justify-center">
          {isScreenSharing ? (
            /* Screen share active view */
            <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-indigo-600/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 z-10">
                <Monitor className="w-3.5 h-3.5" /> Sarah Jenkins is sharing screen
              </div>

              {/* Simulated presentation screen view */}
              <div className="flex-1 flex items-center justify-center p-8 text-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-slate-800/80">
                <div className="space-y-4 max-w-lg">
                  <div className="inline-block p-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                    📊 WorkNest_Q4_Product_Architecture.pptx
                  </div>
                  <h3 className="text-xl font-bold text-white">Slide 4: Neural Task Scheduling Algorithm Architecture</h3>
                  <p className="text-xs text-slate-400">
                    Real-time stream synchronization across team sub-groups and microservices.
                  </p>
                </div>
              </div>

              {/* Mini participant webcams strip */}
              <div className="flex items-center justify-center gap-3 pt-3">
                {participantsList.map((p, idx) => (
                  <div key={idx} className="w-24 h-16 rounded-xl bg-slate-800 border border-slate-700 relative overflow-hidden">
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-slate-900/80 px-1 rounded truncate max-w-[80px]">
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Standard Grid layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-5xl mx-auto w-full h-full max-h-[75vh]">
              {participantsList.map((p, i) => (
                <div
                  key={i}
                  className={`relative rounded-3xl bg-slate-900 border overflow-hidden flex items-center justify-center shadow-xl group transition-all ${
                    p.isSpeaking ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-slate-800'
                  }`}
                >
                  {p.isSelf && !isCamOn ? (
                    <div className="text-center space-y-2">
                      <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-400 font-semibold">Camera is off</span>
                    </div>
                  ) : (
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  )}

                  {/* Name Tag Overlay */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white flex items-center gap-2 border border-slate-800">
                    <span>{p.name} {p.isSelf ? '(You)' : ''}</span>
                    {p.isSpeaking && (
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 bg-emerald-400 animate-wave-1 rounded-full" />
                        <span className="w-0.5 bg-emerald-400 animate-wave-2 rounded-full" />
                        <span className="w-0.5 bg-emerald-400 animate-wave-3 rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDE IN-CALL CHAT DRAWER */}
        {isChatOpen && (
          <div className="w-80 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col overflow-hidden animate-fade-in">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" /> In-Call Chat
              </span>
              <button onClick={() => setIsChatOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {callChat.map((c, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                    <span>{c.sender}</span>
                    <span>{c.time}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Send message..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button type="submit" className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* CONTROL BAR BOTTOM */}
      <div className="h-20 bg-slate-900/95 border-t border-slate-800 px-6 flex items-center justify-between">
        <div className="hidden sm:block text-xs font-semibold text-slate-400">
          WorkNest WebRTC HD Audio/Video Sync
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3.5 rounded-2xl font-bold transition ${
              isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
            }`}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsCamOn(!isCamOn)}
            className={`p-3.5 rounded-2xl font-bold transition ${
              isCamOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
            }`}
            title={isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`p-3.5 rounded-2xl font-bold transition ${
              isScreenSharing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Share Screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-3.5 rounded-2xl font-bold transition ${
              isChatOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Meeting Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* End Meeting Button */}
          <button
            onClick={onClose}
            className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xl shadow-rose-600/30 flex items-center gap-2 transition active:scale-95 ml-2"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
