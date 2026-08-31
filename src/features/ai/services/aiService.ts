import { supabase } from '../../../lib/supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export const aiService = {
  async sendMessage(message: string, conversationId: string | null, incidentContext?: string): Promise<{ reply: string, conversationId: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    const response = await fetch(`${apiUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ message, conversationId, incidentContext })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to communicate with AERO AI.');
    }

    const data = await response.json();
    return {
      reply: data.message.content,
      conversationId: data.conversationId
    };
  },

  async loadConversations() {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('created_at', { ascending: false });
    
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

  async deleteConversation(conversationId: string) {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId);
    
    if (error) throw error;
  },

  async renameConversation(conversationId: string, title: string) {
    const { error } = await supabase
      .from('ai_conversations')
      .update({ title })
      .eq('id', conversationId);
    
    if (error) throw error;
  }
};
