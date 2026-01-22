import React, { useState, useEffect, useCallback } from 'react';
import { AppPage, AppBadge, AppButton } from '@/frontend/components/design-system';
import { Search, MessageCircle, ShieldCheck } from 'lucide-react';

import { api } from '@/backend/api';
import { supabase } from '@/database/supabase';
import { useAsync } from '@/frontend/hooks/useAsync';
import { Conversation, Message, Escalation } from '@/backend/types';
import { EscalationDetailModal } from '@/frontend/components/modals/EscalationDetailModal';

interface MessageLogProps {
  searchTerm?: string;
}

export const MessageLog: React.FC<MessageLogProps> = ({ searchTerm }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'info'>('list');
  const [showEscalation, setShowEscalation] = useState(false);
  const [activeEscalation, setActiveEscalation] = useState<Escalation | null>(null);
  const [openEscalations, setOpenEscalations] = useState<Escalation[]>([]);
  const [realtimeTrigger, setRealtimeTrigger] = useState(0);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Fetch conversations and open escalations
  const fetchData = useCallback(async () => {
    const [convRes, escRes] = await Promise.all([
      api.getConversationsData(),
      api.getEscalationsData('OPEN') // Only fetch open escalations
    ]);
    if (escRes) {
      console.log('[MessageLog] Open escalations loaded:', escRes.length, escRes);
      setOpenEscalations(escRes);
    }
    return convRes;
  }, []);

  const { data, status, error, execute } = useAsync(fetchData);

  // Re-fetch when realtime trigger changes
  useEffect(() => {
    if (realtimeTrigger > 0) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeTrigger]);

  // REAL-TIME SUBSCRIPTION
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vivilo_whatsapp_history' },
        () => {
          // Trigger refresh on new message
          setRealtimeTrigger((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filteredConversations = React.useMemo(() => {
    if (!data?.conversations) return [];

    // Priority: Local Search (internal to messages), then SearchTerm (global)
    const activeSearch = (localSearch || searchTerm || '').toLowerCase();

    let filtered = data.conversations;
    if (activeSearch) {
      filtered = data.conversations.filter(
        (conv) =>
          conv.name.toLowerCase().includes(activeSearch) ||
          conv.id.toLowerCase().includes(activeSearch) ||
          conv.property?.toLowerCase().includes(activeSearch)
      );
    }

    // Sort by latest message ISO string (most recent first)
    return [...filtered].sort((a, b) => {
      return new Date(b.latestMessageAt).getTime() - new Date(a.latestMessageAt).getTime();
    });
  }, [data?.conversations, localSearch, searchTerm]);

  // Auto-select first conversation (avoiding setState in effect)
  useEffect(() => {
    const shouldSelectFirst = filteredConversations.length > 0 && !selectedId;
    if (shouldSelectFirst) {
      // Use setTimeout to defer setState out of render cycle
      const timer = setTimeout(() => {
        setSelectedId(filteredConversations[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [filteredConversations, selectedId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView('chat');
  };

  const PlatformIcon = ({ type }: { type: string }) => {
    // ... same logic ...
    if (type === 'booking')
      return (
        <div className="w-5 h-5 bg-[#003580] rounded-full flex items-center justify-center text-white font-serif font-bold text-[10px] ring-2 ring-white">
          B.
        </div>
      );
    if (type === 'airbnb')
      return (
        <div className="w-5 h-5 bg-[#FF5A5F] rounded-full flex items-center justify-center text-white ring-2 ring-white">
          <svg viewBox="0 0 32 32" fill="currentColor" className="w-3 h-3">
            <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836 1.143 2.66 1.345 5.723-.51 8.356C26.062 31.066 22.16 32 16 32c-6.16 0-10.062-.933-11.874-3.513-1.855-2.634-1.653-5.697-.51-8.357.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.536 1.963 13.992 1 16 1zm0 2c-1.273 0-2.277.65-3.328 2.533l-.533 1.025c-1.953 3.827-6.112 12.534-7.098 14.832-.937 2.18-.89 4.398.397 6.226C6.726 29.444 9.68 30 16 30c6.32 0 9.274-.556 10.563-2.384 1.287-1.828 1.334-4.046.397-6.226-.986-2.298-5.145-11.005-7.098-14.832l-.533-1.025C18.277 3.65 17.273 3 16 3zm0 13c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3z"></path>
          </svg>
        </div>
      );
    if (type === 'whatsapp')
      return (
        <div className="w-5 h-5 bg-[#25D366] rounded-full flex items-center justify-center text-white ring-2 ring-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </div>
      );
    return null;
  };

  const selectedConv =
    (filteredConversations || []).find((c: Conversation) => c.id === selectedId) || null;

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (selectedConv?.messages && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [selectedId, selectedConv?.messages]);




  // Error state
  if (error) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center p-8 bg-stone-50">
        <div className="p-10 text-center max-w-md border border-red-200 bg-red-50 rounded-3xl shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 text-red-500">
            <span className="text-xl">🚨</span>
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-3">Connection Error</h3>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">{error}</p>
          <AppButton onClick={execute} variant="primary">
            Retry
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <AppPage
      title="Message Log"
      subtitle="Institutional protocol execution and guest orchestration."
      loading={status === 'pending' || status === 'idle'}
    >
      <div className="flex flex-col md:flex-row h-[96vh] w-full bg-white rounded-[2.5rem] border border-stone-200 shadow-premium overflow-hidden relative animate-in fade-in duration-500">
        {/* 1. LEFT SIDEBAR - INBOX LIST */}
        <div
          className={`
            w-full md:w-[340px] 2xl:w-[400px] flex-shrink-0 border-r border-stone-100 flex-col bg-white h-full
            ${mobileView !== 'list' ? 'hidden md:flex' : 'flex'}
        `}
        >
          {/* Header */}
          <div className="p-8 border-b border-stone-100 flex-shrink-0">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-sm font-black text-stone-900 tracking-tighter uppercase">
                  Messages
                </h2>
                <p className="text-[10px] font-bold text-stone-400 mt-0.5 uppercase tracking-widest">
                  Protocol Executions
                </p>
              </div>
            </div>

            {/* ADVANCED SEARCH BOX */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Search phone or name..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-xl px-10 py-3.5 text-xs font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all group-hover:bg-white group-hover:shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5 transition-colors group-focus-within:text-stone-900" />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-300 hover:text-stone-900 uppercase transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="p-10 text-center text-stone-300">
                <p className="text-xs uppercase tracking-widest font-bold">No results found</p>
              </div>
            ) : (
              filteredConversations.map((conv: Conversation) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className={`
                  w-full text-left p-5 border-b border-stone-50 cursor-pointer relative transition-all duration-300
                  ${selectedId === conv.id ? 'bg-stone-50/80 shadow-inner' : 'hover:bg-stone-50/50 bg-white'}
                `}
                >
                  {/* Active Indicator */}
                  {selectedId === conv.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 gold-gradient rounded-r-full shadow-gold-glow"></div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-serif text-lg shadow-sm border ${selectedId === conv.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'}`}
                        >
                          {conv.initials}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          <PlatformIcon type={conv.platform} />
                        </div>
                      </div>
                      <div>
                        <h3
                          className={`text-sm font-black tracking-tight ${selectedId === conv.id ? 'text-stone-900' : 'text-stone-700'}`}
                        >
                          {conv.name}
                        </h3>
                        <p className="text-[10px] uppercase font-bold text-stone-400 mt-0.5 tracking-tight flex items-center gap-1.5">
                          <MessageCircle size={10} className="text-emerald-500" /> WhatsApp Channel
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">{conv.time}</span>
                  </div>

                  <div className="pl-14 relative">
                    {/* Escalation Badge in List - Match by phone_clean, session_id, or partial content */}
                    {openEscalations.some(e => {
                      // 1. CONTENT-BASED MATCHING (Primary)
                      // Match by comparing escalation trigger_message with conversation messages
                      const triggerMsg = (e.metadata?.trigger_message || '').toLowerCase().trim();
                      const aiOut = (e.metadata?.ai_output || '').toLowerCase().trim();

                      const hasContentMatch = conv.messages.some(msg => {
                        const msgText = (msg.text || '').toLowerCase().trim();
                        if (msgText.length < 10) return false;

                        return (
                          (triggerMsg && (msgText.includes(triggerMsg) || triggerMsg.includes(msgText))) ||
                          (aiOut && (msgText.includes(aiOut) || aiOut.includes(msgText)))
                        );
                      });

                      if (hasContentMatch) return true;

                      // 2. IDENTIFIER-BASED MATCHING (Fallback)
                      const convIdLower = conv.id.toLowerCase();
                      const phoneClean = e.phone_clean?.toLowerCase() || '';
                      const sessionId = e.metadata?.session_id?.toLowerCase() || '';

                      return (
                        convIdLower.includes(e.execution_id || '') ||
                        sessionId === convIdLower ||
                        (phoneClean && convIdLower.includes(phoneClean)) ||
                        (phoneClean && phoneClean.includes(convIdLower.slice(-9)))
                      );
                    }) && (
                        <div className="absolute right-0 top-0">
                          <span className="text-sm animate-pulse" role="img" aria-label="Siren">🚨</span>
                        </div>
                      )}
                    <p className="text-xs text-stone-500 font-light truncate mb-3">
                      {conv.messages[conv.messages.length - 1]?.text || 'No messages'}
                    </p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const hasEsc = openEscalations.some(e => {
                          const triggerMsg = (e.metadata?.trigger_message || '').toLowerCase().trim();
                          const aiOut = (e.metadata?.ai_output || '').toLowerCase().trim();
                          const contentMatch = conv.messages.some(msg => {
                            const text = (msg.text || '').toLowerCase().trim();
                            return text.length >= 10 && ((triggerMsg && text.includes(triggerMsg)) || (aiOut && text.includes(aiOut)));
                          });
                          if (contentMatch) return true;
                          const convIdLower = conv.id.toLowerCase();
                          return convIdLower.includes(e.execution_id || '') || e.metadata?.session_id?.toLowerCase() === convIdLower || (e.phone_clean && convIdLower.includes(e.phone_clean.toLowerCase()));
                        });

                        return (
                          <AppBadge variant={hasEsc ? 'error' : (conv.badgeColor === 'green' ? 'success' : 'info')}>
                            {hasEsc ? '🚨 Escalated' : conv.status}
                          </AppBadge>
                        );
                      })()}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 2. MIDDLE SECTION - CHAT AREA */}
        <div
          className={`
            flex-1 flex-col bg-[#F9FAF9] min-w-0 h-full relative
            ${mobileView === 'chat' ? 'flex w-full' : 'hidden md:flex'}
        `}
        >
          {/* Messages content - truncated for brevity in refactor but keeping same logic */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar pb-40 relative">
            {selectedConv ? (
              <>
                {selectedConv.messages.map((msg: Message) => {
                  const isAgent =
                    msg.sender === 'agent' || msg.sender === 'host' || msg.sender === 'system';

                  // Check if this message triggered an escalation by matching MESSAGE CONTENT
                  // Compare with all open escalations' trigger_message, ai_output, or reason
                  const findEscalationByMessage = () => {
                    if (isAgent || !msg.text) return null;
                    const msgLower = msg.text.toLowerCase().trim();
                    const msgFirst50 = msgLower.substring(0, 50);

                    return openEscalations.find(esc => {
                      const trigger = esc.metadata?.trigger_message?.toLowerCase()?.trim();
                      const aiOutput = esc.metadata?.ai_output?.toLowerCase()?.trim();
                      const reason = (esc.reason || esc.metadata?.reason)?.toLowerCase()?.trim();

                      // Match if message content overlaps with escalation data
                      return (
                        (trigger && (msgLower.includes(trigger) || trigger.includes(msgFirst50))) ||
                        (aiOutput && msgLower.includes(aiOutput.substring(0, 30))) ||
                        (reason && msgLower.includes(reason.substring(0, 30)))
                      );
                    });
                  };

                  const matchedEscalation = findEscalationByMessage();
                  const isEscalatedMessage = !!matchedEscalation;

                  if (msg.type === 'separator' || msg.type === 'system_notice') {
                    return (
                      <div key={msg.id} className="flex justify-center my-4">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em] bg-stone-50 px-6 py-2 rounded-full border border-stone-100 shadow-sm">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} gap-1 animate-in slide-in-from-bottom-4 ${isEscalatedMessage ? 'relative' : ''}`}
                    >
                      {/* Escalation Warning Badge */}
                      {isEscalatedMessage && matchedEscalation && (
                        <div
                          className="flex items-center gap-2 mb-2 ml-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full cursor-pointer hover:bg-red-100 transition-colors"
                          onClick={() => {
                            setActiveEscalation(matchedEscalation);
                            setShowEscalation(true);
                          }}
                        >
                          <span className="text-sm animate-pulse" role="img" aria-label="Siren">🚨</span>
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-wide">
                            Escalated • Click to resolve
                          </span>
                        </div>
                      )}

                      {!isAgent && !isEscalatedMessage && (
                        <div className="flex items-center gap-2 mb-1 ml-2">
                          <div className="w-1.5 h-1.5 rounded-full gold-gradient shadow-gold-glow animate-pulse" />
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                            Guest
                          </span>
                        </div>
                      )}

                      <div className={`flex ${isAgent ? 'flex-row-reverse' : ''} gap-5 w-full`}>
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-md transition-transform hover:scale-105 duration-300 ${isEscalatedMessage
                            ? 'bg-red-500 text-white ring-2 ring-red-300 ring-offset-2'
                            : isAgent
                              ? 'bg-stone-900 text-white'
                              : 'bg-white border border-stone-100 text-stone-500'
                            }`}
                        >
                          {isEscalatedMessage ? '🚨' : isAgent ? 'A' : selectedConv.initials}
                        </div>

                        <div
                          className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} max-w-[75%]`}
                        >
                          <div
                            className={`px-7 py-5 rounded-[2.5rem] text-[0.90rem] leading-relaxed shadow-premium-sm transition-all hover:shadow-premium ${isEscalatedMessage
                              ? 'bg-red-50 border-2 border-red-300 text-red-900 rounded-tl-none font-medium shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                              : isAgent
                                ? 'bg-stone-900 text-white rounded-tr-none border border-stone-800'
                                : 'bg-transparent border-2 border-stone-200 text-stone-800 rounded-tl-none font-medium italic'
                              }`}
                          >
                            {msg.text?.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) =>
                              part.startsWith('**') && part.endsWith('**') ? (
                                <strong key={i} className="font-extrabold">
                                  {part.slice(2, -2)}
                                </strong>
                              ) : (
                                part
                              )
                            )}
                          </div>
                          <div className={`flex items-center gap-3 mt-3 px-3`}>
                            <span className="text-[9px] text-stone-400 font-mono uppercase tracking-widest">
                              {msg.time} • READ
                            </span>
                            {isAgent && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-stone-300" />
                                <span className="text-[9px] text-gold-gradient font-bold uppercase tracking-widest flex items-center gap-1.5">
                                  <ShieldCheck size={10} />
                                  Institutional Execution
                                </span>
                              </>
                            )}
                            {isEscalatedMessage && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-red-400" />
                                <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                  🚨 Human Intervention Needed
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-4 w-full" />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-400 animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 rounded-[2rem] bg-stone-50 border border-stone-100 flex items-center justify-center mb-6 shadow-sm">
                  <Search size={32} className="opacity-20" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Select a conversation to view history</p>
                <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-stone-500 uppercase">Live Socket Active</span>
                </div>
              </div>
            )}

            {/* ACTIVE ESCALATION FLOATING NOTIFICATION */}
            {selectedConv && openEscalations.find(e => {
              const convIdLower = selectedConv.id.toLowerCase();
              const phoneClean = e.phone_clean?.toLowerCase() || '';
              const sessionId = e.metadata?.session_id?.toLowerCase() || '';
              return (
                phoneClean === convIdLower ||
                sessionId === convIdLower ||
                (phoneClean && convIdLower.includes(phoneClean)) ||
                (phoneClean && phoneClean.includes(convIdLower.slice(-9)))
              );
            }) && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 animate-in zoom-in duration-300">
                  <div
                    className="px-6 py-3 shadow-2xl border-red-500/20 bg-stone-900/90 backdrop-blur-md rounded-2xl flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      const convIdLower = selectedConv.id.toLowerCase();
                      const esc = openEscalations.find(e => {
                        const phoneClean = e.phone_clean?.toLowerCase() || '';
                        const sessionId = e.metadata?.session_id?.toLowerCase() || '';
                        return (
                          phoneClean === convIdLower ||
                          sessionId === convIdLower ||
                          (phoneClean && convIdLower.includes(phoneClean)) ||
                          (phoneClean && phoneClean.includes(convIdLower.slice(-9)))
                        );
                      });
                      if (esc) {
                        setActiveEscalation(esc);
                        setShowEscalation(true);
                      }
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                      <span className="text-sm animate-pulse" role="img" aria-label="Siren">🚨</span>
                    </div>
                    <div className="text-left">
                      <div className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">
                        Human Intervention Required
                      </div>
                      <div className="text-xs font-bold text-white">
                        Escalation Triggered for {selectedConv.id}
                      </div>
                    </div>
                    <div className="ml-4 px-3 py-1 bg-white/10 rounded-full text-[9px] font-black text-white uppercase tracking-tighter">
                      Resolve
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* DYNAMIC STATUS BAR */}
          {(() => {
            const currentEscalation = selectedConv ? openEscalations.find(e => {
              const triggerMsg = (e.metadata?.trigger_message || '').toLowerCase().trim();
              const aiOut = (e.metadata?.ai_output || '').toLowerCase().trim();
              const hasContentMatch = selectedConv.messages.some(msg => {
                const msgText = (msg.text || '').toLowerCase().trim();
                return msgText.length >= 10 && (
                  (triggerMsg && (msgText.includes(triggerMsg) || triggerMsg.includes(msgText))) ||
                  (aiOut && (msgText.includes(aiOut) || aiOut.includes(msgText)))
                );
              });
              if (hasContentMatch) return true;

              const convIdLower = selectedConv.id.toLowerCase();
              const phoneClean = e.phone_clean?.toLowerCase() || '';
              const sessionId = e.metadata?.session_id?.toLowerCase() || '';
              return (
                convIdLower.includes(e.execution_id || '') ||
                sessionId === convIdLower ||
                (phoneClean && convIdLower.includes(phoneClean)) ||
                (phoneClean && phoneClean.includes(convIdLower.slice(-9)))
              );
            }) : null;

            const hasEscalation = !!currentEscalation;

            return (
              <div className={`absolute bottom-6 left-6 right-6 py-4 px-8 backdrop-blur-xl rounded-2xl border shadow-2xl flex items-center justify-between z-10 transition-all duration-500 ${hasEscalation
                ? 'bg-red-950/90 border-red-500/30'
                : 'bg-stone-900/95 border-stone-800'
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full animate-pulse shadow-glow ${hasEscalation ? 'bg-red-500 shadow-red-500/50' : 'gold-gradient shadow-gold-glow'
                    }`} />
                  <div className={`text-[11px] font-black uppercase tracking-[0.2em] ${hasEscalation ? 'text-red-400' : 'text-white'
                    }`}>
                    {hasEscalation ? 'Human Intervention Required' : 'Autonomous Protocol Active'}
                  </div>
                </div>
                {hasEscalation && (
                  <div className="flex gap-3">
                    <AppButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveEscalation(currentEscalation);
                        setShowEscalation(true);
                      }}
                      className="bg-white/5 border-red-500/20 text-[10px] uppercase tracking-widest h-8 text-red-400 hover:text-red-300"
                    >
                      Review & Resolve
                    </AppButton>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      <EscalationDetailModal
        isOpen={showEscalation}
        onClose={() => setShowEscalation(false)}
        escalation={activeEscalation}
        onResolved={execute}
      />
    </AppPage>
  );
};

export default MessageLog;
