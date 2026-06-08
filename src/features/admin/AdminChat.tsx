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

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'ai' | 'admin';
  content: string;
  created_at: string;
  read_by: string[];
}

interface Ticket {
  id: string;
  user_id: string;
  title: string;
  status: 'ai_handling' | 'escalated' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
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
          *,
          profile:profiles(full_name, email)
        `)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
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
      ticket.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase());
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
            filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                  selectedTicket?.id === ticket.id ? 'bg-[#BF5AF2]/10 border-l-2 border-[#BF5AF2]' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    ticket.status === 'escalated' ? 'bg-red-500/20 text-red-400' :
                    ticket.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {ticket.status === 'ai_handling' ? 'AI' : ticket.status}
                  </span>
                  <span className="text-xs text-white/40">
                    {formatDate(ticket.updated_at)}
                  </span>
                </div>
                <p className="text-white font-medium text-sm truncate">{ticket.title}</p>
                <p className="text-white/60 text-xs truncate mt-1">
                  {ticket.profile?.full_name || 'Unknown User'}
                </p>
              </button>
            ))
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
                <div className="w-10 h-10 rounded-full bg-[#BF5AF2] flex items-center justify-center text-white font-bold">
                  {selectedTicket.profile?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedTicket.title}</p>
                  <p className="text-white/60 text-sm">
                    {selectedTicket.profile?.full_name} • {selectedTicket.profile?.email}
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