/**
 * AirPak Express - Real-Time Chat Edge Function
 * Handles chat messages, conversations, and real-time sync
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory chat store for real-time (production should use Supabase Realtime)
const chatSessions = new Map()

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, data } = await req.json()

    switch (action) {
      case 'send_message': {
        const { conversation_id, sender_id, sender_type, message, attachments } = data

        // Create message record
        const { data: msg, error } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id,
            sender_id,
            sender_type,
            message,
            attachments: attachments || [],
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error

        // Update conversation last message
        await supabase
          .from('chat_conversations')
          .update({
            last_message: message,
            last_message_at: new Date().toISOString(),
          })
          .eq('id', conversation_id)

        return new Response(JSON.stringify({ success: true, message: msg }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'get_conversations': {
        const { user_id, user_type } = data

        const { data: conversations, error } = await supabase
          .from('chat_conversations')
          .select('*')
          .or(`user_id.eq.${user_id},admin_id.eq.${user_id}`)
          .order('last_message_at', { ascending: false })

        if (error) throw error

        return new Response(JSON.stringify({ success: true, conversations }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'get_messages': {
        const { conversation_id, limit = 50, offset = 0 } = data

        const { data: messages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversation_id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) throw error

        // Mark as read
        await supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversation_id)
          .neq('sender_type', data.user_type)

        return new Response(JSON.stringify({ success: true, messages: messages?.reverse() || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'create_conversation': {
        const { user_id, user_email, admin_id, subject } = data

        // Check if conversation exists
        const { data: existing } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('user_id', user_id)
          .eq('status', 'active')
          .single()

        if (existing) {
          return new Response(JSON.stringify({ success: true, conversation: existing }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Create new conversation
        const { data: conversation, error } = await supabase
          .from('chat_conversations')
          .insert({
            user_id,
            user_email,
            admin_id: admin_id || null,
            subject: subject || 'General Inquiry',
            status: 'active',
            created_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify({ success: true, conversation }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'get_unread_count': {
        const { user_id, user_type } = data

        const { data: messages } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('sender_type', user_type === 'user' ? 'admin' : 'user')
          .is('read_at', null)

        // Get conversations for this user
        const { data: conversations } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq(user_type === 'user' ? 'user_id' : 'admin_id', user_id)

        const conversationIds = conversations?.map(c => c.id) || []
        const unreadCount = messages?.filter(m => conversationIds.includes(m.conversation_id)).length || 0

        return new Response(JSON.stringify({ success: true, count: unreadCount }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'mark_read': {
        const { conversation_id, user_type } = data

        await supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversation_id)
          .neq('sender_type', user_type)

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'close_conversation': {
        const { conversation_id } = data

        const { error } = await supabase
          .from('chat_conversations')
          .update({ status: 'closed' })
          .eq('id', conversation_id)

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'typing': {
        const { conversation_id, user_id, is_typing } = data

        // Store typing status (expires in 5 seconds)
        const key = `${conversation_id}:${user_id}`
        chatSessions.set(key, { is_typing, timestamp: Date.now() })

        setTimeout(() => {
          chatSessions.delete(key)
        }, 5000)

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})