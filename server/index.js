import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const PORT = process.env.PORT || 3001;

const isSupabaseConfigured = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const isGroqConfigured = Boolean(process.env.GROQ_API_KEY);
const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

console.log('--- AERO Backend Diagnostics ---');
console.log(`Supabase URL configured: ${process.env.VITE_SUPABASE_URL ? 'YES' : 'NO'}`);
console.log(`Supabase key configured: ${process.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'YES' : 'NO'}`);
console.log(`Groq key configured: ${isGroqConfigured ? 'YES' : 'NO'}`);
console.log(`Groq model: ${groqModel}`);
console.log('--------------------------------');

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AERO AI Backend',
    timestamp: new Date().toISOString()
  });
});

// Initialize Supabase admin client for auth verification only if configured
const supabase = isSupabaseConfigured 
  ? createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  : null;

// Initialize Groq SDK only if configured
const groq = process.env.GROQ_API_KEY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Middleware to authenticate requests using Supabase JWT
const authenticateUser = async (req, res, next) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Backend authentication is not configured.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided.' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  req.user = user;
  next();
};

const SYSTEM_PROMPT = `You are AERO Assistant, an AI assistant integrated into an emergency response coordination platform.

Your purpose is to assist emergency-response operators with information organization, incident summaries, routing-related reasoning, operational checklists, and coordination support.

You are NOT a replacement for emergency dispatchers, medical professionals, police, firefighters, or trained emergency personnel.

Never claim that you contacted emergency services, hospitals, police, ambulances, or traffic authorities unless the application actually performed that action.

Never fabricate GPS coordinates, traffic conditions, hospital capacity, ETAs, routes, or emergency incidents.

If required operational data is unavailable, explicitly say that the data is unavailable.

For medical questions, provide general informational guidance only and clearly recommend following trained emergency medical protocols and contacting appropriate emergency services when necessary.

Keep responses concise during active incidents.

Prioritize:
1. Safety
2. Accuracy
3. Clarity
4. Coordination
5. Actionable information

When given an incident, structure the response where useful as:
Situation
Priority
Known Information
Recommended Coordination
Missing Information
Next Step

Always distinguish between actual application data and assumptions.`;

// Chatbot API Endpoint
app.post('/api/ai/chat', authenticateUser, async (req, res) => {
  try {
    const { message, conversationId, incidentContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'A valid message string is required.' });
    }

    if (!groq) {
      return res.status(503).json({ error: 'AI Assistant is currently unavailable due to missing GROQ configuration.' });
    }

    // Initialize authenticated Supabase client for DB operations (RLS enforced)
    const token = req.headers.authorization.replace('Bearer ', '');
    const userSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    let currentConvId = conversationId;
    let history = [];

    try {
      // 1. Initialize Conversation if missing
      if (!currentConvId) {
        currentConvId = crypto.randomUUID();
        const { error: convError } = await userSupabase
          .from('ai_conversations')
          .insert({
            id: currentConvId,
            title: `Chat ${new Date().toLocaleTimeString()}`,
            user_id: req.user.id
          });

        if (convError) {
          console.error('Failed to create conversation, proceeding without persistence:', convError);
        }
      }

      // 2. Save User Message
      if (currentConvId) {
        const userMessageId = crypto.randomUUID();
        const { error: userMsgError } = await userSupabase
          .from('ai_messages')
          .insert({
            id: userMessageId,
            conversation_id: currentConvId,
            user_id: req.user.id,
            role: 'user',
            content: message
          });

        if (userMsgError) {
          console.error('Failed to save user message, proceeding without persistence:', userMsgError);
        }
      }

      // 3. Load Conversation History
      if (currentConvId) {
        const { data: dbHistory, error: historyError } = await userSupabase
          .from('ai_messages')
          .select('role, content')
          .eq('conversation_id', currentConvId)
          .order('created_at', { ascending: true });

        if (historyError) {
          console.error('Failed to load history, proceeding without context:', historyError);
        } else if (dbHistory) {
          history = dbHistory;
        }
      }
    } catch (dbError) {
      console.warn('Database error occurred during chat initialization. Proceeding without persistence.', dbError);
    }

    // 4. Build System Prompt & Messages for Groq
    let currentSystemPrompt = SYSTEM_PROMPT;
    if (incidentContext) {
      currentSystemPrompt += `\n\n--- ACTIVE INCIDENT CONTEXT ---\n${incidentContext}`;
    }

    const chatMessages = [
      { role: 'system', content: currentSystemPrompt },
      ...history.map(h => ({ role: h.role, content: h.content }))
    ];

    // 5. Call Groq
    const chatCompletion = await groq.chat.completions.create({
      messages: chatMessages,
      model: groqModel,
      temperature: 0.2,
      max_tokens: 1024,
    });

    const reply = chatCompletion.choices[0]?.message?.content || '';

    // 6. Save Assistant Message
    const { error: asstMsgError } = await userSupabase
      .from('ai_messages')
      .insert({
        id: crypto.randomUUID(),
        conversation_id: currentConvId,
        user_id: req.user.id,
        role: 'assistant',
        content: reply
      });

    if (asstMsgError) {
      console.error('Failed to save assistant message:', asstMsgError);
      // We still return the reply to the user, even if history persistence fails
    }

    // 7. Return Authoritative Response
    res.json({
      success: true,
      conversationId: currentConvId,
      message: {
        role: 'assistant',
        content: reply
      }
    });

  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ error: 'AI service is temporarily busy due to rate limits.' });
    }
    console.error('AI Endpoint Error:', error.message || error);
    res.status(500).json({ error: 'AERO AI is temporarily unavailable. Please try again.' });
  }
});

// Google Places API (New) Proxy Endpoint
app.post('/api/places/hospitals', authenticateUser, async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Google Maps API Key is not configured on the server.' });
    }

    const { latitude, longitude, radius = 15000 } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.businessStatus,places.googleMapsUri'
      },
      body: JSON.stringify({
        includedTypes: ['hospital', 'general_hospital'],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: radius
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API Error:', errorText);
      return res.status(response.status).json({ error: 'Failed to fetch nearby hospitals from Google Places API.' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Places Proxy Endpoint Error:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch places data.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AERO AI Backend Server running on port ${PORT}`);
});
