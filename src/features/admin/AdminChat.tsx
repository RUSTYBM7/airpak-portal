/**
 * AirPak Express - Admin Real-time Chat
 * Real-time messaging with users via support tickets
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Search, Send, Users, Clock, Check,
  AlertCircle, RefreshCw, ChevronLeft, MoreVertical,
  Phone, Mail, User, Image, Paperclip, X, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Inline WhatsApp glyph (lucide-react has no WA icon; avoid adding react-icons dep)
const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 12, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-label="WhatsApp"
  >
    <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.39c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.79.96-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.23-.74-.66-1.23-1.47-1.37-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.16 0-.42.06-.64.31-.22.25-.86.84-.86 2.06s.88 2.39 1 2.55c.12.16 1.73 2.65 4.2 3.71.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28z"/>
  </svg>
);

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'ai' | 'admin';
  content: string;
  created_at: string;
  read_by: string[];
  delivered_to?: {
    whatsapp?: boolean;
    whatsapp_msg_id?: string;
    whatsapp_error?: string;
    whatsapp_at?: string;
  };
}

interface Ticket {
  id: string;
  user_id: string;
  title: string;
  status: 'ai_handling' | 'escalated' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
  channel?: 'web' | 'whatsapp' | 'email';
  external_id?: string;        // E.164 phone for WhatsApp
  external_name?: string;      // WhatsApp profile name
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
  last_message?: string;
  unread_count?: number;
}

const AdminChat: React.FC = () => {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<'all' | 'web' | 'whatsapp'>('all');
  const [showTicketList, setShowTicketList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();

    // Subscribe to new messages
    const channel = supabase
      .channel('admin-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `ticket_id=eq.${selectedTicket?.id}`
      }, (payload) => {
        if (payload.new && selectedTicket) {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          id, user_id, title, status, priority,
          channel, external_id, external_name,
          created_at, updated_at
        `)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterChannel !== 'all') {
        query = query.eq('channel', filterChannel);
      }

      const { data, error } = await query;

      if (error) throw error;
      // Hydrate profiles only for web tickets (whatsapp tickets have no auth user)
      const webTickets = (data || []).filter(t => (t.channel || 'web') === 'web');
      const ids = webTickets.map(t => t.user_id).filter(Boolean);
      let profileMap: Record<string, { full_name: string; email: string }> = {};
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', ids.slice(0, 50));
        (profiles || []).forEach((p: any) => { profileMap[p.user_id] = { full_name: p.full_name, email: p.email }; });
      }
      setTickets((data || []).map(t => ({
        ...t,
        profile: profileMap[t.user_id] || undefined
      })));
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read_by: [...(user?.id ? [user.id] : [])] })
        .eq('ticket_id', ticketId)
        .neq('sender_id', user?.id || '');
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          sender_type: 'admin',
          content: newMessage.trim(),
          read_by: [user.id],
        });

      if (error) throw error;

      // Update ticket status if it was ai_handling
      if (selectedTicket.status === 'ai_handling') {
        await supabase
          .from('support_tickets')
          .update({
            status: 'escalated',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTicket.id);
      }

      setNewMessage('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      setSelectedTicket(prev => prev ? { ...prev, status: 'resolved' } : null);
      fetchTickets();
      toast.success('Ticket resolved');
    } catch (error) {
      console.error('Error resolving ticket:', error);
      toast.error('Failed to resolve ticket');
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      fetchTickets();
      toast.success('Ticket closed');
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast.error('Failed to close ticket');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.external_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.external_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Ticket List */}
      <div className={`w-80 bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 flex flex-col ${
        showTicketList ? 'block' : 'hidden lg:block'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare size={20} />
            Support Tickets
          </h2>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:border-[#BF5AF2]/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'escalated', 'ai_handling', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-[#BF5AF2] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {status === 'all' ? 'All' : status === 'ai_handling' ? 'AI' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['all','web','whatsapp'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilterChannel(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  filterChannel === c
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                }`}
              >
                {c === 'whatsapp' && <WhatsAppIcon size={12} />}
                {c === 'all' ? 'All channels' : c === 'web' ? 'Web' : 'WhatsApp'}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-white/40">
              <RefreshCw size={24} className="animate-spin mx-auto" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
              <p>No tickets found</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const ch = ticket.channel || 'web';
              const displayName = ch === 'whatsapp'
                ? (ticket.external_name || ticket.external_id || 'WhatsApp contact')
                : (ticket.profile?.full_name || 'Unknown User');
              return (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                  selectedTicket?.id === ticket.id ? 'bg-[#BF5AF2]/10 border-l-2 border-[#BF5AF2]' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ticket.status === 'escalated' ? 'bg-red-500/20 text-red-400' :
                      ticket.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {ticket.status === 'ai_handling' ? 'AI' : ticket.status}
                    </span>
                    {ch === 'whatsapp' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 flex items-center gap-1" title="WhatsApp channel — replies are delivered to the customer's WhatsApp">
                        <WhatsAppIcon size={10} /> WhatsApp
                      </span>
                    )}
                    {ticket.priority === 'high' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">High</span>
                    )}
                  </div>
                  <span className="text-xs text-white/40 whitespace-nowrap">
                    {formatDate(ticket.updated_at)}
                  </span>
                </div>
                <p className="text-white font-medium text-sm truncate">{ticket.title}</p>
                <p className="text-white/60 text-xs truncate mt-1 flex items-center gap-1">
                  {ch === 'whatsapp' && <WhatsAppIcon size={11} className="text-emerald-400" />}
                  {displayName}
                  {ch === 'whatsapp' && ticket.external_id && (
                    <span className="text-white/40">· {ticket.external_id}</span>
                  )}
                </p>
              </button>
              );
            })
          )}
        </div>

        {/* Refresh Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => fetchTickets()}
            className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 ml-4">
        {selectedTicket ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowTicketList(true)}
                  className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-white/60"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  (selectedTicket.channel || 'web') === 'whatsapp' ? 'bg-emerald-500' : 'bg-[#BF5AF2]'
                }`}>
                  {(selectedTicket.channel || 'web') === 'whatsapp'
                    ? <WhatsAppIcon size={20} />
                    : (selectedTicket.profile?.full_name?.[0]?.toUpperCase() || 'U')}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedTicket.title}</p>
                  <p className="text-white/60 text-sm">
                    {(selectedTicket.channel || 'web') === 'whatsapp' ? (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <WhatsAppIcon size={12} className="text-emerald-400" />
                          {selectedTicket.external_name || 'WhatsApp contact'}
                        </span>
                        {selectedTicket.external_id && (
                          <a
                            href={`https://wa.me/${String(selectedTicket.external_id).replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 text-emerald-300 hover:text-emerald-200 underline"
                          >
                            {selectedTicket.external_id}
                          </a>
                        )}
                      </>
                    ) : (
                      <>{selectedTicket.profile?.full_name} • {selectedTicket.profile?.email}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedTicket.status === 'escalated' ? 'bg-red-500/20 text-red-400' :
                  selectedTicket.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                  selectedTicket.status === 'closed' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {selectedTicket.status}
                </span>
                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                  <>
                    <button
                      onClick={handleResolveTicket}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm transition-colors"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={handleCloseTicket}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-white/40 py-8">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isAdmin = message.sender_type === 'admin';
                  const isFirstInGroup = index === 0 || messages[index - 1].sender_id !== message.sender_id;

                  return (
                    <div key={message.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                        {isFirstInGroup && (
                          <div className={`text-xs text-white/40 mb-1 ${isAdmin ? 'text-right' : ''}`}>
                            {message.sender_type === 'admin' ? 'You' : message.sender_type === 'ai' ? 'AI Assistant' : selectedTicket.profile?.full_name}
                            {' • '}
                            {formatTime(message.created_at)}
                          </div>
                        )}
                        <div className={`px-4 py-3 rounded-2xl ${
                          isAdmin
                            ? 'bg-[#BF5AF2] text-white rounded-br-md'
                            : message.sender_type === 'ai'
                            ? 'bg-blue-500/20 text-white rounded-bl-md'
                            : 'bg-white/10 text-white rounded-bl-md'
                        }`}>
                          {message.content}
                          {isAdmin && message.delivered_to?.whatsapp === true && (selectedTicket.channel || 'web') === 'whatsapp' && (
                            <div className="text-[10px] mt-1 opacity-80 flex items-center gap-1">
                              <WhatsAppIcon size={10} /> Delivered to WhatsApp
                            </div>
                          )}
                          {isAdmin && message.delivered_to?.whatsapp === false && (selectedTicket.channel || 'web') === 'whatsapp' && (
                            <div className="text-[10px] mt-1 text-red-200">
                              WhatsApp delivery failed{message.delivered_to?.whatsapp_error ? `: ${message.delivered_to.whatsapp_error}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type a message..."
                  disabled={selectedTicket.status === 'closed' || selectedTicket.status === 'resolved'}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#BF5AF2]/50 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim() || selectedTicket.status === 'closed' || selectedTicket.status === 'resolved'}
                  className="px-6 py-3 bg-[#BF5AF2] hover:bg-[#9B4DCA] rounded-xl text-white transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              {selectedTicket.status === 'resolved' && (
                <p className="text-center text-white/40 text-sm mt-2">This ticket has been resolved</p>
              )}
              {selectedTicket.status === 'closed' && (
                <p className="text-center text-white/40 text-sm mt-2">This ticket is closed</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a ticket to start chatting</p>
              <p className="text-sm mt-2">Choose from the list on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;