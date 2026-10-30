import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { validateChatFile } from '../../services/chatService';
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
    downloadChatAttachment,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreateChannelOpen) {
          setIsCreateChannelOpen(false);
        } else if (showComposerEmojiPicker) {
          setShowComposerEmojiPicker(false);
        } else if (reactionPickerMsgId) {
          setReactionPickerMsgId(null);
        } else if (editingMessageId) {
          setEditingMessageId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateChannelOpen, showComposerEmojiPicker, reactionPickerMsgId, editingMessageId]);

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
      <div className="w-full md:w-80 bg-white dark:bg-[#141414] rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-[#E5E5E5] dark:border-[#333333]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">Conversations</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs bg-orange-50 dark:bg-orange-950/40 text-[#F97316] font-semibold px-2.5 py-0.5 rounded-full">
                Team Chat
              </span>
              {canCreateChannel && (
                <button
                  onClick={() => setIsCreateChannelOpen(true)}
                  className="p-1 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors"
                  title="Create Channel"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#737373] dark:text-[#A3A3A3] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {isLoadingChannels ? (
            <div className="p-8 text-center text-[#737373] dark:text-[#A3A3A3] space-y-2">
              <div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-semibold text-[#737373] dark:text-[#A3A3A3]">Loading channels...</div>
            </div>
          ) : channelsError ? (
            <div className="p-4 text-center text-rose-500 space-y-2 text-xs">
              <div>{channelsError}</div>
              <button onClick={refreshChannels} className="text-[#F97316] hover:underline font-bold">
                Retry
              </button>
            </div>
          ) : channels.length === 0 ? (
            <div className="p-6 text-center text-[#737373] dark:text-[#A3A3A3] space-y-3">
              <div className="text-xs font-semibold text-[#171717] dark:text-[#FAFAFA]">No channels found</div>
              <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3]">
                {canCreateChannel
                  ? 'No chat channels exist for this team yet. Create one to begin.'
                  : 'No chat channels available for your team.'}
              </p>
              {canCreateChannel && (
                <button
                  onClick={() => setIsCreateChannelOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm transition-colors"
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
                  <div className="text-[10px] font-bold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider px-2 mb-1.5">
                    Main Team
                  </div>
                  {mainChannels.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors ${
                        activeChannelId === c.id
                          ? 'bg-[#F97316] text-white shadow-sm'
                          : 'text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Hash className={`w-4 h-4 shrink-0 ${activeChannelId === c.id ? 'text-white' : 'text-[#737373] dark:text-[#A3A3A3]'}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">#{c.name}</div>
                          {c.lastMessage && (
                            <div className={`text-[10px] truncate ${activeChannelId === c.id ? 'text-orange-100' : 'text-[#737373] dark:text-[#A3A3A3]'}`}>
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
                  <div className="text-[10px] font-bold text-[#737373] dark:text-[#A3A3A3] uppercase tracking-wider px-2 mb-1.5">
                    Subgroup Discussions
                  </div>
                  {subgroupChannels.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors ${
                        activeChannelId === c.id
                          ? 'bg-[#F97316] text-white shadow-sm'
                          : 'text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Users className={`w-4 h-4 shrink-0 ${activeChannelId === c.id ? 'text-white' : 'text-[#F97316]'}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">#{c.name}</div>
                          {c.lastMessage && (
                            <div className={`text-[10px] truncate ${activeChannelId === c.id ? 'text-orange-100' : 'text-[#737373] dark:text-[#A3A3A3]'}`}>
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
      <div className="flex-1 bg-white dark:bg-[#141414] rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex flex-col overflow-hidden">
        {!activeChannel ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#737373] dark:text-[#A3A3A3] space-y-4">
            <div className="p-4 rounded-3xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316]">
              <Hash className="w-8 h-8" />
            </div>
            <div className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">
              No Channel Selected
            </div>
            <p className="text-xs text-[#737373] dark:text-[#A3A3A3] max-w-sm">
              {channels.length === 0
                ? canCreateChannel
                  ? 'This team has no chat channels yet. Create one to begin team discussions.'
                  : 'No chat channels have been created for this team yet.'
                : 'Select a channel from the left sidebar to start collaborating.'}
            </p>
            {channels.length === 0 && canCreateChannel && (
              <button
                onClick={() => setIsCreateChannelOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm transition-colors"
              >
                + Create First Channel
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316]">
                  {activeChannel.isSubgroup ? <Users className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">#{activeChannel.name}</h2>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {onlineCount > 0 ? `${onlineCount} Online` : '1 Online'}
                    </span>
                  </div>
                  <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">{activeChannel.description || 'Channel conversation'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAudioCallClick}
                  className="p-2 rounded-xl text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors"
                  title="Audio Call (Phase F)"
                >
                  <Phone className="w-4 h-4 text-[#F97316]" />
                </button>
                <button
                  onClick={handleVideoCallClick}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                  title="Video Call (Phase F)"
                >
                  <Video className="w-4 h-4" /> Video Call
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#737373] dark:text-[#A3A3A3] space-y-3">
                  <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-[#737373] dark:text-[#A3A3A3]">Loading messages...</span>
                </div>
              ) : messagesError ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-rose-500 space-y-2">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                  <div className="text-xs font-semibold">{messagesError}</div>
                  <button
                    onClick={() => refreshMessages(activeChannel.id)}
                    className="text-xs text-[#F97316] hover:underline font-bold"
                  >
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#737373] dark:text-[#A3A3A3] space-y-3">
                  <div className="p-4 rounded-3xl bg-orange-50 dark:bg-orange-950/40 text-[#F97316]">
                    <Hash className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">
                    Welcome to #{activeChannel.name}!
                  </div>
                  <p className="text-xs text-[#737373] dark:text-[#A3A3A3] max-w-sm">
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
                          (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=f97316&color=fff`;
                        }}
                      />

                      <div className={`max-w-md space-y-1 ${isMe ? 'items-end text-right' : ''}`}>
                        {/* Header: Sender, Timestamp, Edit / Delete / Reaction Actions */}
                        <div className={`flex items-center gap-1.5 text-xs ${isMe ? 'justify-end' : ''}`}>
                          <span className="font-bold text-[#171717] dark:text-[#FAFAFA]">{msg.senderName}</span>
                          <span className="text-[10px] text-[#737373] dark:text-[#A3A3A3]">{msg.timestamp}</span>

                          {/* Quick Actions (Hover) */}
                          <div className="flex items-center gap-0.5 relative">
                            {/* Reaction trigger */}
                            <button
                              type="button"
                              onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] rounded transition-colors"
                              title="Add reaction"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {/* Emoji Reaction Popover */}
                            {reactionPickerMsgId === msg.id && (
                              <div
                                className={`absolute z-30 ${
                                  isMe ? 'right-0' : 'left-0'
                                } top-full mt-1 bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] rounded-2xl shadow-xl p-1.5 flex items-center gap-1 animate-fade-in`}
                              >
                                {reactionEmojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleReactionClick(msg.id, emoji)}
                                    className="p-1.5 hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] rounded-xl text-sm transition hover:scale-125"
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
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] rounded transition-colors"
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
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#737373] dark:text-[#A3A3A3] hover:text-rose-500 rounded transition-colors"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline Edit Form OR Message Content Bubble */}
                        {isCurrentlyEditing ? (
                          <div className="space-y-2 p-3 bg-[#FAFAFA] dark:bg-[#1C1C1C] rounded-2xl border border-orange-500/50 shadow-sm text-left">
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
                              className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#141414] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                            />
                            <div className="flex items-center justify-end gap-1.5 text-[11px]">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={isSavingEdit}
                                className="px-2.5 py-1 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSavingEdit || !editingText.trim()}
                                onClick={() => handleSaveEdit(msg.id)}
                                className="px-3 py-1 rounded-lg bg-[#F97316] text-white font-bold hover:bg-[#EA580C] dark:hover:bg-[#FB923C] disabled:opacity-50 transition-colors"
                              >
                                {isSavingEdit ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-[#F97316] text-white shadow-sm'
                                : 'bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] border border-[#E5E5E5] dark:border-[#333333]'
                            }`}
                          >
                            <span>{msg.text}</span>
                            {msg.isEdited && (
                              <span className={`ml-1.5 text-[10px] ${isMe ? 'text-orange-200' : 'text-[#737373] dark:text-[#A3A3A3]'}`}>
                                (edited)
                              </span>
                            )}

                            {/* Real Attachments Display */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2.5 space-y-2">
                                {msg.attachments.map((att, attIdx) => {
                                  const isImage = Boolean(
                                    att.type?.startsWith('image/') ||
                                    /\.(png|jpe?g|gif|webp|svg)$/i.test(att.name)
                                  );
                                  return (
                                    <div key={attIdx} className="space-y-1.5">
                                      {isImage && att.url && (
                                        <div className="max-w-xs overflow-hidden rounded-xl border border-black/10 dark:border-white/10 shadow-sm">
                                          <img
                                            src={att.url}
                                            alt={att.name}
                                            className="max-h-60 w-auto rounded-xl object-cover cursor-pointer hover:opacity-95 transition"
                                            onClick={() => window.open(att.url, '_blank', 'noopener,noreferrer')}
                                          />
                                        </div>
                                      )}
                                      <div
                                        className={`p-2 rounded-xl flex items-center justify-between gap-2.5 ${
                                          isMe
                                            ? 'bg-black/15 text-white'
                                            : 'bg-white dark:bg-[#141414] text-[#171717] dark:text-[#FAFAFA] border border-[#E5E5E5] dark:border-[#333333]'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <FileText className={`w-4 h-4 shrink-0 ${isMe ? 'text-orange-200' : 'text-[#F97316]'}`} />
                                          <div className="min-w-0">
                                            <div className="text-xs font-semibold truncate">{att.name}</div>
                                            <div className="text-[10px] opacity-75">{att.size}</div>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => downloadChatAttachment(att)}
                                          className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                                            isMe
                                              ? 'bg-white/20 hover:bg-white/30 text-white'
                                              : 'bg-orange-50 dark:bg-orange-950/40 text-[#F97316] hover:bg-orange-100 dark:hover:bg-orange-900/60'
                                          }`}
                                          title="Download attachment"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
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
                                className={`px-2.5 py-0.5 rounded-full border text-[11px] flex items-center gap-1 transition-colors ${
                                  r.userReacted
                                    ? 'bg-orange-50 dark:bg-orange-950/80 border-orange-400 dark:border-orange-600 text-orange-700 dark:text-orange-300 font-bold shadow-sm'
                                    : 'bg-[#FAFAFA] dark:bg-[#1C1C1C] border-[#E5E5E5] dark:border-[#333333] text-[#171717] dark:text-[#FAFAFA] hover:bg-orange-50/50'
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
              <div className="px-4 py-2 bg-orange-50 dark:bg-orange-950/40 border-t border-orange-200 dark:border-orange-800 flex items-center justify-between text-xs text-orange-800 dark:text-orange-200">
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
              <div className="p-2 bg-white dark:bg-[#141414] border-t border-[#E5E5E5] dark:border-[#333333] flex items-center gap-2">
                {reactionEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setShowComposerEmojiPicker(false);
                    }}
                    className="p-2 text-base hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] rounded-xl transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Message Input Box */}
            <form onSubmit={handleSend} className="p-4 border-t border-[#E5E5E5] dark:border-[#333333] flex items-center gap-3">
              <label className="p-2.5 rounded-xl text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] cursor-pointer transition-colors">
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.tsv,.md,.rtf,.zip,.tar,.gz,.7z,.rar,.json,.xml,.sql,.log,.mp3,.mp4,.wav,.webm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const validation = validateChatFile(file);
                      if (!validation.valid) {
                        addToast(validation.error || 'Invalid file format or size.', 'error');
                        e.target.value = '';
                        return;
                      }
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
                className="flex-1 bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] rounded-2xl px-4 py-2.5 text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowComposerEmojiPicker(!showComposerEmojiPicker)}
                className="p-2.5 rounded-xl text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors"
                title="Insert emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={isSending || (!inputText.trim() && !selectedFile)}
                className="p-2.5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold shadow-sm active:scale-95 disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* CREATE CHANNEL MODAL */}
      {isCreateChannelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-channel-title"
          onClick={!isCreating ? () => setIsCreateChannelOpen(false) : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] overflow-hidden my-auto"
          >
            <div className="px-6 py-4 border-b border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between shrink-0">
              <div id="create-channel-title" className="flex items-center gap-2 font-bold text-[#171717] dark:text-[#FAFAFA] text-sm">
                <Hash className="w-4 h-4 text-[#F97316]" />
                <span>Create New Channel</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(false)}
                disabled={isCreating}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChannelSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                  Channel Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#737373] dark:text-[#A3A3A3] font-bold">#</span>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="general, dev-sync, announcements"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What is this channel for?"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>

              {activeTeam?.subgroups && activeTeam.subgroups.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                    Channel Scope
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewChannelType('main')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                        newChannelType === 'main'
                          ? 'border-[#F97316] bg-orange-50 dark:bg-orange-950/40 text-[#F97316]'
                          : 'border-[#E5E5E5] dark:border-[#333333] text-[#737373] dark:text-[#A3A3A3]'
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
                          ? 'border-[#F97316] bg-orange-50 dark:bg-orange-950/40 text-[#F97316]'
                          : 'border-[#E5E5E5] dark:border-[#333333] text-[#737373] dark:text-[#A3A3A3]'
                      }`}
                    >
                      Subgroup
                    </button>
                  </div>
                </div>
              )}

              {newChannelType === 'subgroup' && activeTeam?.subgroups && activeTeam.subgroups.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                    Select Subgroup
                  </label>
                  <select
                    value={newChannelSubgroupId}
                    onChange={(e) => setNewChannelSubgroupId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none"
                  >
                    {activeTeam.subgroups.map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E5] dark:border-[#333333] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateChannelOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newChannelName.trim()}
                  className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-colors"
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
