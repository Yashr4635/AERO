import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInit() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'yashr4635@gmail.com',
    password: 'password123'
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  const user = authData.user;
  console.log('Logged in as:', user.id);

  console.log('Creating conversation...');
  const newId = crypto.randomUUID();
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ id: newId, title: 'Test Chat', user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('INSERT FAILED:', JSON.stringify(error, null, 2));
  } else {
    console.log('INSERT SUCCESS:', data);
  }
}

testInit();
