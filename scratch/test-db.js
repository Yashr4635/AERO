import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  // 1. Sign up a temp user
  const email = `test_${Date.now()}@aero.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123',
  });
  
  if (authError) {
    console.error('Signup Error:', authError);
    return;
  }
  
  console.log('Signed up user:', authData.user?.id);
  
  // 2. Try to insert conversation
  const { data: conv, error: convError } = await supabase
    .from('ai_conversations')
    .insert({
      title: 'Test Conversation',
      user_id: authData.user.id
    })
    .select()
    .single();
    
  if (convError) {
    console.error('Insert Error:', convError);
  } else {
    console.log('Insert Success:', conv);
  }
}
test();
