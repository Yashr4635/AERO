import { useState, useRef, useEffect } from 'react';
import { aiService, type ChatMessage } from '../services/aiService';

interface AIAssistantProps {
  incidentContext?: string;
}

export function AIAssistant({ incidentContext }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Load existing or create new conversation when opened
  useEffect(() => {
    if (isOpen && !conversationId) {
      initConversation();
    }
  }, [isOpen]);

  const initConversation = async () => {
    try {
      // For simplicity, we just create a new one each time they open a fresh session.
      // A more robust implementation would load the history sidebar.
      const conv = await aiService.createConversation(`Chat ${new Date().toLocaleTimeString()}`);
      setConversationId(conv.id);
      
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Hello. I'm AERO Assistant.\nHow can I help coordinate this incident?",
        created_at: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
    } catch (err) {
      console.error('Failed to init conversation:', err);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading || !conversationId) return;

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
      // Save user message to DB
      await aiService.saveMessage(conversationId, 'user', userText);

      // Send to Groq via Express Backend
      // We pass the conversation history
      const apiMessages = messages
        .filter(m => m.role !== 'system' && m.id !== 'welcome')
        .concat(newUserMsg)
        .map(m => ({ role: m.role, content: m.content }));

      const reply = await aiService.sendMessage(apiMessages, incidentContext);

      const newAssistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newAssistantMsg]);
      
      // Save assistant message to DB
      await aiService.saveMessage(conversationId, 'assistant', reply);

    } catch (err: any) {
      setError(err.message || 'AERO AI is temporarily unavailable. Please try again.');
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
    'Summarize Incident',
    'Identify Missing Data',
    'Prepare Handoff',
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-[999] w-14 h-14 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-[0_0_20px_rgba(8,145,178,0.4)] flex items-center justify-center transition-transform hover:scale-110 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 z-[1000] w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-48px)] bg-navy-900 border border-cyan-800/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-navy-950 p-4 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-navy-950 rounded-full"></span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">AERO AI ASSISTANT</h3>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">● Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-navy-400 hover:text-white p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-sm'
                    : 'bg-navy-800 border border-navy-700 text-navy-100 rounded-bl-sm'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Quick Actions (only show if last message is from assistant and no error) */}
          {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !isLoading && !error && (
            <div className="flex flex-wrap gap-2 mt-2">
              {quickActions.map(action => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="bg-navy-800 hover:bg-cyan-900/40 border border-cyan-800/30 text-cyan-300 text-[11px] px-3 py-1.5 rounded-full transition-colors font-medium"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-navy-800 border border-navy-700 rounded-2xl rounded-bl-sm p-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-center">
              {error}
              <button onClick={() => setError('')} className="block mt-2 w-full bg-red-500/20 py-1.5 rounded text-red-300 font-bold hover:bg-red-500/30">
                Dismiss
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-navy-950 border-t border-navy-800">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AERO anything..."
              className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-navy-500 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 resize-none min-h-[44px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-500 hover:text-cyan-400 disabled:opacity-50 disabled:hover:text-cyan-500"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
            </button>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] text-navy-500">Press Enter to send, Shift+Enter for new line</span>
            <button 
              onClick={initConversation}
              className="text-[10px] text-cyan-600 hover:text-cyan-400 font-bold"
            >
              NEW CHAT
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
