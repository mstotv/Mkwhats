'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Headphones,
  MessageCircle,
  Send,
  Mail,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Loader2,
  ShieldCheck,
  Plus,
  Paperclip,
  Image as ImageIcon,
  X,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Check,
  RotateCcw,
  User,
  Shield,
  Search,
  Megaphone,
  Bell,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';

interface SiteSupportSettings {
  support_whatsapp?: string;
  support_whatsapp_url?: string;
  support_telegram?: string;
  support_telegram_url?: string;
  support_email?: string;
  platform_name?: string;
  platform_name_ar?: string;
  platform_name_en?: string;
  user_panel_support_enabled?: {
    whatsapp?: boolean;
    telegram?: boolean;
    email?: boolean;
  };
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'resolved' | 'closed';
  broadcast_id?: string | null;
  is_announcement?: boolean;
  is_read_by_user?: boolean;
  last_reply_at: string;
  created_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'admin';
  sender_id: string;
  message_text: string;
  attachments?: { url: string; name?: string; type?: string }[];
  created_at: string;
}

function renderFormattedMessage(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-extrabold text-emerald-400 underline hover:text-emerald-300 transition-colors break-all bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 my-0.5"
        >
          <span>{part}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      );
    }
    return part;
  });
}

export function SupportPanel() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(true);
  const [supportData, setSupportData] = useState<SiteSupportSettings>({});

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'closed'>('all');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<'tickets' | 'announcements' | 'all'>('announcements');
  const [searchQuery, setSearchQuery] = useState('');

  // New Ticket Modal State
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newMessageText, setNewMessageText] = useState('');
  const [newAttachments, setNewAttachments] = useState<{ url: string; name: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Reply State inside Chat Modal
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<{ url: string; name: string }[]>([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeTicketIdRef = useRef<string | null>(null);

  // Fetch Site Settings
  useEffect(() => {
    async function loadSupportInfo() {
      try {
        setLoading(true);
        const res = await fetch('/api/site-settings');
        if (res.ok) {
          const data = await res.json();
          setSupportData(data.settings || {});
        }
      } catch (err) {
        console.error('Failed to load support settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSupportInfo();
  }, []);

  // Fetch Tickets
  async function fetchTickets() {
    try {
      setTicketsLoading(true);
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        const localRead = getLocalReadTicketIds();
        const merged = (data.tickets || []).map((t: SupportTicket) => ({
          ...t,
          is_read_by_user: Boolean(t.is_read_by_user || localRead.includes(t.id)),
        }));
        setTickets(merged);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  }

  const searchParams = useSearchParams();
  const ticketIdFromUrl = searchParams.get('ticketId');

  useEffect(() => {
    fetchTickets();
  }, []);

  // Auto-open ticket if ticketId parameter exists in URL
  useEffect(() => {
    if (ticketIdFromUrl && tickets.length > 0) {
      const target = tickets.find((t) => t.id === ticketIdFromUrl);
      if (target && selectedTicket?.id !== target.id) {
        handleOpenTicketChat(target);
      }
    }
  }, [ticketIdFromUrl, tickets]);

  // Scroll chat to bottom
  useEffect(() => {
    if (ticketMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketMessages]);

  function saveReadTicketIdToLocal(id: string | string[]) {
    try {
      const stored = localStorage.getItem('read_support_ticket_ids');
      const list: string[] = stored ? JSON.parse(stored) : [];
      const idsToAdd = Array.isArray(id) ? id : [id];
      const merged = Array.from(new Set([...list, ...idsToAdd]));
      localStorage.setItem('read_support_ticket_ids', JSON.stringify(merged));
    } catch (_) {}
  }

  function getLocalReadTicketIds(): string[] {
    try {
      const stored = localStorage.getItem('read_support_ticket_ids');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  }

  // Open & Close Chat Modal Handlers
  async function handleOpenTicketChat(ticket: SupportTicket) {
    activeTicketIdRef.current = ticket.id;
    setSelectedTicket({ ...ticket, is_read_by_user: true });
    setMessagesLoading(true);

    saveReadTicketIdToLocal(ticket.id);

    // Update read state locally so unread badges instantly decrease/disappear
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, is_read_by_user: true } : t))
    );

    // Mark as read silently on server & notify header component
    fetch(`/api/support/tickets/${ticket.id}/read`, { method: 'POST' }).catch(() => {});
    fetch('/api/support/tickets/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: ticket.id }),
    })
      .then(() => {
        window.dispatchEvent(new Event('unread-tickets-updated'));
      })
      .catch(() => {});

    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`);
      if (res.ok && activeTicketIdRef.current === ticket.id) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
        setTicketMessages(data.messages || []);
      }
    } catch (err) {
      toast.error(isAr ? 'فشل تحميل محادثة التذكرة' : 'Failed to load ticket conversation');
    } finally {
      if (activeTicketIdRef.current === ticket.id) {
        setMessagesLoading(false);
      }
    }
  }

  function handleCloseTicketChat() {
    activeTicketIdRef.current = null;
    setSelectedTicket(null);
  }

  async function handleMarkAllAsRead() {
    const allIds = tickets.map((t) => t.id);
    saveReadTicketIdToLocal(allIds);
    setTickets((prev) => prev.map((t) => ({ ...t, is_read_by_user: true })));

    fetch('/api/support/tickets/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketIds: allIds }),
    })
      .then(() => {
        window.dispatchEvent(new Event('unread-tickets-updated'));
        toast.success(isAr ? 'تم تحديد جميع الإشعارات كمقروءة ✅' : 'All notifications marked as read ✅');
      })
      .catch(() => {});
  }

  // Silent refresh for live polling (no spinner flicker)
  async function refreshTicketChatSilently(ticketId: string) {
    if (activeTicketIdRef.current !== ticketId) return;
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`);
      if (res.ok && activeTicketIdRef.current === ticketId) {
        const data = await res.json();
        if (activeTicketIdRef.current === ticketId) {
          setSelectedTicket(data.ticket);
          setTicketMessages(data.messages || []);
        }
      }
    } catch {
      // Ignore silent refresh errors
    }
  }

  // Realtime & Live Polling Effect for Ticket Chat
  useEffect(() => {
    if (!selectedTicket?.id) return;
    const ticketId = selectedTicket.id;
    const supabase = createClient();

    // 1. Live 3-second polling interval
    const interval = setInterval(() => {
      refreshTicketChatSilently(ticketId);
    }, 3000);

    // 2. Supabase Realtime channel subscription
    const channel = supabase
      .channel(`support_ticket_user:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          refreshTicketChatSilently(ticketId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${ticketId}`,
        },
        () => {
          refreshTicketChatSilently(ticketId);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  // Upload image handler
  async function handleFileUpload(file: File, isReply = false) {
    try {
      if (isReply) setSendingReply(true);
      else setUploadingImage(true);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/support/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'فشل رفع الصورة' : 'Image upload failed'));
        return;
      }

      const newAttachment = { url: data.url, name: file.name };
      if (isReply) {
        setReplyAttachments((prev) => [...prev, newAttachment]);
      } else {
        setNewAttachments((prev) => [...prev, newAttachment]);
      }
      toast.success(isAr ? 'تم إرفاق الصورة بنجاح 📷' : 'Image attached successfully 📷');
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ أثناء الرفع' : 'Upload error occurred'));
    } finally {
      setUploadingImage(false);
      setSendingReply(false);
    }
  }

  // Create Ticket Submit
  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim() || !newMessageText.trim()) {
      toast.error(isAr ? 'يرجى كتابة عنوان المشكلة وتفاصيل الرسالة' : 'Please provide ticket subject and description');
      return;
    }

    try {
      setSubmittingTicket(true);
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject,
          priority: newPriority,
          message_text: newMessageText,
          attachments: newAttachments,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'فشل إنشاء التذكرة' : 'Ticket creation failed'));
        return;
      }

      toast.success(isAr ? 'تم إنشاء تذكرة الدعم الفني بنجاح! 🎫' : 'Support ticket created successfully! 🎫');
      setIsNewTicketOpen(false);
      setNewSubject('');
      setNewMessageText('');
      setNewAttachments([]);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'));
    } finally {
      setSubmittingTicket(false);
    }
  }

  // Send Reply Submit
  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!replyText.trim() && replyAttachments.length === 0) return;

    try {
      setSendingReply(true);
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: replyText,
          attachments: replyAttachments,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'فشل إرسال الرد' : 'Failed to send reply'));
        return;
      }

      setTicketMessages((prev) => [...prev, data.message]);
      setReplyText('');
      setReplyAttachments([]);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'خطأ في الاتصال' : 'Connection error'));
    } finally {
      setSendingReply(false);
    }
  }

  // Update Status Handler (Resolve / Reopen / Close)
  async function handleUpdateStatus(newStatus: 'open' | 'resolved' | 'closed') {
    if (!selectedTicket) return;
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || (isAr ? 'فشل تحديث حالة التذكرة' : 'Failed to update status'));
        return;
      }

      setSelectedTicket(data.ticket);
      toast.success(
        newStatus === 'resolved'
          ? (isAr ? 'تم تحديد التذكرة كمحلولة بنجاح! ✅' : 'Ticket marked as resolved! ✅')
          : newStatus === 'open'
          ? (isAr ? 'تم إعادة فتح التذكرة! 🔄' : 'Ticket reopened! 🔄')
          : (isAr ? 'تم إغلاق التذكرة! 🛑' : 'Ticket closed! 🛑')
      );
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ في تحديث الحالة' : 'Status update error'));
    } finally {
      setUpdatingStatus(false);
    }
  }

  const isWhatsappEnabled = supportData.user_panel_support_enabled?.whatsapp !== false;
  const isTelegramEnabled = supportData.user_panel_support_enabled?.telegram !== false;
  const isEmailEnabled = supportData.user_panel_support_enabled?.email !== false;

  const whatsappNum = supportData.support_whatsapp?.trim() || '';
  const platformDisplayName = isAr
    ? (supportData.platform_name_ar || supportData.platform_name || '')
    : (supportData.platform_name_en || supportData.platform_name || '');
  const whatsappUrl =
    supportData.support_whatsapp_url?.trim() ||
    (whatsappNum
      ? `https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
          isAr
            ? `مرحباً فريق الدعم الفني${platformDisplayName ? ` لـ ${platformDisplayName}` : ''}، أحتاج لمساعدة بشأن حسابي.`
            : `Hello${platformDisplayName ? ` ${platformDisplayName}` : ''} support team, I need assistance with my account.`,
        )}`
      : '');
  const hasWhatsApp = Boolean((whatsappNum || whatsappUrl) && isWhatsappEnabled);

  const telegramUser = supportData.support_telegram?.trim() || '';
  const telegramUrl =
    supportData.support_telegram_url?.trim() ||
    (telegramUser
      ? telegramUser.startsWith('http')
        ? telegramUser
        : `https://t.me/${telegramUser.replace('@', '')}`
      : '');
  const hasTelegram = Boolean((telegramUser || telegramUrl) && isTelegramEnabled);

  const emailAddr = supportData.support_email?.trim() || '';
  const hasEmail = Boolean(emailAddr && isEmailEnabled);

  const activeChannelsCount = (hasWhatsApp ? 1 : 0) + (hasTelegram ? 1 : 0) + (hasEmail ? 1 : 0);

  const filteredTickets = tickets.filter((t) => {
    const isAnn = Boolean(t.broadcast_id || t.is_announcement || t.category === 'announcement' || t.category === 'offer' || t.category === 'update');

    if (ticketTypeFilter === 'tickets' && isAnn) return false;
    if (ticketTypeFilter === 'announcements' && !isAnn) return false;

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border bg-card text-card-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <Card className="border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-background p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">
                  {isAr ? 'مركز الدعم الفني والخدمة المباشرة' : 'Technical Support & Live Assistance'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? 'تواصل مع فريق الدعم عبر القنوات الخارجية أو افتح تذكرة دعم فني مباشرة داخل المنصة لمتابعة مشكلتك بالصور والرسائل'
                    : 'Contact our support team via external channels or open an in-platform support ticket to track your queries'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              onClick={() => setIsNewTicketOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {isAr ? 'إنشاء تذكرة دعم جديدة 🎫' : 'Create New Ticket 🎫'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Support Channels Grid (Only rendered if admin has configured channels) */}
      {activeChannelsCount > 0 && (
        <div
          className={`grid grid-cols-1 ${
            activeChannelsCount === 3
              ? 'md:grid-cols-3'
              : activeChannelsCount === 2
              ? 'md:grid-cols-2'
              : 'md:grid-cols-1 max-w-md'
          } gap-5`}
        >
          {/* 1. WhatsApp Support Card */}
          {hasWhatsApp && (
            <Card className="border border-emerald-500/40 bg-card p-5 space-y-4 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                    {isAr ? 'الاستجابة الأسرع ⚡' : 'Fastest Response ⚡'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isAr ? 'الدعم المباشر عبر الواتساب' : 'WhatsApp Live Support'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {isAr
                      ? 'تواصل مباشرة مع أحد ممثلي الفني على الواتساب للحصول على حلول سريعة ومباشرة.'
                      : 'Chat directly with our technical support representative on WhatsApp for instant assistance.'}
                  </p>
                </div>

                {whatsappNum && (
                  <div className="rounded-lg bg-muted/40 p-2.5 text-xs font-mono font-bold text-foreground text-center border border-border/50">
                    {whatsappNum}
                  </div>
                )}
              </div>

              <Button
                onClick={() => window.open(whatsappUrl, '_blank')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 shadow-sm py-2.5 mt-2"
              >
                <MessageCircle className="h-4 w-4" />
                {isAr ? 'محادثة الواتساب المباشرة' : 'Start WhatsApp Chat'}
                <ExternalLink className="h-3.5 w-3.5 ms-1" />
              </Button>
            </Card>
          )}

          {/* 2. Telegram Support Card */}
          {hasTelegram && (
            <Card className="border border-sky-500/40 bg-card p-5 space-y-4 shadow-sm hover:border-sky-500 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                    <Send className="h-5 w-5" />
                  </div>
                  <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px] font-bold">
                    {isAr ? 'قناة الدعم ✈️' : 'Support Channel ✈️'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isAr ? 'الدعم الفني عبر التليجرام' : 'Telegram Support Channel'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {isAr
                      ? 'انضم لقناة الدعم أو راسل البوت المباشر للاستفسارات الفنية والتحديثات.'
                      : 'Join our official Telegram support or message our bot for tech updates.'}
                  </p>
                </div>

                {telegramUser && (
                  <div className="rounded-lg bg-muted/40 p-2.5 text-xs font-mono font-bold text-foreground text-center border border-border/50">
                    {telegramUser}
                  </div>
                )}
              </div>

              <Button
                onClick={() => window.open(telegramUrl, '_blank')}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs gap-2 shadow-sm py-2.5 mt-2"
              >
                <Send className="h-4 w-4" />
                {isAr ? 'فتح تليجرام الدعم' : 'Open Telegram Support'}
                <ExternalLink className="h-3.5 w-3.5 ms-1" />
              </Button>
            </Card>
          )}

          {/* 3. Email Support Card */}
          {hasEmail && (
            <Card className="border border-indigo-500/40 bg-card p-5 space-y-4 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] font-bold">
                    {isAr ? 'مراسلات رسمية ✉️' : 'Official Support ✉️'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isAr ? 'الدعم عبر البريد الإلكتروني' : 'Email Technical Support'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {isAr
                      ? 'أرسل تفاصيل مشكلتك أو استفسارك المالي والتجاري مباشرة لبريد الدعم.'
                      : 'Email our technical and billing support team for detailed inquiries.'}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/40 p-2.5 text-xs font-mono font-bold text-foreground text-center border border-border/50 truncate">
                  {emailAddr}
                </div>
              </div>

              <Button
                onClick={() => (window.location.href = `mailto:${emailAddr}`)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 shadow-sm py-2.5 mt-2"
              >
                <Mail className="h-4 w-4" />
                {isAr ? 'إرسال بريد إلكتروني' : 'Send Support Email'}
                <ExternalLink className="h-3.5 w-3.5 ms-1" />
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* In-Platform Tickets System Section */}
      <Card className="border border-border bg-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-foreground">
                {isAr ? 'نظام تذاكر الدعم الفني داخل المنصة (Support Tickets)' : 'In-Platform Support Tickets'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'تابع تذاكرك السابقة، أرسل تفاصيل المشكلة بالصور، وتواصل مباشرة مع فريق الإدارة' : 'Track open tickets, attach images, and chat with platform admins'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {tickets.some((t) => !t.is_read_by_user) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs gap-1.5 border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isAr ? 'تحديد الكل كمقروء ✅' : 'Mark All as Read ✅'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTickets}
              disabled={ticketsLoading}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${ticketsLoading ? 'animate-spin' : ''}`} />
              {isAr ? 'تحديث التذاكر' : 'Refresh Tickets'}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsNewTicketOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {isAr ? 'تذكرة جديدة' : 'New Ticket'}
            </Button>
          </div>
        </div>

        {/* Ticket Type Sub-Tabs */}
        {(() => {
          const unreadTicketsCount = tickets.filter(
            (t) =>
              !(t.broadcast_id || t.is_announcement || t.category === 'announcement' || t.category === 'offer' || t.category === 'update') &&
              !t.is_read_by_user
          ).length;

          const unreadAnnouncementsCount = tickets.filter(
            (t) =>
              (t.broadcast_id || t.is_announcement || t.category === 'announcement' || t.category === 'offer' || t.category === 'update') &&
              !t.is_read_by_user
          ).length;

          return (
            <div className="flex items-center gap-2 border-b border-border pb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setTicketTypeFilter('tickets')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  ticketTypeFilter === 'tickets'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Headphones className="h-4 w-4" />
                {isAr ? 'تذاكر الدعم الفني 🎫' : 'My Support Tickets 🎫'}
                {unreadTicketsCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-bold animate-pulse">
                    {unreadTicketsCount}
                  </Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTicketTypeFilter('announcements')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  ticketTypeFilter === 'announcements'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Megaphone className="h-4 w-4" />
                {isAr ? 'إشعارات وعروض المنصة 📢' : 'Platform Announcements 📢'}
                {unreadAnnouncementsCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/20 text-white border border-white/40 font-mono font-bold animate-pulse">
                    {unreadAnnouncementsCount}
                  </Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTicketTypeFilter('all')}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  ticketTypeFilter === 'all'
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isAr ? 'عرض الكل' : 'View All'}
              </button>
            </div>
          );
        })()}

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute start-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isAr ? 'البحث عن تذكرة...' : 'Search tickets...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 bg-background text-xs h-9"
            />
          </div>

          {ticketTypeFilter !== 'announcements' && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-full sm:w-auto">
              {(['all', 'open', 'resolved', 'closed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all text-xs flex-1 sm:flex-none ${
                    statusFilter === st
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st === 'all'
                    ? (isAr ? 'الكل' : 'All')
                    : st === 'open'
                    ? (isAr ? 'قيد المتابعة 🟡' : 'Open 🟡')
                    : st === 'resolved'
                    ? (isAr ? 'تم الحل 🟢' : 'Resolved 🟢')
                    : (isAr ? 'مغلقة 🔴' : 'Closed 🔴')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tickets List */}
        {ticketsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-10 space-y-3 rounded-2xl border border-dashed border-border bg-muted/20">
            <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <p className="text-xs text-muted-foreground font-semibold">
              {isAr ? 'لا توجد تذاكر دعم فني تطابق هذا البحث حالياً' : 'No support tickets found'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNewTicketOpen(true)}
              className="text-xs font-bold"
            >
              {isAr ? 'أنشئ أول تذكرة دعم ➕' : 'Open First Ticket ➕'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredTickets.map((t) => {
              const isAnn = Boolean(t.broadcast_id || t.is_announcement || t.category === 'announcement' || t.category === 'offer' || t.category === 'update');
              return (
                <div
                  key={t.id}
                  onClick={() => handleOpenTicketChat(t)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${
                    isAnn
                      ? 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60 hover:bg-purple-500/10'
                      : 'border-border bg-background hover:border-emerald-500/40 hover:bg-emerald-500/5'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-foreground group-hover:text-emerald-400 transition-colors">
                        {t.subject}
                      </span>
                      {isAnn ? (
                        <Badge
                          variant="outline"
                          className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Megaphone className="h-3 w-3 text-purple-400" />
                          {isAr ? 'إشعار إداري رسمي 📢' : 'Official Announcement 📢'}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            t.status === 'open'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : t.status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {t.status === 'open'
                            ? (isAr ? 'قيد المتابعة 🟡' : 'Open 🟡')
                            : t.status === 'resolved'
                            ? (isAr ? 'تم حل المشكلة 🟢' : 'Resolved 🟢')
                            : (isAr ? 'مغلقة 🔴' : 'Closed 🔴')}
                        </Badge>
                      )}
                      {!t.is_read_by_user && (
                        <Badge className="bg-amber-500 text-slate-950 text-[9px] font-black animate-bounce px-1.5 py-0">
                          {isAr ? 'جديد ✨' : 'New ✨'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{isAr ? `تاريخ الإشعار: ${new Date(t.created_at).toLocaleDateString()}` : `Date: ${new Date(t.created_at).toLocaleDateString()}`}</span>
                      <span>•</span>
                      <span>{isAr ? `الوقت: ${new Date(t.last_reply_at).toLocaleTimeString()}` : `Time: ${new Date(t.last_reply_at).toLocaleTimeString()}`}</span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className={`text-xs font-bold gap-1 group-hover:translate-x-1 transition-transform ${isAnn ? 'text-purple-400' : 'text-emerald-400'}`}>
                    {isAnn ? (isAr ? 'مشاهدة الإشعار 👁️' : 'View Notification 👁️') : (isAr ? 'عرض المحادثة' : 'View Thread')}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* New Ticket Modal */}
      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              {isAr ? 'إنشاء تذكرة دعم فني جديدة' : 'Create New Support Ticket'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr ? 'اشرح المشكلة بالتفصيل ويمكنك إرفاق صور التقرير أو الخطأ لسرعة حلها' : 'Describe the issue and attach screenshots for faster resolution'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs pt-2">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">{isAr ? 'عنوان المشكلة / الموضوع:' : 'Ticket Subject:'}</label>
              <Input
                type="text"
                required
                placeholder={isAr ? 'مثال: خطأ في ربط الواتساب أو ترقية الباقة...' : 'e.g. Issue pairing WhatsApp or upgrading plan...'}
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="bg-background border-border text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">{isAr ? 'الأولوية:' : 'Priority:'}</label>
                <select
                  value={newPriority}
                  onChange={(e: any) => setNewPriority(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground"
                >
                  <option value="low">{isAr ? 'عادية / Low' : 'Low'}</option>
                  <option value="medium">{isAr ? 'متوسطة / Medium' : 'Medium'}</option>
                  <option value="high">{isAr ? 'عالية / High' : 'High'}</option>
                  <option value="urgent">{isAr ? 'عاجلة جداً / Urgent 🚨' : 'Urgent 🚨'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">{isAr ? 'شرح تفاصيل المشكلة:' : 'Detailed Description:'}</label>
              <textarea
                rows={4}
                required
                placeholder={isAr ? 'اكتب كافة التفاصيل التي واجهتك لكي نساعدك فوراً...' : 'Write all details of the issue...'}
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground resize-none leading-relaxed"
              />
            </div>

            {/* Attachments Section */}
            <div className="space-y-2">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>{isAr ? 'إرفاق صور أو لقطات شاشة (مختاري):' : 'Attach Screenshots (Optional):'}</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, false);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="h-7 text-[11px] gap-1"
                >
                  {uploadingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />}
                  {isAr ? 'رفع صورة 📷' : 'Upload Image 📷'}
                </Button>
              </label>

              {newAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {newAttachments.map((att, idx) => (
                    <div key={idx} className="relative group rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-1.5 flex items-center gap-2 text-[11px]">
                      <img src={att.url} alt={att.name} className="h-8 w-8 object-cover rounded-lg" />
                      <span className="truncate max-w-[120px] font-mono text-[10px]">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setNewAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewTicketOpen(false)}
                className="text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={submittingTicket}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5"
              >
                {submittingTicket ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {isAr ? 'إرسال التذكرة الآن 🚀' : 'Submit Ticket Now 🚀'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Chat / System Announcement Modal */}
      {selectedTicket && (() => {
        const isAnn = Boolean(selectedTicket.broadcast_id || selectedTicket.is_announcement || selectedTicket.category === 'announcement' || selectedTicket.category === 'offer' || selectedTicket.category === 'update');
        return (
          <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => { if (!open) handleCloseTicketChat(); }}>
            <DialogContent className="sm:max-w-3xl w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden">
              {/* Header */}
              <div className={`p-3 sm:p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${isAnn ? 'bg-purple-500/10 border-purple-500/30' : 'bg-muted/30'}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                      {isAnn && <Megaphone className="h-4 w-4 text-purple-400 shrink-0" />}
                      {selectedTicket.subject}
                    </h3>
                    {isAnn ? (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px] font-bold">
                        {isAr ? '📢 إشعار إداري رسمي (للقراءة فقط)' : '📢 Official Platform Announcement (Read-only)'}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          selectedTicket.status === 'open'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : selectedTicket.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {selectedTicket.status === 'open'
                          ? (isAr ? 'مفتوحة 🟡' : 'Open 🟡')
                          : selectedTicket.status === 'resolved'
                          ? (isAr ? 'تم حل المشكلة 🟢' : 'Resolved 🟢')
                          : (isAr ? 'مغلقة 🔴' : 'Closed 🔴')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                    {isAr ? `تاريخ الإشعار: ${new Date(selectedTicket.created_at).toLocaleString()}` : `Sent: ${new Date(selectedTicket.created_at).toLocaleString()}`}
                  </p>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 min-h-[280px] sm:min-h-[300px] max-h-[450px] bg-background">
                {messagesLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : ticketMessages.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-10">{isAr ? 'لا توجد رسائل سابقة' : 'No messages yet'}</p>
                ) : (
                  ticketMessages.map((msg) => {
                    const isAdmin = msg.sender_type === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                      >
                        {isAdmin && (
                          <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center shrink-0 ${isAnn ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300' : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'}`}>
                            {isAnn ? <Megaphone className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                          </div>
                        )}

                        <div
                          className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3 text-xs space-y-2 shadow-sm ${
                            isAdmin
                              ? isAnn
                                ? 'bg-purple-500/10 border border-purple-500/30 text-foreground rounded-tl-none'
                                : 'bg-emerald-500/10 border border-emerald-500/30 text-foreground rounded-tl-none'
                              : 'bg-indigo-600 text-white rounded-tr-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1 text-[10px] opacity-80">
                            <span className="font-bold">{isAdmin ? (isAnn ? (isAr ? 'إدارة المنصة (Official Admin 📢)' : 'Platform Management 📢') : (isAr ? 'فريق الدعم (Admin 🛡️)' : 'Platform Support (Admin 🛡️)')) : (isAr ? 'أنت' : 'You')}</span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <p className="leading-relaxed whitespace-pre-wrap">{renderFormattedMessage(msg.message_text)}</p>

                          {/* Image Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {msg.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-xl overflow-hidden border border-white/20 hover:opacity-90 transition-opacity"
                                >
                                  <img src={att.url} alt={att.name || 'Attachment'} className="max-h-48 w-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {!isAdmin && (
                          <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Footer Reply Form or Read-Only Announcement Banner */}
              {isAnn ? (
                <div className="p-4 bg-purple-500/10 border-t border-purple-500/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-purple-300 font-bold">
                    <Megaphone className="h-4 w-4 text-purple-400 shrink-0 animate-pulse" />
                    <span>
                      {isAr
                        ? '📢 هذا إشعار إداري رسمي من المنصة للعرض والإطلاع فقط (لا يمكن الرد عليه).'
                        : '📢 Official Platform Announcement (For view only - Replies disabled).'}
                    </span>
                  </div>
                </div>
              ) : selectedTicket.status === 'closed' || selectedTicket.status === 'resolved' ? (
                <div className="p-4 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>
                      {isAr
                        ? 'هذه التذكرة مغلقة حالياً. إذا كان لديك استفسار جديد يرجى إنشاء تذكرة دعم مخصصة.'
                        : 'This ticket is closed. Please open a new ticket to send further messages.'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(null);
                      setIsNewTicketOpen(true);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    {isAr ? 'تذكرة جديدة 🎫' : 'New Ticket 🎫'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="p-3 border-t border-border bg-muted/20 space-y-2">
                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-1">
                      {replyAttachments.map((att, idx) => (
                        <div key={idx} className="relative group rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-1 flex items-center gap-2 text-[10px]">
                          <img src={att.url} alt={att.name} className="h-6 w-6 object-cover rounded" />
                          <span className="truncate max-w-[100px]">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-rose-400 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={replyFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, true);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => replyFileInputRef.current?.click()}
                      className="h-9 w-9 text-muted-foreground hover:text-emerald-400 shrink-0"
                      title={isAr ? 'إرفاق صورة' : 'Attach Image'}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>

                    <Input
                      type="text"
                      placeholder={isAr ? 'اكتب ردك هنا...' : 'Type your message...'}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="bg-background border-border text-xs h-9 flex-1"
                    />

                    <Button
                      type="submit"
                      disabled={sendingReply || (!replyText.trim() && replyAttachments.length === 0)}
                      className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs h-9 px-4 gap-1 shrink-0"
                    >
                      {sendingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {isAr ? 'إرسال' : 'Send'}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
