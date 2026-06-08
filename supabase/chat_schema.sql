-- Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  admin_id TEXT,
  subject TEXT DEFAULT 'General Inquiry',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed')),
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin ON chat_conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- User can read/create their conversations
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own conversations" ON chat_conversations
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Admin can view all conversations
CREATE POLICY "Admins can view all conversations" ON chat_conversations
  FOR SELECT USING (true);

-- Messages policies
CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all messages" ON chat_messages
  FOR SELECT USING (true);
