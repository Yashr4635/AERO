import { supabase } from '../../../lib/supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export const aiService = {
  async sendMessage(messages: { role: string; content: string }[], incidentContext?: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch('http://localhost:3001/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ messages, incidentContext })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to communicate with AERO AI.');
    }

    const data = await response.json();
    return data.reply;
  },

  async loadConversations() {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createConversation(title: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ title, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async loadMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async saveMessage(conversationId: string, role: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role,
        content
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};
