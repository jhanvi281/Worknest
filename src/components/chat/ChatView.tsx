import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Hash,
  Users,
  Search,
  Phone,
  Video,
  Paperclip,
  Smile,
  Send,
  FileText,
  Trash2,
  Plus,
  AlertCircle,
  X,
  Edit2,
  Download,
} from 'lucide-react';
import type { ChatMessage } from '../../types';

export const ChatView: React.FC = () => {
  const {
    channels,
    isLoadingChannels,
    channelsError,
    activeChannelId,
    setActiveChannelId,
    messages,
    isLoadingMessages,
    messagesError,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    uploadChatAttachment,
    createChannel,
    refreshChannels,
    refreshMessages,
    onlineCount,
    user,
    currentUserRole,
    teams,
    activeTeamId,
    addToast,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [showComposerEmojiPicker, setShowComposerEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelType, setNewChannelType] = useState<'main' | 'subgroup'>('main');
  const [newChannelSubgroupId, setNewChannelSubgroupId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Message editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Message reaction picker state (which message currently has its emoji toolbar open)
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];
  const activeChannel = channels.find((c) => c.id === activeChannelId) || (channels.length > 0 ? channels[0] : null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannelId]);

  const filteredChannels = channels.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
  });

  const mainChannels = filteredChannels.filter((c) => !c.isSubgroup);
  const subgroupChannels = filteredChannels.filter((c) => c.isSubgroup);

  const canCreateChannel = currentUserRole === 'group_leader' || currentUserRole === 'subgroup_leader';

  const reactionEmojis = ['👍', '❤️', '🔥', '🎉', '🚀', '👀', '💡', '🙌'];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel) return;
    if (!inputText.trim() && !selectedFile) return;
    if (isSending) return;

    setIsSending(true);
    let uploadedAttachments: ChatMessage['attachments'] = undefined;

    if (selectedFile) {
      const uploaded = await uploadChatAttachment(selectedFile);
      if (!uploaded) {
        setIsSending(false);
        return; // upload error toast was already shown
      }
      uploadedAttachments = [uploaded];
    }

    const success = await sendMessage(
      activeChannel.id,
      inputText,
      uploadedAttachments
    );
    setIsSending(false);

    if (success) {
      setInputText('');
      setSelectedFile(null);
      setShowComposerEmojiPicker(false);
    }
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
    setReactionPickerMsgId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editingText.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    const success = await editMessage(msgId, editingText);
    setIsSavingEdit(false);
    if (success) {
      setEditingMessageId(null);
      setEditingText('');
    }
  };

  const handleReactionClick = async (messageId: string, emoji: string) => {
    setReactionPickerMsgId(null);
    await toggleReaction(messageId, emoji);
  };

  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || isCreating) return;

    setIsCreating(true);
    const success = await createChannel({
      name: newChannelName.trim(),
      description: newChannelDesc.trim() || undefined,
      isSubgroup: newChannelType === 'subgroup',
      subgroupId: newChannelType === 'subgroup' ? newChannelSubgroupId || undefined : undefined,
    });
    setIsCreating(false);

    if (success) {
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelType('main');
      setNewChannelSubgroupId('');
      setIsCreateChannelOpen(false);
    }
  };

  const handleAudioCallClick = () => {
    addToast('Audio calling will be enabled in the upcoming Meetings & Calls module.', 'info');
  };

  const handleVideoCallClick = () => {
    addToast('Video conferencing will be enabled in the upcoming Meetings & Calls module.', 'info');
  };

  return (
    <div className="h-[calc(100vh-5rem)] p-4 md:p-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-4 animate-fade-in">
      {/* LEFT PANEL: Channels & Subgroups List */}
      <div className="w-full md:w-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Conversations</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold px-2.5 py-0.5 rounded-full">
                Team Chat
              </span>
              {canCreateChannel && (
                <button
                  onClick={() => setIsCreateChannelOpen(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Create Channel"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {isLoadingChannels ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-semibold text-slate-500">Loading channels...</div>
            </div>
          ) : channelsError ? (
            <div className="p-4 text-center text-rose-500 space-y-2 text-xs">
              <div>{channelsError}</div>
              <button onClick={refreshChannels} className="text-indigo-600 hover:underline font-bold">
                Retry
              </button>
            </div>
          ) : channels.length === 0 ? (
            <div className="p-6 text-center text-slate-400 space-y-3">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">No channels found</div>
              <p className="text-[11px] text-slate-500">
                {canCreateChannel
                  ? 'No chat channels exist for this team yet. Create one to begin.'
                  : 'No chat channels available for your team.'}
              </p>
              {canCreateChannel && (
                <button
                  onClick={() => setIsCreateChannelOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                >
                  + Create Channel
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Main Team Channel */}
              {mainChannels.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                    Main Team
                  </div>
                  {mainChannels.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition ${
                        activeChannelId === c.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Hash className={`w-4 h-4 shrink-0 ${activeChannelId === c.id ? 'text-white' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">#{c.name}</div>
                          {c.lastMessage && (
                            <div className={`text-[10px] truncate ${activeChannelId === c.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                              {c.lastMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Subgroups Channels */}
              {subgroupChannels.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                    Subgroup Discussions
                  </div>
                  {subgroupChannels.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition ${
                        activeChannelId === c.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Users className={`w-4 h-4 shrink-0 ${activeChannelId === c.id ? 'text-white' : 'text-purple-400'}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">#{c.name}</div>
                          {c.lastMessage && (
                            <div className={`text-[10px] truncate ${activeChannelId === c.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                              {c.lastMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Active Conversation Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        {!activeChannel ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
            <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-indigo-600">
              <Hash className="w-8 h-8" />
            </div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Channel Selected
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              {channels.length === 0
                ? canCreateChannel
                  ? 'This team has no chat channels yet. Create one to begin team discussions.'
                  : 'No chat channels have been created for this team yet.'
                : 'Select a channel from the left sidebar to start collaborating.'}
            </p>
            {channels.length === 0 && canCreateChannel && (
              <button
                onClick={() => setIsCreateChannelOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
              >
                + Create First Channel
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                  {activeChannel.isSubgroup ? <Users className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">#{activeChannel.name}</h2>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {onlineCount > 0 ? `${onlineCount} Online` : '1 Online'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{activeChannel.description || 'Channel conversation'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAudioCallClick}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Audio Call (Phase F)"
                >
                  <Phone className="w-4 h-4 text-indigo-600" />
                </button>
                <button
                  onClick={handleVideoCallClick}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition"
                  title="Video Call (Phase F)"
                >
                  <Video className="w-4 h-4" /> Video Call
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 space-y-3">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-500">Loading messages...</span>
                </div>
              ) : messagesError ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-rose-500 space-y-2">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                  <div className="text-xs font-semibold">{messagesError}</div>
                  <button
                    onClick={() => refreshMessages(activeChannel.id)}
                    className="text-xs text-indigo-600 hover:underline font-bold"
                  >
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                  <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-indigo-600">
                    <Hash className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Welcome to #{activeChannel.name}!
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    This is the beginning of the #{activeChannel.name} channel. Send a message below to start collaborating.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = Boolean(user?.id && msg.senderId === user.id);
                  const canDelete = Boolean(user?.id && (msg.senderId === user.id || currentUserRole === 'group_leader'));
                  const isCurrentlyEditing = editingMessageId === msg.id;

                  return (
                    <div key={msg.id} className={`group flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=6366f1&color=fff`;
                        }}
                      />

                      <div className={`max-w-md space-y-1 ${isMe ? 'items-end text-right' : ''}`}>
                        {/* Header: Sender, Timestamp, Edit / Delete / Reaction Actions */}
                        <div className={`flex items-center gap-1.5 text-xs ${isMe ? 'justify-end' : ''}`}>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{msg.senderName}</span>
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>

                          {/* Quick Actions (Hover) */}
                          <div className="flex items-center gap-0.5 relative">
                            {/* Reaction trigger */}
                            <button
                              type="button"
                              onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-500 rounded transition"
                              title="Add reaction"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {/* Emoji Reaction Popover */}
                            {reactionPickerMsgId === msg.id && (
                              <div
                                className={`absolute z-30 ${
                                  isMe ? 'right-0' : 'left-0'
                                } top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 flex items-center gap-1 animate-fade-in`}
                              >
                                {reactionEmojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleReactionClick(msg.id, emoji)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm transition hover:scale-125"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Edit button (Only on user's own message) */}
                            {isMe && !isCurrentlyEditing && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(msg)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                                title="Edit message"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete button (Author or Group Leader) */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => deleteMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline Edit Form OR Message Content Bubble */}
                        {isCurrentlyEditing ? (
                          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-indigo-400 dark:border-indigo-600 shadow-sm text-left">
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(msg.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              autoFocus
                              disabled={isSavingEdit}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex items-center justify-end gap-1.5 text-[11px]">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={isSavingEdit}
                                className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSavingEdit || !editingText.trim()}
                                onClick={() => handleSaveEdit(msg.id)}
                                className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
                              >
                                {isSavingEdit ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <span>{msg.text}</span>
                            {msg.isEdited && (
                              <span className={`ml-1.5 text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                (edited)
                              </span>
                            )}

                            {/* Real Attachments Display */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2.5 space-y-1.5">
                                {msg.attachments.map((att, attIdx) => (
                                  <div
                                    key={attIdx}
                                    className={`p-2 rounded-xl flex items-center justify-between gap-2.5 ${
                                      isMe
                                        ? 'bg-black/15 text-white'
                                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <FileText className={`w-4 h-4 shrink-0 ${isMe ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`} />
                                      <div className="min-w-0">
                                        <div className="text-xs font-semibold truncate">{att.name}</div>
                                        <div className="text-[10px] opacity-75">{att.size}</div>
                                      </div>
                                    </div>
                                    {att.url && (
                                      <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={att.name}
                                        className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                                          isMe
                                            ? 'bg-white/20 hover:bg-white/30 text-white'
                                            : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                                        }`}
                                        title="Download file"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reaction chips below message */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`flex flex-wrap items-center gap-1 pt-1 ${isMe ? 'justify-end' : ''}`}>
                            {msg.reactions.map((r, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleReactionClick(msg.id, r.emoji)}
                                className={`px-2.5 py-0.5 rounded-full border text-[11px] flex items-center gap-1 transition ${
                                  r.userReacted
                                    ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                                title={`${r.count} reaction${r.count > 1 ? 's' : ''} • Click to toggle`}
                              >
                                <span>{r.emoji}</span>
                                <span className="font-semibold">{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment preview bar before sending */}
            {selectedFile && (
              <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-t border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
                <span className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Ready to upload: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-rose-500 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Composer Emoji Picker popover */}
            {showComposerEmojiPicker && (
              <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                {reactionEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setShowComposerEmojiPicker(false);
                    }}
                    className="p-2 text-base hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Message Input Box */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <label className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition">
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                    e.target.value = '';
                  }}
                />
              </label>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message #${activeChannel.name}...`}
                disabled={isSending}
                className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowComposerEmojiPicker(!showComposerEmojiPicker)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Insert emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={isSending || (!inputText.trim() && !selectedFile)}
                className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* CREATE CHANNEL MODAL */}
      {isCreateChannelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <Hash className="w-4 h-4 text-indigo-600" />
                <span>Create New Channel</span>
              </div>
              <button
                onClick={() => setIsCreateChannelOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChannelSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Channel Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">#</span>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="general, dev-sync, announcements"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What is this channel for?"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {activeTeam?.subgroups && activeTeam.subgroups.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Channel Scope
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewChannelType('main')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                        newChannelType === 'main'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Main Team
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewChannelType('subgroup');
                        if (!newChannelSubgroupId && activeTeam.subgroups[0]) {
                          setNewChannelSubgroupId(activeTeam.subgroups[0].id);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                        newChannelType === 'subgroup'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Subgroup
                    </button>
                  </div>
                </div>
              )}

              {newChannelType === 'subgroup' && activeTeam?.subgroups && activeTeam.subgroups.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Subgroup
                  </label>
                  <select
                    value={newChannelSubgroupId}
                    onChange={(e) => setNewChannelSubgroupId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    {activeTeam.subgroups.map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateChannelOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newChannelName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
