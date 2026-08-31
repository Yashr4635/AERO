import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../../lib/supabase';
import { aiService, type ChatMessage } from '../services/aiService';
import { realtimeService } from '../../../services/realtimeService';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const [hasInitialized, setHasInitialized] = useState(false);
  const [userRole, setUserRole] = useState<string>('Unknown');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (user?.user_metadata?.role) {
        setUserRole(user.user_metadata.role);
      }
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (!hasInitialized) {
        initConversation();
      }
    }
  }, [messages, isOpen, isLoading, hasInitialized]);

  const initConversation = async () => {
    setHasInitialized(true);
    try {
      const convs = await aiService.loadConversations();
      setConversations(convs);
      
      if (!activeConversationId) {
        if (convs.length > 0) {
          const latestId = convs[0].id;
          setActiveConversationId(latestId);
          const msgs = await aiService.loadMessages(latestId);
          setMessages(msgs);
        }
        // If there's no history, we wait for the first user message 
        // to naturally initialize the conversation via the backend.
      }
    } catch (err) {
      console.error('Failed to init conversation:', err);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await aiService.loadConversations();
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setActiveConversationId(id);
      setShowHistory(false);
      setMessages([]);
      setIsLoading(true);
      const msgs = await aiService.loadMessages(id);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages', err);
      setError('Failed to load conversation history.');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    setActiveConversationId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      await aiService.deleteConversation(id);
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const generateIncidentContext = () => {
    const active = realtimeService.getActiveEmergency();
    if (!active) return `User Role: ${userRole}\nNo active emergency incidents currently.`;
    
    return `
User Role: ${userRole}
--- ACTIVE EMERGENCY CONTEXT ---
Incident ID: ${active.id}
Status: ${active.status}
Priority: ${active.priority}
Type: ${active.category}
Ambulance: ${active.ambulanceId || 'Unassigned'}
Hospital: ${active.hospital?.name || 'Unknown'}
ETA: ${active.route?.etaSeconds ? Math.floor(active.route.etaSeconds/60) + ' mins' : 'Unknown'}
`;
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userText = text.trim();
    setInput('');
    setError('');

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const context = generateIncidentContext();
      
      // Send directly to authoritative backend endpoint
      const response = await aiService.sendMessage(userText, activeConversationId, context);

      const newAssistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newAssistantMsg]);
      
      // Update local state if a new conversation was created
      if (response.conversationId && response.conversationId !== activeConversationId) {
        setActiveConversationId(response.conversationId);
        loadConversations();
      }

    } catch (err: any) {
      setError(err.message || 'Message failed to send. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    'Summarize my current incident',
    'Find the nearest suitable hospital',
    'What traffic risks should I watch?',
    'What should I do for this emergency?'
  ];

  return (
    <>
      {/* Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-[999] w-14 h-14 bg-navy-800 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-400 rounded-full shadow-[0_0_20px_rgba(8,145,178,0.3)] flex items-center justify-center transition-all hover:scale-105 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <div className="absolute inset-0 rounded-full animate-ping bg-cyan-400/20" style={{ animationDuration: '3s' }}></div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
          <path d="M12 8v4l3 3"></path>
        </svg>
      </button>

      {/* Main Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[1000] w-full sm:w-[420px] max-w-[calc(100vw-32px)] h-[calc(100vh-64px)] sm:h-[650px] max-h-[800px] bg-navy-950/95 backdrop-blur-xl border border-cyan-800/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-navy-900/80 p-3.5 border-b border-cyan-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 text-navy-400 hover:text-cyan-400 hover:bg-navy-800 rounded transition-colors"
              title="Conversation History"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-cyan-900/40 border border-cyan-500/40 flex items-center justify-center relative shadow-[0_0_10px_rgba(8,145,178,0.2)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-navy-900 rounded-full"></span>
            </div>
            <div>
              <h3 className="font-bold text-navy-50 text-[13px] tracking-wide">AERO INTELLIGENCE</h3>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                OPERATIONAL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={createNewChat} className="p-1.5 text-navy-400 hover:text-cyan-400 transition-colors" title="New Chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-navy-400 hover:text-red-400 transition-colors" title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* History Sidebar */}
          <div className={`absolute inset-y-0 left-0 w-64 bg-navy-900/95 border-r border-navy-800 z-10 transition-transform duration-300 overflow-y-auto ${showHistory ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4">
              <h4 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-4">Chat History</h4>
              {conversations.length === 0 ? (
                <p className="text-sm text-navy-500 text-center py-4">No recent conversations.</p>
              ) : (
                <div className="space-y-1">
                  {conversations.map(conv => (
                    <div 
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${activeConversationId === conv.id ? 'bg-cyan-900/30 border border-cyan-800/50' : 'hover:bg-navy-800'}`}
                    >
                      <div className="truncate flex-1 min-w-0">
                        <p className="text-sm text-navy-100 truncate font-medium">{conv.title}</p>
                        <p className="text-[10px] text-navy-500">{new Date(conv.created_at).toLocaleDateString()}</p>
                      </div>
                      <button 
                        onClick={(e) => deleteConversation(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-navy-500 hover:text-red-400 transition-all shrink-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5" onClick={() => setShowHistory(false)}>
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-80 mt-8">
                <div className="w-16 h-16 rounded-2xl bg-cyan-900/20 border border-cyan-500/20 flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AERO Intelligence</h3>
                <p className="text-sm text-navy-400 max-w-[250px] mb-8">Your emergency operations copilot. How can I assist with your coordination today?</p>
                
                <div className="flex flex-col gap-2 w-full max-w-[300px]">
                  {quickActions.map(action => (
                    <button
                      key={action}
                      onClick={() => handleSend(action)}
                      className="bg-navy-800/50 hover:bg-cyan-900/30 border border-navy-700 hover:border-cyan-700/50 text-cyan-300 text-xs px-4 py-2.5 rounded-xl transition-colors font-medium text-left flex items-center justify-between group"
                    >
                      {action}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1.5 ml-1">
                    <div className="w-5 h-5 rounded bg-cyan-900/50 border border-cyan-700/50 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path></svg>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">AERO SYSTEM</span>
                  </div>
                )}
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-sm'
                      : 'bg-navy-800 border border-navy-700/50 text-navy-50 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-snug prose-li:my-0.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start">
                 <div className="flex items-center gap-2 mb-1.5 ml-1">
                    <div className="w-5 h-5 rounded bg-cyan-900/50 border border-cyan-700/50 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path></svg>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">AERO SYSTEM</span>
                  </div>
                <div className="bg-navy-800 border border-navy-700/50 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                  <span className="text-xs text-navy-400 mr-2 font-medium">Analyzing context...</span>
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="mx-auto mb-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <p className="text-red-400 text-xs font-medium mb-3">{error}</p>
                <button onClick={() => setError('')} className="bg-red-500/20 px-4 py-1.5 rounded-lg text-red-300 font-bold text-xs hover:bg-red-500/30 transition-colors">
                  Dismiss
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-navy-900/80 border-t border-cyan-900/40 shrink-0">
          <div className="relative flex items-end bg-navy-950 border border-navy-700 rounded-xl focus-within:border-cyan-600 focus-within:ring-1 focus-within:ring-cyan-600/50 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AERO Intelligence..."
              className="w-full bg-transparent p-3.5 text-[13px] text-white placeholder-navy-500 focus:outline-none resize-none max-h-[120px] scrollbar-thin"
              rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 4) : 1}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-3.5 text-cyan-500 hover:text-cyan-400 disabled:opacity-40 transition-colors shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLoading ? "animate-pulse" : ""}>
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[9px] text-navy-500 font-medium">ENTER to send, SHIFT+ENTER for new line</span>
          </div>
        </div>
      </div>
    </>
  );
}
