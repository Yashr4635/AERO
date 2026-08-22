-- AERO Platform Supabase Schema

-- 1. PROFILES TABLE
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('ambulance_operator', 'traffic_operator', 'hospital_operator', 'admin', 'user')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. EMERGENCY INCIDENTS TABLE
CREATE TABLE emergency_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  incident_type TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dispatched', 'en_route', 'arrived', 'resolved', 'cancelled')),
  ambulance_id TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  destination_hospital TEXT,
  destination_latitude DOUBLE PRECISION,
  destination_longitude DOUBLE PRECISION,
  eta_minutes INTEGER,
  route_status TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 3. AI CHAT HISTORY TABLES
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Profiles: users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Incidents: users can read incidents they created (admins could read all, omitted for simplicity)
CREATE POLICY "Users can view their incidents" 
ON emergency_incidents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert incidents" 
ON emergency_incidents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their incidents" 
ON emergency_incidents FOR UPDATE 
USING (auth.uid() = user_id);

-- Conversations: users can only see their own
CREATE POLICY "Users can view own conversations" 
ON ai_conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" 
ON ai_conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" 
ON ai_conversations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" 
ON ai_conversations FOR DELETE 
USING (auth.uid() = user_id);

-- Messages: users can only see messages from their conversations
CREATE POLICY "Users can view own messages" 
ON ai_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" 
ON ai_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. INDEXES for performance
CREATE INDEX idx_incidents_user_id ON emergency_incidents(user_id);
CREATE INDEX idx_incidents_status ON emergency_incidents(status);
CREATE INDEX idx_ai_conv_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_msg_conv_id ON ai_messages(conversation_id);
