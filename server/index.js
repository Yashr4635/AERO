import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const isSupabaseConfigured = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

if (!process.env.GROQ_API_KEY) {
  console.warn('AERO Backend Configuration Error\nMissing:\n- GROQ_API_KEY\nAdd this value to .env to enable the AI assistant.');
}

if (!isSupabaseConfigured) {
  console.warn('AERO Backend Configuration Error\nMissing:\n- VITE_SUPABASE_URL\n- VITE_SUPABASE_PUBLISHABLE_KEY\nAdd these values to .env to enable auth verification.');
}

// Initialize Supabase admin client for auth verification only if configured
const supabase = isSupabaseConfigured 
  ? createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  : null;

// Initialize Groq SDK only if configured
const groq = process.env.GROQ_API_KEY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;
const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

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
    const { messages, incidentContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Valid messages array is required.' });
    }

    if (!groq) {
      return res.status(503).json({ error: 'AI Assistant is currently unavailable due to missing GROQ configuration.' });
    }

    // Build the system message with incident context if available
    let currentSystemPrompt = SYSTEM_PROMPT;
    if (incidentContext) {
      currentSystemPrompt += `\n\n--- ACTIVE INCIDENT CONTEXT ---\n${incidentContext}`;
    }

    const chatMessages = [
      { role: 'system', content: currentSystemPrompt },
      ...messages
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: chatMessages,
      model: groqModel,
      temperature: 0.2,
      max_tokens: 1024,
    });

    const reply = chatCompletion.choices[0]?.message?.content || '';

    res.json({ reply });
  } catch (error) {
    console.error('Groq API Error:', error);
    res.status(500).json({ error: 'AERO AI is temporarily unavailable. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`AERO AI Backend Server running on port ${PORT}`);
});
